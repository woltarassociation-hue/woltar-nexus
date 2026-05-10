import { useRef, useEffect, useCallback, useState } from "react";

/* ── Groupes de polices ─────────────────────────────────────── */
export const RTE_FONT_GROUPS = [
  {
    label: "Calligraphique",
    fonts: [
      { id: "Great Vibes",      stack: "'Great Vibes', cursive" },
      { id: "Allura",           stack: "'Allura', cursive" },
      { id: "Dancing Script",   stack: "'Dancing Script', cursive" },
      { id: "Parisienne",       stack: "'Parisienne', cursive" },
    ],
  },
  {
    label: "Fantasy / Médiéval",
    fonts: [
      { id: "Cinzel Decorative", stack: "'Cinzel Decorative', cursive" },
      { id: "Uncial Antiqua",    stack: "'Uncial Antiqua', cursive" },
      { id: "Cinzel",            stack: "'Cinzel', serif" },
    ],
  },
  {
    label: "Éditorial",
    fonts: [
      { id: "Playfair Display",   stack: "'Playfair Display', serif" },
      { id: "Cormorant Garamond", stack: "'Cormorant Garamond', serif" },
      { id: "Merriweather",       stack: "'Merriweather', serif" },
      { id: "EB Garamond",        stack: "'EB Garamond', serif" },
    ],
  },
  {
    label: "Moderne",
    fonts: [
      { id: "Inter",      stack: "'Inter', sans-serif" },
      { id: "Poppins",    stack: "'Poppins', sans-serif" },
      { id: "Montserrat", stack: "'Montserrat', sans-serif" },
      { id: "Lato",       stack: "'Lato', sans-serif" },
    ],
  },
];

const TEXT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];

/* ── Tailles et alignements d'image ─────────────────────────── */
const IMG_SIZES = [
  { id: "25",   label: "¼" },
  { id: "40",   label: "40%" },
  { id: "50",   label: "½" },
  { id: "75",   label: "¾" },
  { id: "100",  label: "Pleine" },
];

const IMG_ALIGNS = [
  { id: "left",   label: "⇤ Gauche",  style: { float: "left",  marginRight: "18px", marginBottom: "10px", marginLeft: "0" } },
  { id: "center", label: "≡ Centre",  style: { display: "block", margin: "14px auto" } },
  { id: "right",  label: "⇥ Droite", style: { float: "right", marginLeft: "18px",  marginBottom: "10px", marginRight: "0" } },
];

