const BASE_URL = 'http://localhost:3001/api';

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const { method = 'GET', body, token, headers = {} } = options;

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, fetchOptions);
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return {
      status: res.status,
      ok: res.ok,
      data,
      headers: res.headers,
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      error: err.message,
    };
  }
}

export function logResult(taskName, passed, details = '') {
  const mark = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${mark} ${taskName} - ${details}`);
}
