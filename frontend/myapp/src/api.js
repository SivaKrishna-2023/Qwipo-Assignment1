const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await res.json();
    if (!res.ok) throw { status: res.status, body: json };
    return json;
  } else {
    if (!res.ok) throw { status: res.status, body: null };
    return null;
  }
}
