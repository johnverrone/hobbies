import { Octokit } from "octokit";

const OWNER = "johnverrone";
const REPO = "hobbies";
const BRANCH_PREFIX = "mcp/update-";

export interface UpdateFileResult {
  prUrl: string;
  branch: string;
}

export interface FileToCommit {
  path: string;                    // repo-relative, e.g. "hobbies/coffee/beans/foo.yaml"
  content: string;                 // text or base64
  encoding?: "utf-8" | "base64";  // default "utf-8"
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
  const branch = `${BRANCH_PREFIX}${Date.now()}`;

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

/**
 * Multi-file atomic commit: create blobs → tree → commit → branch → PR.
 */
export async function commitFilesAndCreatePR({
  token,
  files,
  commitMessage,
  prTitle,
  prBody,
}: {
  token: string;
  files: FileToCommit[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
}): Promise<UpdateFileResult> {
  const octokit = new Octokit({ auth: token });
  const branch = `${BRANCH_PREFIX}${Date.now()}`;

  // 1. Get main HEAD + create blobs in parallel (independent operations)
  const [{ data: ref }, blobs] = await Promise.all([
    octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: "heads/main",
    }),
    Promise.all(
      files.map((f) =>
        octokit.rest.git.createBlob({
          owner: OWNER,
          repo: REPO,
          content: f.content,
          encoding: f.encoding ?? "utf-8",
        })
      )
    ),
  ]);
  const baseSha = ref.object.sha;

  // 3. Create tree
  const { data: tree } = await octokit.rest.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseSha,
    tree: files.map((f, i) => ({
      path: f.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: blobs[i].data.sha,
    })),
  });

  // 4. Create commit
  const { data: commit } = await octokit.rest.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: commitMessage,
    tree: tree.sha,
    parents: [baseSha],
  });

  // 5. Create branch
  await octokit.rest.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${branch}`,
    sha: commit.sha,
  });

  // 6. Open PR
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