/* ── Construit la balise img ─────────────────────────────────── */
function buildImgTag(src, align, size, caption) {
  const alignCfg = IMG_ALIGNS.find((a) => a.id === align) || IMG_ALIGNS[1];
  const widthPct = size;

  const styleObj = { ...alignCfg.style, width: `${widthPct}%`, maxWidth: "100%", borderRadius: "8px" };
  const styleStr = Object.entries(styleObj)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`)
    .join(";");

  const imgTag = `<img src="${src}" alt="${caption || ""}" style="${styleStr}" />`;

  if (caption) {
    const captionStyle = align === "center"
      ? "display:block;text-align:center;font-size:13px;color:#888;margin-top:4px;font-style:italic;"
      : align === "left"
      ? "display:block;float:left;clear:left;font-size:13px;color:#888;margin:2px 18px 10px 0;font-style:italic;"
      : "display:block;float:right;clear:right;font-size:13px;color:#888;margin:2px 0 10px 18px;font-style:italic;";
    return `${imgTag}<span style="${captionStyle}">${caption}</span>`;
  }

  return imgTag;
}

/* ── Panneau d'insertion d'image ─────────────────────────────── */
function ImagePanel({ onInsert, onClose }) {
  const [tab, setTab] = useState("upload"); // "upload" | "url"
  const [url, setUrl] = useState("");
  const [align, setAlign] = useState("center");
  const [size, setSize] = useState("100");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUrl = (val) => {
    setUrl(val);
    setPreview(val || null);
  };

  const ready = preview || url;

  const handleInsert = () => {
    const src = tab === "url" ? url : preview;
    if (!src) return;
    onInsert(buildImgTag(src, align, size, caption));
  };

  return (
    <div className="rte-img-panel" onClick={(e) => e.stopPropagation()}>
      <div className="rte-img-panel-header">
        <span className="rte-img-panel-title">Insérer une image</span>
        <button className="rte-img-panel-close" onClick={onClose} type="button">×</button>
      </div>

      {/* Tabs */}
      <div className="rte-img-tabs">
        <button
          type="button"
          className={`rte-img-tab${tab === "upload" ? " rte-img-tab--active" : ""}`}
          onClick={() => setTab("upload")}
        >
          📁 Depuis l'appareil
        </button>
        <button
          type="button"
          className={`rte-img-tab${tab === "url" ? " rte-img-tab--active" : ""}`}
          onClick={() => setTab("url")}
        >
          🔗 Depuis une URL
        </button>
      </div>

      {tab === "upload" && (
        <div
          className="rte-img-dropzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        >
          {preview && tab === "upload" ? (
            <img src={preview} alt="aperçu" className="rte-img-preview" />
          ) : (
            <div className="rte-img-dropzone-inner">
              <span className="rte-img-dropzone-icon">🖼</span>
              <span>Cliquez ou glissez une image ici</span>
              <span className="rte-img-dropzone-hint">PNG · JPG · WEBP · GIF</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {tab === "url" && (
        <div className="rte-img-url-wrap">
          <input
            className="rte-img-url-input"
            type="url"
            placeholder="https://exemple.com/image.jpg"
            value={url}
            onChange={(e) => handleUrl(e.target.value)}
            autoFocus
          />
          {preview && (
            <img src={preview} alt="aperçu" className="rte-img-preview rte-img-preview--url"
              onError={() => setPreview(null)} />
          )}
        </div>
      )}

      <div className="rte-img-options">
        {/* Alignement */}
        <div className="rte-img-opt-group">
          <span className="rte-img-opt-label">Alignement</span>
          <div className="rte-img-opt-btns">
            {IMG_ALIGNS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`rte-img-opt-btn${align === a.id ? " rte-img-opt-btn--active" : ""}`}
                onClick={() => setAlign(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Taille */}
        <div className="rte-img-opt-group">
          <span className="rte-img-opt-label">Taille</span>
          <div className="rte-img-opt-btns">
            {IMG_SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`rte-img-opt-btn${size === s.id ? " rte-img-opt-btn--active" : ""}`}
                onClick={() => setSize(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="rte-img-opt-group">
          <span className="rte-img-opt-label">Légende <span style={{ fontWeight: 400, color: "#bbb" }}>(optionnel)</span></span>
          <input
            className="rte-img-caption-input"
            type="text"
            placeholder="Ajouter une légende…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
      </div>

      <div className="rte-img-panel-footer">
        <button type="button" className="rte-img-cancel-btn" onClick={onClose}>Annuler</button>
        <button
          type="button"
          className="rte-img-insert-btn"
          onClick={handleInsert}
          disabled={!ready}
        >
          Insérer l'image →
        </button>
      </div>
    </div>
  );
}

/* ── Composant principal ────────────────────────────────────── */

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Rédigez votre article ici…",
}) {
  const editorRef     = useRef(null);
  const savedRangeRef = useRef(null);
  const [showFonts, setShowFonts]   = useState(false);
  const [showSizes, setShowSizes]   = useState(false);
  const [showImgPanel, setShowImgPanel] = useState(false);

  /* Initialisation */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current || !editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  };

  const emit = useCallback(() => {
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const exec = useCallback((cmd, val = null) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    emit();
  }, [emit]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFont = useCallback((stack) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      editorRef.current.style.fontFamily = stack;
    } else {
      try {
        const span = document.createElement("span");
        span.style.fontFamily = stack;
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      } catch {
        document.execCommand("fontName", false, stack);
      }
    }
    emit();
    setShowFonts(false);
  }, [emit]);

  const applySize = useCallback((px) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      try {
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      } catch {
        document.execCommand("fontSize", false, "3");
      }
    }
    emit();
    setShowSizes(false);
  }, [emit]);

  const insertHTML = useCallback((html) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emit();
  }, [emit]); // eslint-disable-line react-hooks/exhaustive-deps

  const insertLink = useCallback(() => {
    restoreSelection();
    const url = window.prompt("URL du lien :", "https://");
    if (url) document.execCommand("createLink", false, url);
    emit();
  }, [emit]);

  const handleImageInsert = (html) => {
    insertHTML(html);
    setShowImgPanel(false);
  };

  const closeAll = () => {
    setShowFonts(false);
    setShowSizes(false);
    setShowImgPanel(false);
  };

  return (
    <div className="rte-wrap" onClick={closeAll}>

      {/* Panneau image — overlay */}
      {showImgPanel && (
        <div className="rte-img-overlay" onClick={() => setShowImgPanel(false)}>
          <ImagePanel
            onInsert={handleImageInsert}
            onClose={() => setShowImgPanel(false)}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="rte-toolbar" onClick={(e) => e.stopPropagation()}>

        {/* Formatage */}
        <div className="rte-group">
          <ToolBtn title="Gras"    onClick={() => exec("bold")}><b>B</b></ToolBtn>
          <ToolBtn title="Italique" onClick={() => exec("italic")}><i>I</i></ToolBtn>
          <ToolBtn title="Souligné" onClick={() => exec("underline")}><u>U</u></ToolBtn>
          <ToolBtn title="Barré"   onClick={() => exec("strikeThrough")}><s>S</s></ToolBtn>
        </div>

        <div className="rte-sep" />

        {/* Blocs */}
        <div className="rte-group">
          <ToolBtn title="Titre H1" onClick={() => exec("formatBlock", "h1")}>H1</ToolBtn>
          <ToolBtn title="Titre H2" onClick={() => exec("formatBlock", "h2")}>H2</ToolBtn>
          <ToolBtn title="Titre H3" onClick={() => exec("formatBlock", "h3")}>H3</ToolBtn>
          <ToolBtn title="Paragraphe" onClick={() => exec("formatBlock", "p")}>P</ToolBtn>
        </div>

        <div className="rte-sep" />

        {/* Alignement */}
        <div className="rte-group">
          <ToolBtn title="Gauche"  onClick={() => exec("justifyLeft")}>⇤</ToolBtn>
          <ToolBtn title="Centre"  onClick={() => exec("justifyCenter")}>≡</ToolBtn>
          <ToolBtn title="Droite"  onClick={() => exec("justifyRight")}>⇥</ToolBtn>
        </div>

        <div className="rte-sep" />

        {/* Listes & extras */}
        <div className="rte-group">
          <ToolBtn title="Liste à puces"  onClick={() => exec("insertUnorderedList")}>•—</ToolBtn>
          <ToolBtn title="Citation"       onClick={() => exec("formatBlock", "blockquote")}>❝</ToolBtn>
          <ToolBtn title="Séparateur"     onClick={() => insertHTML("<hr />")}>—</ToolBtn>
          <ToolBtn title="Lien"           onClick={insertLink}>🔗</ToolBtn>
        </div>

        <div className="rte-sep" />

        {/* Couleurs */}
        <div className="rte-group">
          <label className="rte-btn rte-color-swatch" title="Couleur du texte">
            <span className="rte-swatch-label">A</span>
            <input type="color" defaultValue="#1a1020"
              onMouseDown={saveSelection}
              onChange={(e) => { restoreSelection(); exec("foreColor", e.target.value); }}
            />
          </label>
          <label className="rte-btn rte-color-swatch rte-color-bg" title="Couleur de fond">
            <span className="rte-swatch-label" style={{ background: "#ffe" }}>A</span>
            <input type="color" defaultValue="#fffde7"
              onMouseDown={saveSelection}
              onChange={(e) => { restoreSelection(); exec("hiliteColor", e.target.value); }}
            />
          </label>
        </div>

        <div className="rte-sep" />

        {/* Police */}
        <div className="rte-dropdown-wrap" style={{ position: "relative" }}>
          <ToolBtn
            title="Police"
            onMouseDown={saveSelection}
            onClick={() => { setShowFonts((v) => !v); setShowSizes(false); setShowImgPanel(false); }}
            active={showFonts}
          >
            Aa ▾
          </ToolBtn>
          {showFonts && (
            <div className="rte-dropdown rte-font-dropdown">
              {RTE_FONT_GROUPS.map((group) => (
                <div key={group.label} className="rte-dropdown-group">
                  <p className="rte-dropdown-group-label">{group.label}</p>
                  {group.fonts.map((font) => (
                    <button
                      key={font.id}
                      className="rte-dropdown-item"
                      style={{ fontFamily: font.stack }}
                      onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                      onClick={() => applyFont(font.stack)}
                    >
                      {font.id}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Taille */}
        <div className="rte-dropdown-wrap" style={{ position: "relative" }}>
          <ToolBtn
            title="Taille"
            onMouseDown={saveSelection}
            onClick={() => { setShowSizes((v) => !v); setShowFonts(false); setShowImgPanel(false); }}
            active={showSizes}
          >
            Taille ▾
          </ToolBtn>
          {showSizes && (
            <div className="rte-dropdown rte-size-dropdown">
              {TEXT_SIZES.map((px) => (
                <button
                  key={px}
                  className="rte-dropdown-item"
                  style={{ fontSize: `${px}px`, lineHeight: "1.2" }}
                  onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                  onClick={() => applySize(px)}
                >
                  {px}px
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rte-sep" />

        {/* Image dans le contenu */}
        <ToolBtn
          title="Insérer une image"
          onMouseDown={saveSelection}
          onClick={() => { setShowImgPanel((v) => !v); setShowFonts(false); setShowSizes(false); }}
          active={showImgPanel}
        >
          🖼 Image
        </ToolBtn>
      </div>

      {/* Zone d'édition */}
      <div
        ref={editorRef}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        data-placeholder={placeholder}
      />
    </div>
  );
}

/* ── Bouton toolbar ─────────────────────────────────────────── */
function ToolBtn({ children, title, onClick, onMouseDown, active }) {
  return (
    <button
      className={`rte-btn${active ? " rte-btn--active" : ""}`}
      title={title}
      onClick={onClick}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown?.(); }}
      type="button"
    >
      {children}
    </button>
  );
}
