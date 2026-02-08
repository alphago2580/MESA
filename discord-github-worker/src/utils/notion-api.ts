// Notion API 호출 유틸리티

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

interface NotionPageProperties {
  title: string;
  issueNumber: number;
  githubUrl: string;
  state: 'open' | 'closed';
  author: string;
  createdAt: string;
  type?: 'issue' | 'pr';
}

async function notionFetch(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${NOTION_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
      ...options.headers,
    },
  });
  return response;
}

// Notion 데이터베이스에 페이지(이슈) 생성
export async function createNotionPage(
  apiKey: string,
  databaseId: string,
  properties: NotionPageProperties
): Promise<{ id: string } | null> {
  // 상태 매핑: open → 📋 To Do, closed → ❌ 닫힘
  const statusName = properties.state === 'open' ? '📋 To Do' : '❌ 닫힘';
  // 타입 매핑
  const typeName = properties.type === 'pr' ? '📝 PR' : '✨ Feature';

  const response = await notionFetch(
    '/pages',
    apiKey,
    {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          '프로젝트 이름': {
            title: [
              {
                text: {
                  content: properties.title,
                },
              },
            ],
          },
          '번호': {
            number: properties.issueNumber,
          },
          'GitHub 링크': {
            url: properties.githubUrl,
          },
          '상태': {
            multi_select: [{ name: statusName }],
          },
          '타입': {
            select: { name: typeName },
          },
          '생성일': {
            date: {
              start: properties.createdAt,
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create Notion page:', errorText);
    return null;
  }

  const data = await response.json() as { id: string };
  console.log(`Created Notion page: ${data.id}`);
  return { id: data.id };
}

// Notion 페이지 상태 업데이트
export async function updateNotionPageStatus(
  apiKey: string,
  pageId: string,
  state: 'open' | 'closed'
): Promise<boolean> {
  const statusName = state === 'open' ? '📋 To Do' : '❌ 닫힘';

  const response = await notionFetch(
    `/pages/${pageId}`,
    apiKey,
    {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          '상태': {
            multi_select: [{ name: statusName }],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update Notion page:', errorText);
    return false;
  }

  console.log(`Updated Notion page ${pageId} status to ${state}`);
  return true;
}

// Notion 페이지 제목 업데이트 (이슈 제목 변경 시)
export async function updateNotionPageTitle(
  apiKey: string,
  pageId: string,
  title: string
): Promise<boolean> {
  const response = await notionFetch(
    `/pages/${pageId}`,
    apiKey,
    {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          '프로젝트 이름': {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update Notion page title:', errorText);
    return false;
  }

  console.log(`Updated Notion page ${pageId} title`);
  return true;
}
