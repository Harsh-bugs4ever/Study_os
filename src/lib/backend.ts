/**
 * Thin wrapper for calling the self-hosted StudyOS backend.
 *
 * Usage:
 *   const data = await callBackend('generate-learning', { subject, subtopic, mode });
 *   const data = await callBackend('saathi-chat', { messages, context });
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function callBackend(
  endpoint: string,
  body: Record<string, unknown>,
  token?: string | null,
): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/functions/v1/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `Backend error ${res.status}`;
    try { const j = await res.json(); msg = j?.detail || j?.message || msg; } catch {}
    throw new Error(msg);
  }

  return res.json();
}

/**
 * Streaming variant — returns the raw Response so the caller can read
 * the SSE stream via response.body.
 */
export async function streamBackend(
  endpoint: string,
  body: Record<string, unknown>,
  token?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}/functions/v1/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `Backend error ${res.status}`;
    try { const j = await res.json(); msg = j?.detail || j?.message || msg; } catch {}
    throw new Error(msg);
  }

  return res;
}
