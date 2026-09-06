export const RISK_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Moderate: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
};

export const RISK_BG: Record<string, string> = {
  Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Moderate: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Critical: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export async function apiGet(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiSend(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} ${path} failed`);
  return data;
}

export function timeAgo(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
