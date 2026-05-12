import { useState, useEffect, useRef } from "react";
import { getAllMedia, uploadMedia, renameMedia, deleteMedia, formatBytes } from "../../lib/media";

export default function MediathequeSection() {
  const [media, setMedia] = useState(() => getAllMedia());
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(null);
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
    <div className="adm-wrap">
      <div className="adm-inner">
        <h2 className="adm-title">Médiathèque</h2>

        {/* Zone upload */}
        <div
          className={`adm-upload-zone${dragOver ? " adm-upload-zone--drag" : ""}`}
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
            <span className="adm-upload-uploading">⏳ Upload en cours…</span>
          ) : (
            <>
              <span className="adm-upload-icon">📁</span>
              <span className="adm-upload-text">Glisser des images ici ou <u>cliquer pour choisir</u></span>
              <span className="adm-upload-hint">PNG, JPG, GIF, WebP — plusieurs fichiers acceptés</span>
            </>
          )}
        </div>

        {/* Grille */}
        {media.length === 0 ? (
          <p className="adm-empty">Aucun média uploadé.</p>
        ) : (
          <div className="adm-media-grid">
            {media.map((item) => (
              <div key={item.id} className="adm-media-card">
                <div className="adm-media-thumb">
                  {item.url.startsWith("data:") || item.url.startsWith("http") ? (
                    <img src={item.url} alt={item.name} />
                  ) : (
                    <span style={{ fontSize: 32, opacity: 0.3 }}>🖼</span>
                  )}
                </div>
                <div className="adm-media-body">
                  {renaming === item.id ? (
                    <input
                      className="adm-media-rename-input"
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => e.key === "Enter" && commitRename()}
                      autoFocus
                    />
                  ) : (
                    <span className="adm-media-name" onClick={() => startRename(item)} title="Cliquer pour renommer">
                      {item.name}
                    </span>
                  )}
                  <span className="adm-media-size">{formatBytes(item.sizeBytes)}</span>
                </div>
                <div className="adm-media-actions">
                  <button
                    className={`adm-media-btn${copied === item.id ? " adm-media-btn--copied" : ""}`}
                    onClick={() => copyUrl(item.url, item.id)}
                    title="Copier l'URL"
                  >
                    {copied === item.id ? "✓" : "⎘"}
                  </button>
                  <button
                    className="adm-media-btn adm-media-btn--danger"
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
      </div>
    </div>
  );
}
