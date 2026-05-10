const KEY = "woltar_profiles";
const SESSION_KEY = "woltar_session";

const DEFAULT_PROFILES = [
  { id: "default-admin",  name: "Administrateur", role: "admin",         username: "association",   password: "woltar2026" },
  { id: "default-artiste", name: "Artistes",       role: "artiste",       username: "artiste",       password: "woltar2026" },
  { id: "default-comm",   name: "Communication",   role: "communication", username: "communication", password: "woltar2026" },
];

export function seedDefaultProfiles() {
  const stored = JSON.parse(localStorage.getItem(KEY) || "null");
  if (stored && stored.length > 0) return;
  const now = new Date().toISOString();
  const seeded = DEFAULT_PROFILES.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
  localStorage.setItem(KEY, JSON.stringify(seeded));
}

export const ROLE_LABELS = {
  admin: "Administrateur",
  artiste: "Artistes",
  communication: "Communication",
  custom: "Personnalisé",
};

/* Retourne true si au moins un compte a été créé via le formulaire d'inscription.
   Les profils auto-générés ("default-*") ne comptent pas. */
export function isConfigured() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!stored || stored.length === 0) return false;
    return stored.some((p) => !String(p.id).startsWith("default-"));
  } catch {
    return false;
  }
}

export function getProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!stored || stored.length === 0) return [];
    return stored;
  } catch {
    return [];
  }
}

export function saveProfile(data) {
  const all = getProfiles();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("woltar:profiles"));
  return record;
}

export function deleteProfile(id) {
  const all = getProfiles().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("woltar:profiles"));
}

export function authenticate(username, password) {
  return getProfiles().find(
    (p) =>
      p.username.trim().toLowerCase() === username.trim().toLowerCase() &&
      p.password === password
  ) || null;
}

export function setSession(profile) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: profile.id, name: profile.name, role: profile.role })
  );
}

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
