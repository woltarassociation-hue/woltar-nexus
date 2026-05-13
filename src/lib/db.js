import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isConfigured = Boolean(url && key);

if (!isConfigured) {
  console.warn(
    "[Woltar Nexus] Supabase non configuré.\n" +
    "→ Remplissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local\n" +
    "→ Supabase Dashboard : Settings → API\n" +
    "→ Relancez le serveur Vite après modification."
  );
}

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        storageKey:       "woltar_auth",
      },
    })
  : null;

export function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), ms)
    ),
  ]);
}

// camelCase → snake_case (clés de premier niveau uniquement)
export function toDb(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = v;
  }
  return out;
}

// snake_case → camelCase (clés de premier niveau uniquement)
export function fromDb(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}
