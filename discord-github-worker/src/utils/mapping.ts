// KV 매핑 관리
// issue:{owner}/{repo}/{issueNumber} → Discord 포스트 ID
// post:{postId} → {owner}/{repo}/{issueNumber}
// notion:{owner}/{repo}/{issueNumber} → Notion 페이지 ID

export interface IssueMapping {
  owner: string;
  repo: string;
  issueNumber: number;
}

export async function getDiscordPostId(
  kv: KVNamespace,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<string | null> {
  const key = `issue:${owner}/${repo}/${issueNumber}`;
  return await kv.get(key);
}

export async function getIssueFromPost(
  kv: KVNamespace,
  postId: string
): Promise<IssueMapping | null> {
  const key = `post:${postId}`;
  const value = await kv.get(key);
  if (!value) return null;

  const [owner, repo, issueNumber] = value.split('/');
  return {
    owner,
    repo: repo.replace(/\/\d+$/, ''),
    issueNumber: parseInt(issueNumber, 10)
  };
}

export async function createMapping(
  kv: KVNamespace,
  owner: string,
  repo: string,
  issueNumber: number,
  postId: string
): Promise<void> {
  const issueKey = `issue:${owner}/${repo}/${issueNumber}`;
  const postKey = `post:${postId}`;
  const issueValue = `${owner}/${repo}/${issueNumber}`;

  await Promise.all([
    kv.put(issueKey, postId),
    kv.put(postKey, issueValue)
  ]);
}

export async function deleteMapping(
  kv: KVNamespace,
  owner: string,
  repo: string,
  issueNumber: number,
  postId: string
): Promise<void> {
  const issueKey = `issue:${owner}/${repo}/${issueNumber}`;
  const postKey = `post:${postId}`;

  await Promise.all([
    kv.delete(issueKey),
    kv.delete(postKey)
  ]);
}

// Notion 페이지 ID 조회
export async function getNotionPageId(
  kv: KVNamespace,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<string | null> {
  const key = `notion:${owner}/${repo}/${issueNumber}`;
  return await kv.get(key);
}

// Notion 매핑 저장
export async function createNotionMapping(
  kv: KVNamespace,
  owner: string,
  repo: string,
  issueNumber: number,
  notionPageId: string
): Promise<void> {
  const key = `notion:${owner}/${repo}/${issueNumber}`;
  await kv.put(key, notionPageId);
}

// Notion 매핑 삭제
export async function deleteNotionMapping(
  kv: KVNamespace,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  const key = `notion:${owner}/${repo}/${issueNumber}`;
  await kv.delete(key);
}
