const API_BASE = 'https://qwipo-assignment1-hq3x.onrender.com/api';

export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });

  const contentType = res.headers.get('content-type');
  let json = null;
  if (contentType && contentType.includes('application/json')) {
    json = await res.json();
  }

  if (!res.ok) {
    const error = new Error('API request failed');
    error.status = res.status;
    error.body = json;
    throw error;
  }

  return json;
}
