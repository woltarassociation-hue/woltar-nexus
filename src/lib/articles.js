const KEY = "woltar_articles";

function dispatch() {
  window.dispatchEvent(new Event("woltar:articles"));
}

export function getAllArticles() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function upsertArticle(data) {
  const all = getAllArticles();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, updatedAt: now, createdAt: data.createdAt || now };
  const idx = all.findIndex((a) => a.id === id);
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  return record;
}

export function deleteArticle(id) {
  const all = getAllArticles().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
}

export function getPublishedByCategories(categories) {
  return getAllArticles().filter(
    (a) => a.status === "published" && categories.includes(a.category)
  );
}

export const FONT_STACKS = {
  Georgia: "Georgia, serif",
  Merriweather: "'Merriweather', serif",
  "Playfair Display": "'Playfair Display', serif",
  "Libre Baskerville": "'Libre Baskerville', serif",
  Inter: "'Inter', sans-serif",
  Lato: "'Lato', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Cinzel: "'Cinzel', serif",
  "Cormorant Garamond": "'Cormorant Garamond', serif",
  "EB Garamond": "'EB Garamond', serif",
  Spectral: "'Spectral', serif",
};

export function getFontStack(fontId) {
  return FONT_STACKS[fontId] || "Verdana, sans-serif";
}
