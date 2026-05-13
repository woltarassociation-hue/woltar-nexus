import { useState } from "react";

const KEY = "woltar_storage_notice_dismissed";

export default function LocalStorageBanner() {
  const [visible, setVisible] = useState(
    () => !sessionStorage.getItem(KEY)
  );

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(KEY, "1");
    setVisible(false);
  };

  return (
    <div className="ls-banner" role="status" aria-live="polite">
      <span className="ls-banner__icon">◈</span>
      <span className="ls-banner__text">
        Certaines données sont conservées sur cet appareil pour améliorer ton expérience.
      </span>
      <button className="ls-banner__btn" onClick={dismiss}>
        Compris
      </button>
    </div>
  );
}
