export const SUBCATEGORIES = {
  evenements: [
    { id: "animations-rp",  label: "Animations RP",            icon: "⚔️" },
    { id: "concours",       label: "Concours",                 icon: "🏆" },
    { id: "formulaires",    label: "Formulaires d'inscription", icon: "📝" },
    { id: "annonces",       label: "Annonces",                 icon: "📢" },
  ],
  fanarts: [
    { id: "galerie",        label: "Galerie",             icon: "🖼" },
    { id: "concours-art",   label: "Concours artistiques", icon: "🏆" },
    { id: "mises-en-avant", label: "Mises en avant",      icon: "⭐" },
  ],
  rp: [
    { id: "intrigues",    label: "Intrigues",       icon: "🗡" },
    { id: "archives",     label: "Archives",        icon: "📚" },
    { id: "personnages",  label: "Personnages",     icon: "👤" },
    { id: "inscriptions", label: "Inscriptions RP", icon: "📋" },
  ],
};

export const ALL_SUBCAT_IDS = [...new Set(
  Object.values(SUBCATEGORIES).flat().map((s) => s.id)
)];

export function getSubcategories(categoryId) {
  return SUBCATEGORIES[categoryId] || [];
}

export function getSubcategoryMeta(categoryId, subcategoryId) {
  return getSubcategories(categoryId).find((s) => s.id === subcategoryId) || null;
}
