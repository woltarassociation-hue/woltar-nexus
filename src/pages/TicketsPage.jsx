import { useState, useRef } from "react";
import SiteNav from "../components/SiteNav.jsx";
import { saveTicket, sendDiscordNotification } from "../lib/tickets.js";
import { compressImage } from "../lib/imageUtils.js";

const CATEGORIES = [
  "Bug site",
  "Problème de compte",
  "RP / Event",
  "Signalement",
  "Question générale",
  "Autre",
];

const URGENCY_OPTIONS = [
  { value: "Faible",  label: "Faible",  color: "#22a06b", dot: "🟢" },
  { value: "Moyenne", label: "Moyenne", color: "#e67e22", dot: "🟡" },
  { value: "Haute",   label: "Haute",   color: "#c0392b", dot: "🔴" },
];

export default function TicketsPage() {
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [urgency, setUrgency] = useState("Moyenne");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pseudo.trim() || !subject.trim() || !message.trim()) {
      setError("Merci de remplir les champs obligatoires (Pseudo, Sujet, Message).");
      return;
    }
    setSubmitting(true);
    setError(null);

    let imageUrl = undefined;
    if (imageFile) {
      try {
        imageUrl = await compressImage(imageFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
      } catch {
        // image compression optional — continue without it
      }
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const ticket = {
      id,
      pseudo: pseudo.trim(),
      email: email.trim() || undefined,
      category,
      urgency,
      subject: subject.trim(),
      message: message.trim(),
      imageUrl,
      status: "Ouvert",
      createdAt: now,
      updatedAt: now,
    };

    saveTicket(ticket);

    // Send Discord notification — non-blocking
    sendDiscordNotification(ticket).catch(() => {});

    setSuccess(ticket);
    setSubmitting(false);

    // Reset form
    setPseudo("");
    setEmail("");
    setCategory(CATEGORIES[0]);
    setUrgency("Moyenne");
    setSubject("");
    setMessage("");
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="site ticket-page">
      <SiteNav />

      <div className="ticket-hero">
        <div className="ticket-card">
          <div className="ticket-card-header">
            <span className="ticket-card-icon">🎫</span>
            <h1 className="ticket-card-title">Support &amp; Tickets</h1>
            <p className="ticket-card-subtitle">
              Un souci, une question, un signalement ? Envoyez un ticket et l'équipe Woltar vous répondra.
            </p>
          </div>

          {success ? (
            <div className="ticket-success-card">
              <div className="ticket-success-icon">✓</div>
              <h2 className="ticket-success-title">Ticket envoyé !</h2>
              <p className="ticket-success-id">Référence : <strong>WLT-{success.id}</strong></p>
              <p className="ticket-success-msg">
                Merci <strong>{success.pseudo}</strong>, votre ticket a bien été enregistré. L'équipe Woltar
                le traitera dans les meilleurs délais.
              </p>
              <button
                className="ticket-submit-btn"
                style={{ marginTop: "24px" }}
                onClick={() => setSuccess(null)}
              >
                Envoyer un autre ticket
              </button>
            </div>
          ) : (
            <form className="ticket-form" onSubmit={handleSubmit} noValidate>

              <div className="ticket-field">
                <label className="ticket-label">Pseudo <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  className="ticket-input"
                  type="text"
                  placeholder="Votre pseudo in-game…"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  required
                />
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Email <span style={{ color: "#aaa", fontSize: "12px" }}>(optionnel)</span></label>
                <input
                  className="ticket-input"
                  type="email"
                  placeholder="contact@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Catégorie</label>
                <select
                  className="ticket-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Urgence</label>
                <div className="ticket-urgency-group">
                  {URGENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`ticket-urgency-btn ticket-urgency-${opt.value.toLowerCase()}${urgency === opt.value ? " ticket-urgency-btn--active" : ""}`}
                      onClick={() => setUrgency(opt.value)}
                    >
                      {opt.dot} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Sujet <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  className="ticket-input"
                  type="text"
                  placeholder="Résumez votre problème en quelques mots…"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Message <span style={{ color: "#c0392b" }}>*</span></label>
                <textarea
                  className="ticket-textarea"
                  rows={5}
                  placeholder="Décrivez votre problème en détail…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Image <span style={{ color: "#aaa", fontSize: "12px" }}>(optionnel — capture d'écran, preuve…)</span></label>
                <div
                  className="ticket-image-drop"
                  onClick={() => fileRef.current.click()}
                >
                  {imagePreview ? (
                    <div className="ticket-image-preview-wrap">
                      <img src={imagePreview} alt="Aperçu" className="ticket-image-preview" />
                      <span className="ticket-image-change">Changer l'image</span>
                    </div>
                  ) : (
                    <span className="ticket-image-placeholder">📎 Cliquez pour ajouter une image</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleImage(e.target.files[0])}
                />
              </div>

              {error && (
                <p className="ticket-error">{error}</p>
              )}

              <button
                type="submit"
                className="ticket-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Envoi en cours…" : "Envoyer le ticket →"}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="site-footer">
        <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
