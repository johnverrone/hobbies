import { Octokit } from "octokit";

const OWNER = "johnverrone";
const REPO = "hobbies";

export interface UpdateFileResult {
  prUrl: string;
  branch: string;
}

export interface UpdateFileOptions {
  token: string;
  filePath: string;
  newContent: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

/**
 * Full flow: create branch → commit file update → open PR.
 */
export async function updateFileAndCreatePR({
  token,
  filePath,
  newContent,
  commitMessage,
  prTitle,
  prBody,
}: UpdateFileOptions): Promise<UpdateFileResult> {
  const octokit = new Octokit({ auth: token });
  const branch = `mcp/update-${Date.now()}`;

  // 1. Get main HEAD SHA + existing file SHA in parallel
  const [{ data: ref }, fileSha] = await Promise.all([
    octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: "heads/main",
    }),
    octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: "main",
    }).then(({ data }) =>
      !Array.isArray(data) && data.type === "file" ? data.sha : undefined
    ).catch(() => undefined), // File doesn't exist yet — that's fine
  ]);

  // 2. Create branch
  await octokit.rest.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${branch}`,
    sha: ref.object.sha,
  });

  // 3. Commit the file
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: filePath,
    message: commitMessage,
    content: btoa(newContent),
    branch,
    ...(fileSha ? { sha: fileSha } : {}),
  });

  // 4. Open PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: prTitle,
    body: prBody,
    head: branch,
    base: "main",
  });

  return { prUrl: pr.html_url, branch };
}
