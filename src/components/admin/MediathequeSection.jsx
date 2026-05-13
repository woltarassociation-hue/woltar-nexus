import { useState, useEffect, useRef } from "react";
import { getAllMedia, uploadMedia, deleteMedia, renameMedia, formatBytes } from "../../lib/media.js";
import { getAllArticles } from "../../lib/articles.js";

// ── Onglet Uploads ─────────────────────────────────────────────
function UploadsTab() {
  const [media, setMedia]       = useState(() => getAllMedia());
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied]     = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const refresh = () => setMedia(getAllMedia());
    window.addEventListener("woltar:media", refresh);
    return () => window.removeEventListener("woltar:media", refresh);
  }, []);

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true);
    for (const f of arr) await uploadMedia(f);
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const copyUrl = (url, id) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const startRename = (item) => {
    setRenaming(item.id);
    setRenameVal(item.name);
  };

  const commitRename = async () => {
    if (renaming && renameVal.trim()) await renameMedia(renaming, renameVal.trim());
    setRenaming(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer "${item.name}" ?`)) return;
    await deleteMedia(item.id);
  };

  return (
    <>
      {/* Zone drag&drop */}
      <div
        className={`rpx-upload-zone${dragOver ? " rpx-upload-zone--drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <span className="rpx-upload-hint">⏳ Upload en cours…</span>
        ) : (
          <>
            <span style={{ fontSize: 32 }}>📁</span>
            <span className="rpx-upload-text">
              Glisser des images ici ou <u>cliquer pour choisir</u>
            </span>
            <span className="rpx-upload-hint">PNG, JPG, GIF, WebP — plusieurs fichiers acceptés</span>
          </>
        )}
      </div>

      {/* Grille */}
      {media.length === 0 ? (
        <div className="rpx-empty">Aucun média uploadé.</div>
      ) : (
        <div className="rpx-media-grid">
          {media.map((item) => (
            <div key={item.id} className="rpx-media-card">
              <div className="rpx-media-thumb">
                {item.url && (item.url.startsWith("data:") || item.url.startsWith("http")) ? (
                  <img src={item.url} alt={item.name} />
                ) : (
                  <span style={{ fontSize: 32, opacity: 0.3 }}>🖼</span>
                )}
              </div>
              <div className="rpx-media-footer">
                {renaming === item.id ? (
                  <input
                    className="rpx-input rpx-media-rename"
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => e.key === "Enter" && commitRename()}
                    autoFocus
                  />
                ) : (
                  <span
                    className="rpx-media-name"
                    onClick={() => startRename(item)}
                    title="Cliquer pour renommer"
                  >
                    {item.name}
                  </span>
                )}
                <span className="rpx-media-size">{formatBytes(item.sizeBytes)}</span>
              </div>
              <div className="rpx-media-actions">
                <button
                  className={`rpx-btn rpx-btn--sm${copied === item.id ? " rpx-btn--success" : ""}`}
                  onClick={() => copyUrl(item.url, item.id)}
                  title="Copier l'URL"
                >
                  {copied === item.id ? "✓" : "⎘"}
                </button>
                <button
                  className="rpx-btn rpx-btn--sm rpx-btn--danger"
                  onClick={() => handleDelete(item)}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Onglet Fan-arts ────────────────────────────────────────────
function FanartsTab() {
  const [fanarts, setFanarts]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied]     = useState(null);

  useEffect(() => {
    const load = () => {
      const all = getAllArticles();
      const filtered = all.filter(
        (a) => a.category === "fanarts" && a.coverUrl
      );
      setFanarts(filtered);
    };
    load();
    window.addEventListener("woltar:articles", load);
    return () => window.removeEventListener("woltar:articles", load);
  }, []);

  const handleClick = (article) => {
    setSelected(article.id);
    navigator.clipboard.writeText(article.coverUrl).catch(() => {});
    setCopied(article.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <p className="rpx-media-info">
        Cliquez sur un fan-art pour copier son URL et l'utiliser dans un article.
      </p>
      {fanarts.length === 0 ? (
        <div className="rpx-empty">Aucun fan-art avec couverture trouvé.</div>
      ) : (
        <div className="rpx-media-grid">
          {fanarts.map((article) => (
            <div
              key={article.id}
              className={`rpx-media-card rpx-media-card--clickable${selected === article.id ? " rpx-media-card--selected" : ""}`}
              onClick={() => handleClick(article)}
            >
              <div className="rpx-media-thumb">
                <img src={article.coverUrl} alt={article.title} />
                {copied === article.id && (
                  <div className="rpx-media-copied">✓ URL copiée !</div>
                )}
              </div>
              <div className="rpx-media-footer">
                <span className="rpx-media-name" title={article.title}>
                  {article.title?.length > 28
                    ? article.title.slice(0, 28) + "…"
                    : article.title}
                </span>
                <span className="rpx-media-size">
                  {article.createdAt
                    ? new Date(article.createdAt).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function MediathequeSection() {
  const [tab, setTab] = useState("uploads");

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ MÉDIATHÈQUE</h2>
      </div>

      {/* Onglets */}
      <div className="rpx-tabs">
        <button
          className={`rpx-tab${tab === "uploads" ? " rpx-tab--active" : ""}`}
          onClick={() => setTab("uploads")}
        >
          Uploads
        </button>
        <button
          className={`rpx-tab${tab === "fanarts" ? " rpx-tab--active" : ""}`}
          onClick={() => setTab("fanarts")}
        >
          Fan-arts (articles)
        </button>
      </div>

      {tab === "uploads" && <UploadsTab />}
      {tab === "fanarts" && <FanartsTab />}
    </div>
  );
}
