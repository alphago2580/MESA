// GitHub API 호출 유틸리티 (GitHub App 인증)

const GITHUB_API_BASE = 'https://api.github.com';

// JWT 생성을 위한 Base64URL 인코딩
function base64urlEncode(data: Uint8Array | string): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...data);
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// PEM 형식의 private key 파싱 (PKCS#1 → PKCS#8 변환 포함)
function pemToArrayBuffer(pem: string): ArrayBuffer {
  let decodedPem = pem.trim();

  // base64로 인코딩된 PEM인 경우 먼저 디코딩
  if (!decodedPem.includes('-----BEGIN')) {
    decodedPem = decodedPem.replace(/[\r\n\s]/g, '');
    decodedPem = atob(decodedPem);
  }

  const isPkcs1 = decodedPem.includes('BEGIN RSA PRIVATE KEY');

  const base64 = decodedPem
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/[\r\n\s]/g, '');

  // base64 패딩 보정
  let paddedBase64 = base64;
  const remainder = base64.length % 4;
  if (remainder > 0) {
    paddedBase64 += '='.repeat(4 - remainder);
  }

  const binary = atob(paddedBase64);
  const pkcs1Bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    pkcs1Bytes[i] = binary.charCodeAt(i);
  }

  if (!isPkcs1) {
    return pkcs1Bytes.buffer;
  }

  // PKCS#1 → PKCS#8 변환
  // PKCS#8 헤더: SEQUENCE { version, algorithm, key }
  const pkcs8Header = new Uint8Array([
    0x30, 0x82, 0x00, 0x00, // SEQUENCE, length placeholder
    0x02, 0x01, 0x00,       // INTEGER version = 0
    0x30, 0x0d,             // SEQUENCE (algorithm)
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // OID rsaEncryption
    0x05, 0x00,             // NULL
    0x04, 0x82, 0x00, 0x00  // OCTET STRING, length placeholder
  ]);

  const totalLen = pkcs8Header.length + pkcs1Bytes.length - 4;
  const keyLen = pkcs1Bytes.length;

  // 전체 길이 설정 (Big Endian)
  pkcs8Header[2] = ((totalLen >> 8) & 0xff);
  pkcs8Header[3] = (totalLen & 0xff);

  // OCTET STRING 길이 설정
  pkcs8Header[24] = ((keyLen >> 8) & 0xff);
  pkcs8Header[25] = (keyLen & 0xff);

  const pkcs8Bytes = new Uint8Array(pkcs8Header.length + pkcs1Bytes.length);
  pkcs8Bytes.set(pkcs8Header);
  pkcs8Bytes.set(pkcs1Bytes, pkcs8Header.length);

  return pkcs8Bytes.buffer;
}

// GitHub App JWT 생성
async function createJWT(appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,       // 60초 전
    exp: now + 10 * 60,  // 10분 후
    iss: appId,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const keyData = pemToArrayBuffer(privateKey);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(message)
  );

  const signatureB64 = base64urlEncode(new Uint8Array(signature));
  return `${message}.${signatureB64}`;
}

// Installation access token 획득
async function getInstallationToken(
  appId: string,
  privateKey: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const jwt = await createJWT(appId, privateKey);

  // 먼저 installation ID 획득
  const installResponse = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/installation`,
    {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'discord-github-worker',
      },
    }
  );

  if (!installResponse.ok) {
    console.error('Failed to get installation:', await installResponse.text());
    return null;
  }

  const installation = await installResponse.json() as { id: number };

  // Access token 생성
  const tokenResponse = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installation.id}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'discord-github-worker',
      },
    }
  );

  if (!tokenResponse.ok) {
    console.error('Failed to get access token:', await tokenResponse.text());
    return null;
  }

  const tokenData = await tokenResponse.json() as { token: string };
  return tokenData.token;
}

// GitHub 이슈에 코멘트 추가
export async function addIssueComment(
  appId: string,
  privateKey: string,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<{ id: number } | null> {
  const token = await getInstallationToken(appId, privateKey, owner, repo);
  if (!token) return null;

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'discord-github-worker',
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    console.error('Failed to add comment:', await response.text());
    return null;
  }

  return await response.json() as { id: number };
}

// GitHub 이슈 생성
export async function createIssue(
  appId: string,
  privateKey: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[] = []
): Promise<{ number: number; html_url: string } | null> {
  const token = await getInstallationToken(appId, privateKey, owner, repo);
  if (!token) return null;

  const payload: { title: string; body: string; labels?: string[] } = { title, body };
  if (labels.length > 0) payload.labels = labels;

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'discord-github-worker',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    console.error('Failed to create issue:', await response.text());
    return null;
  }

  return await response.json() as { number: number; html_url: string };
}

// GitHub webhook 서명 검증
export async function verifyGitHubSignature(
  secret: string,
  signature: string,
  payload: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSig = 'sha256=' + Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // timing-safe 비교
    if (signature.length !== expectedSig.length) return false;
    const a = encoder.encode(signature);
    const b = encoder.encode(expectedSig);
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  } catch (error) {
    console.error('GitHub signature verification failed:', error);
    return false;
  }
}
