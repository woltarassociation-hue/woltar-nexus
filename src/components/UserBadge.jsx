const BADGE_STYLES = {
  "Association":        { cls: "user-badge--association", icon: "◈" },
  "Modération Discord": { cls: "user-badge--moderation",  icon: "◉" },
  "Intérimaire":        { cls: "user-badge--interimaire", icon: "◇" },
  "Certifié":           { cls: "user-badge--certifie",    icon: "◆" },
};

export default function UserBadge({ name }) {
  const style = BADGE_STYLES[name];
  if (!style) return null;
  return (
    <span className={`user-badge ${style.cls}`} title={name}>
      {style.icon} {name}
    </span>
  );
}

// Affiche la liste des badges d'un profil
export function UserBadgeList({ badges = [] }) {
  if (!badges.length) return null;
  return (
    <>
      {badges.map((b) => (
        <UserBadge key={b.id ?? b.name} name={b.name} />
      ))}
    </>
  );
}
