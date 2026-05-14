import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getForm, saveResponse, ALL_RP_STATS } from "../lib/forms";
import SiteNav from "../components/SiteNav";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function FormPage() {
  const { formId } = useParams();
  const form = getForm(formId);

  if (!form) return <Navigate to="/evenements/formulaires" replace />;

  return (
    <div className="form-page">
      <SiteNav />
      <FormContent form={form} />
      <footer className="site-footer">
        <div className="site-footer-inner">
          <img src="/logo_woltar.png" alt="Woltar" className="footer-logo" />
          <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function FormContent({ form }) {
  const [pseudo, setPseudo] = useState("");
  const [fieldValues, setFieldValues] = useState(() =>
    Object.fromEntries((form.fields || []).map((f) => [f.id, f.type === "checkbox" ? [] : ""]))
  );

  const rpOptions = form.rpOptions || {};
  const statsList = rpOptions.statsList || ALL_RP_STATS;
  const statsAmount = rpOptions.statsAmount || 40;

  const [statsValues, setStatsValues] = useState(() =>
    Object.fromEntries(statsList.map((s) => [s, Math.round(statsAmount / statsList.length)]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const now = new Date();
  const openDate = form.openDate ? new Date(form.openDate) : null;
  const closeDate = form.closeDate ? new Date(form.closeDate) : null;

  if (form.status !== "published") {
    return (
      <div className="form-page-body">
        <div className="form-closed-card">
          <span className="form-closed-icon">🔒</span>
          <h2>Formulaire indisponible</h2>
          <p>Ce formulaire n'est pas disponible pour le moment.</p>
        </div>
      </div>
    );
  }

  if (closeDate && now > closeDate) {
    return (
      <div className="form-page-body">
        <div className="form-closed-card">
          <span className="form-closed-icon">⏳</span>
          <h2>Formulaire clôturé</h2>
          <p>Ce formulaire est clôturé depuis le {formatDate(form.closeDate)}.</p>
        </div>
      </div>
    );
  }

  if (openDate && now < openDate) {
    return (
      <div className="form-page-body">
        <div className="form-closed-card">
          <span className="form-closed-icon">📅</span>
          <h2>Pas encore ouvert</h2>
          <p>Ce formulaire ouvrira le {formatDate(form.openDate)}.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="form-page-body">
        <div className="form-submitted-card">
          <span className="form-submitted-icon">✓</span>
          <h2>Réponse envoyée !</h2>
          <p>Merci <strong>{pseudo}</strong>, ta participation a bien été enregistrée.</p>
          <p className="form-submitted-sub">L'équipe Woltar reviendra vers toi prochainement.</p>
        </div>
      </div>
    );
  }

  const total = statsList.reduce((s, k) => s + Number(statsValues[k] ?? 0), 0);
  const remaining = statsAmount - total;

  const handleStat = (stat, val) => {
    const clean = Math.max(0, Math.min(10, Number(val)));
    setStatsValues((prev) => ({ ...prev, [stat]: clean }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!pseudo.trim()) newErrors.pseudo = "Ce champ est requis.";
    (form.fields || []).forEach((f) => {
      const val = fieldValues[f.id];
      const isEmpty = f.type === "checkbox" ? (Array.isArray(val) ? val.length === 0 : true) : !(val || "").trim();
      if (f.required && isEmpty) {
        newErrors[f.id] = "Ce champ est requis.";
      }
    });
    if (rpOptions.enableStats && remaining !== 0) {
      newErrors.stats = `Il reste ${remaining > 0 ? remaining : Math.abs(remaining)} point${Math.abs(remaining) > 1 ? "s" : ""} ${remaining > 0 ? "à répartir" : "en trop"}.`;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    saveResponse({
      formId: form.id,
      pseudo: pseudo.trim(),
      statsValues: rpOptions.enableStats ? { ...statsValues } : null,
      fields: { ...fieldValues },
    });
    setSubmitted(true);
  };

  return (
    <div className="form-page-body">
      <div className="form-card">
        <div className="form-card-header">
          <h1 className="form-card-title">{form.title}</h1>
          {form.description && <p className="form-card-desc">{form.description}</p>}
          <div className="form-card-badges">
            {form.openDate && (
              <span className="form-date-badge">
                Ouverture : {formatDate(form.openDate)}
              </span>
            )}
            {form.closeDate && (
              <span className="form-date-badge form-date-badge--close">
                Clôture : {formatDate(form.closeDate)}
              </span>
            )}
          </div>
        </div>

        <form className="form-card-body" onSubmit={handleSubmit} noValidate>
          {/* Pseudo */}
          <div className="form-field-group">
            <label className="form-label-pub">
              Pseudo en jeu <span className="form-required">*</span>
            </label>
            <input
              className={`form-input-pub${errors.pseudo ? " form-input-pub--error" : ""}`}
              type="text"
              placeholder="Ton pseudo dans le jeu"
              value={pseudo}
              onChange={(e) => { setPseudo(e.target.value); setErrors((err) => ({ ...err, pseudo: undefined })); }}
            />
            {errors.pseudo && <span className="form-field-error">{errors.pseudo}</span>}
          </div>

          {/* Custom fields */}
          {(form.fields || []).map((field) => (
            <div key={field.id} className="form-field-group">
              <label className="form-label-pub">
                {field.label}
                {field.required && <span className="form-required"> *</span>}
              </label>

              {field.type === "textarea" && (
                <textarea
                  className={`form-textarea-pub${errors[field.id] ? " form-input-pub--error" : ""}`}
                  placeholder={field.placeholder || field.label}
                  rows={4}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => {
                    setFieldValues((v) => ({ ...v, [field.id]: e.target.value }));
                    setErrors((err) => ({ ...err, [field.id]: undefined }));
                  }}
                />
              )}

              {field.type === "checkbox" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(field.options || []).map((opt) => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={(fieldValues[field.id] || []).includes(opt)}
                        onChange={(e) => {
                          const current = fieldValues[field.id] || [];
                          const updated = e.target.checked
                            ? [...current, opt]
                            : current.filter((v) => v !== opt);
                          setFieldValues((v) => ({ ...v, [field.id]: updated }));
                          setErrors((err) => ({ ...err, [field.id]: undefined }));
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {field.type === "radio" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(field.options || []).map((opt) => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={fieldValues[field.id] === opt}
                        onChange={(e) => {
                          setFieldValues((v) => ({ ...v, [field.id]: e.target.value }));
                          setErrors((err) => ({ ...err, [field.id]: undefined }));
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {field.type === "select" && (
                <select
                  className={`form-input-pub${errors[field.id] ? " form-input-pub--error" : ""}`}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => {
                    setFieldValues((v) => ({ ...v, [field.id]: e.target.value }));
                    setErrors((err) => ({ ...err, [field.id]: undefined }));
                  }}
                >
                  <option value="">-- Sélectionner une option --</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === "date" && (
                <input
                  className={`form-input-pub${errors[field.id] ? " form-input-pub--error" : ""}`}
                  type="date"
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => {
                    setFieldValues((v) => ({ ...v, [field.id]: e.target.value }));
                    setErrors((err) => ({ ...err, [field.id]: undefined }));
                  }}
                />
              )}

              {field.type === "number" && (
                <input
                  className={`form-input-pub${errors[field.id] ? " form-input-pub--error" : ""}`}
                  type="number"
                  placeholder={field.placeholder || field.label}
                  value={fieldValues[field.id] || ""}
                  min={field.min}
                  max={field.max}
                  onChange={(e) => {
                    setFieldValues((v) => ({ ...v, [field.id]: e.target.value }));
                    setErrors((err) => ({ ...err, [field.id]: undefined }));
                  }}
                />
              )}

              {field.type === "file" && (
                <input
                  className={`form-input-pub${errors[field.id] ? " form-input-pub--error" : ""}`}
                  type="file"
                  onChange={(e) => {
                    setFieldValues((v) => ({ ...v, [field.id]: e.target.files[0]?.name || "" }));
                    setErrors((err) => ({ ...err, [field.id]: undefined }));
                  }}
                />
              )}

              {["text", "email"].includes(field.type) && (
                <input
                  className={`form-input-pub${errors[field.id] ? " form-input-pub--error" : ""}`}
                  type={field.type}
                  placeholder={field.placeholder || field.label}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => {
                    setFieldValues((v) => ({ ...v, [field.id]: e.target.value }));
                    setErrors((err) => ({ ...err, [field.id]: undefined }));
                  }}
                />
              )}

              {errors[field.id] && <span className="form-field-error">{errors[field.id]}</span>}
            </div>
          ))}

          {/* Stats */}
          {rpOptions.enableStats && (
            <div className="form-stats-section">
              <h3 className="form-stats-title">Répartition des caractéristiques ({statsAmount} pts)</h3>
              <p className="form-stats-hint">Min : 0 | Max : 10 par statistique | Total obligatoire : {statsAmount} points</p>
              <div className="stats-form-grid">
                {statsList.map((stat) => (
                  <div key={stat} className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-name">{stat}</span>
                      <span className="stat-card-value">{statsValues[stat]}/10</span>
                    </div>
                    <div className="stat-bar-bg">
                      <div className="stat-bar-fill" style={{ width: `${(statsValues[stat] / 10) * 100}%` }} />
                    </div>
                    <div className="stat-card-controls">
                      <button type="button" className="stat-btn" onClick={() => handleStat(stat, statsValues[stat] - 1)}>−</button>
                      <button type="button" className="stat-btn" onClick={() => handleStat(stat, statsValues[stat] + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`form-points${remaining === 0 ? " form-points--ok" : " form-points--warn"}`}>
                Total : {total}/{statsAmount} — Points restants : {remaining}
              </div>
              {errors.stats && <span className="form-field-error">{errors.stats}</span>}
            </div>
          )}

          <button type="submit" className="form-submit-btn">
            Envoyer ma réponse →
          </button>
        </form>
      </div>
    </div>
  );
}
