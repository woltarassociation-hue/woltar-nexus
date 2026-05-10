const KEY = "woltar_profiles";
const SESSION_KEY = "woltar_session";

const ROLE_LABELS = {
  admin: "Administrateur",
  artiste: "Artistes",
  communication: "Communication",
  custom: "Personnalisé",
};

const DEFAULT_PROFILES = [
  {
    id: "default-admin",
    name: "Administrateur",
    role: "admin",
    username: "association",
    password: "woltar2026",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-artiste",
    name: "Artistes",
    role: "artiste",
    username: "artiste",
    password: "woltar2026",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-comm",
    name: "Communication",
    role: "communication",
    username: "communication",
    password: "woltar2026",
    createdAt: new Date().toISOString(),
  },
];

export { ROLE_LABELS };

export function getProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!stored || stored.length === 0) {
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    return stored;
  } catch {
    return DEFAULT_PROFILES;
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
  const profiles = getProfiles();
  return profiles.find(
    (p) => p.username.trim().toLowerCase() === username.trim().toLowerCase() && p.password === password
  ) || null;
}

export function setSession(profile) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: profile.id, name: profile.name, role: profile.role }));
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
