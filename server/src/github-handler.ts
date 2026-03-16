import { env } from "cloudflare:workers";
import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Octokit } from "octokit";
import { fetchUpstreamAuthToken, getUpstreamAuthorizeUrl, type Props } from "./utils";
import {
  addApprovedClient,
  bindStateToSession,
  createOAuthState,
  generateCSRFProtection,
  isClientApproved,
  OAuthError,
  renderApprovalDialog,
  validateCSRFToken,
  validateOAuthState,
} from "./workers-oauth-utils";

// Import REST API sub-routers
import guitar from "./routes/guitar";
import coffee from "./routes/coffee";
import software from "./routes/software";
import running from "./routes/running";
import strength from "./routes/strength";
import video from "./routes/video";
import photography from "./routes/photography";
import golf from "./routes/golf";

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

// ---------------------------------------------------------------------------
// CORS for the REST API (unchanged from original)
// ---------------------------------------------------------------------------
app.use(
  "*",
  cors({
    origin: [
      "https://johnverrone.com",
      "https://www.johnverrone.com",
      "http://localhost:5173",
    ],
    allowMethods: ["GET", "OPTIONS"],
  }),
);

// ---------------------------------------------------------------------------
// REST API routes (public, no auth needed)
// ---------------------------------------------------------------------------
app.get("/", (c) => c.text("Hello Hono!"));
app.route("/guitar", guitar);
app.route("/coffee", coffee);
app.route("/software", software);
app.route("/running", running);
app.route("/strength", strength);
app.route("/video", video);
app.route("/photography", photography);
app.route("/golf", golf);

// ---------------------------------------------------------------------------
// OAuth flow routes
// ---------------------------------------------------------------------------

app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const { clientId } = oauthReqInfo;
  if (!clientId) return c.text("Invalid request", 400);

  // Skip approval dialog if client already approved
  if (await isClientApproved(c.req.raw, clientId, env.COOKIE_ENCRYPTION_KEY)) {
    const { stateToken } = await createOAuthState(oauthReqInfo, c.env.OAUTH_KV);
    const { setCookie: sessionBindingCookie } = await bindStateToSession(stateToken);
    return redirectToGithub(c.req.raw, stateToken, { "Set-Cookie": sessionBindingCookie });
  }

  const { token: csrfToken, setCookie } = generateCSRFProtection();

  return renderApprovalDialog(c.req.raw, {
    client: await c.env.OAUTH_PROVIDER.lookupClient(clientId),
    csrfToken,
    server: {
      name: "Hobbies MCP Server",
      description: "Grant this MCP client access to your hobbies data via your GitHub account.",
    },
    setCookie,
    state: { oauthReqInfo },
  });
});

app.post("/authorize", async (c) => {
  try {
    const formData = await c.req.raw.formData();
    validateCSRFToken(formData, c.req.raw);

    const encodedState = formData.get("state");
    if (!encodedState || typeof encodedState !== "string") return c.text("Missing state in form data", 400);

    let state: { oauthReqInfo?: AuthRequest };
    try { state = JSON.parse(atob(encodedState)); }
    catch { return c.text("Invalid state data", 400); }

    if (!state.oauthReqInfo || !state.oauthReqInfo.clientId) return c.text("Invalid request", 400);

    const approvedClientCookie = await addApprovedClient(c.req.raw, state.oauthReqInfo.clientId, c.env.COOKIE_ENCRYPTION_KEY);
    const { stateToken } = await createOAuthState(state.oauthReqInfo, c.env.OAUTH_KV);
    const { setCookie: sessionBindingCookie } = await bindStateToSession(stateToken);

    const headers = new Headers();
    headers.append("Set-Cookie", approvedClientCookie);
    headers.append("Set-Cookie", sessionBindingCookie);

    return redirectToGithub(c.req.raw, stateToken, Object.fromEntries(headers));
  } catch (error: any) {
    console.error("POST /authorize error:", error);
    if (error instanceof OAuthError) return error.toResponse();
    return c.text(`Internal server error: ${error.message}`, 500);
  }
});

async function redirectToGithub(
  request: Request,
  stateToken: string,
  headers: Record<string, string> = {},
) {
  return new Response(null, {
    headers: {
      ...headers,
      location: getUpstreamAuthorizeUrl({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: new URL("/callback", request.url).href,
        scope: "repo",
        state: stateToken,
        upstream_url: "https://github.com/login/oauth/authorize",
      }),
    },
    status: 302,
  });
}

/**
 * OAuth callback from GitHub. Exchanges the code for a token,
 * fetches user info, and completes the MCP authorization flow.
 */
app.get("/callback", async (c) => {
  let oauthReqInfo: AuthRequest;
  let clearSessionCookie: string;

  try {
    const result = await validateOAuthState(c.req.raw, c.env.OAUTH_KV);
    oauthReqInfo = result.oauthReqInfo;
    clearSessionCookie = result.clearCookie;
  } catch (error: any) {
    if (error instanceof OAuthError) return error.toResponse();
    return c.text("Internal server error", 500);
  }

  if (!oauthReqInfo.clientId) return c.text("Invalid OAuth request data", 400);

  // Exchange auth code for GitHub access token
  const [accessToken, errResponse] = await fetchUpstreamAuthToken({
    client_id: c.env.GITHUB_CLIENT_ID,
    client_secret: c.env.GITHUB_CLIENT_SECRET,
    code: c.req.query("code"),
    redirect_uri: new URL("/callback", c.req.url).href,
    upstream_url: "https://github.com/login/oauth/access_token",
  });
  if (errResponse) return errResponse;

  // Fetch authenticated GitHub user info
  const user = await new Octokit({ auth: accessToken }).rest.users.getAuthenticated();
  const { login, name, email } = user.data;

  // Complete the MCP authorization — props are encrypted and stored in the token
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    metadata: { label: name ?? login },
    props: {
      accessToken,
      email: email ?? "",
      login,
      name: name ?? login,
    } as Props,
    request: oauthReqInfo,
    scope: oauthReqInfo.scope,
    userId: login,
  });

  const headers = new Headers({ Location: redirectTo });
  if (clearSessionCookie) headers.set("Set-Cookie", clearSessionCookie);

  return new Response(null, { status: 302, headers });
});

export { app as GitHubHandler };
