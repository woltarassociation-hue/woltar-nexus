const KEY = "woltar_members";
const SESSION_KEY = "woltar_member_session";

function dispatch() {
  window.dispatchEvent(new Event("woltar:members"));
}

export function getAllMembers() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function getMemberById(id) {
  return getAllMembers().find((m) => m.id === id) || null;
}

export function upsertMember(data) {
  const all = getAllMembers();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, updatedAt: now, createdAt: data.createdAt || now };
  const idx = all.findIndex((m) => m.id === id);
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  return record;
}

export function deleteMember(id) {
  const all = getAllMembers().filter((m) => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
}

export function authenticateMember(pseudo, password) {
  return (
    getAllMembers().find(
      (m) =>
        m.pseudo.trim().toLowerCase() === pseudo.trim().toLowerCase() &&
        m.password === password
    ) || null
  );
}

export function pseudoExists(pseudo, excludeId = null) {
  return getAllMembers().some(
    (m) =>
      m.pseudo.trim().toLowerCase() === pseudo.trim().toLowerCase() &&
      m.id !== excludeId
  );
}

export function setMemberSession(member) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: member.id,
      pseudo: member.pseudo,
      role: member.role || "membre",
      avatar: member.avatar || null,
    })
  );
}

export function getMemberSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearMemberSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const MEMBER_ROLE_LABELS = {
  membre: "Membre",
  moderateur: "Modérateur",
  artiste: "Artiste",
  conteur: "Conteur",
};
