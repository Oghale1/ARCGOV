// ArcGov — client helper for submitting forms through the server-side
// /api/submit route (which writes with the Supabase service role and bypasses
// RLS). Replaces direct browser-side `supabase.from(...).insert(...)` calls,
// which failed under Row Level Security.

export interface SubmitResult {
  ok: boolean;
  ref?: string | null;
  id?: string | number | null;
  error?: string;
  code?: string;
}

export async function submitForm(
  kind: string,
  payload: Record<string, any>
): Promise<SubmitResult> {
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) {
      return { ok: false, error: json?.error || `Request failed (${res.status})`, code: json?.code };
    }
    return { ok: true, ref: json.ref, id: json.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}
