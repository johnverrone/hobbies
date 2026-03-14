import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { HobbiesMCP } from "./mcp";
import { GitHubHandler } from "./github-handler";

// Re-export the Durable Object class so wrangler can find it
export { HobbiesMCP };

export default new OAuthProvider({
  apiHandler: HobbiesMCP.serve("/mcp"),
  apiRoute: "/mcp",
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/register",
  defaultHandler: GitHubHandler as any,
  tokenEndpoint: "/token",
});
