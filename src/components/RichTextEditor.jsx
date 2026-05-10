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

/* ── Composant principal ────────────────────────────────────── */

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Rédigez votre article ici…",
}) {
  const editorRef    = useRef(null);
  const savedRangeRef = useRef(null);
  const [showFonts, setShowFonts] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  /* Initialisation */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sauvegarde la sélection avant qu'un bouton de toolbar prenne le focus */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  /* Restaure la sélection dans l'éditeur */
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

  /* Commande execCommand standard */
  const exec = useCallback((cmd, val = null) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    emit();
  }, [emit]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Application d'une police via span inline */
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

  /* Application d'une taille */
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

  /* Insertion HTML directe */
  const insertHTML = useCallback((html) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emit();
  }, [emit]);

  /* Insertion d'un lien */
  const insertLink = useCallback(() => {
    restoreSelection();
    const url = window.prompt("URL du lien :", "https://");
    if (url) document.execCommand("createLink", false, url);
    emit();
  }, [emit]);

  /* Insertion d'une image dans le contenu */
  const insertImageInput = useRef(null);
  const handleImageInsert = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      restoreSelection();
      document.execCommand("insertHTML", false, `<img src="${reader.result}" alt="" style="max-width:100%;border-radius:8px;margin:10px 0;" />`);
      emit();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="rte-wrap" onClick={() => { setShowFonts(false); setShowSizes(false); }}>
      {/* Toolbar */}
      <div className="rte-toolbar" onClick={(e) => e.stopPropagation()}>

        {/* Formatage */}
        <div className="rte-group">
          <ToolBtn title="Gras" onClick={() => exec("bold")}><b>B</b></ToolBtn>
          <ToolBtn title="Italique" onClick={() => exec("italic")}><i>I</i></ToolBtn>
          <ToolBtn title="Souligné" onClick={() => exec("underline")}><u>U</u></ToolBtn>
          <ToolBtn title="Barré" onClick={() => exec("strikeThrough")}><s>S</s></ToolBtn>
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
            onClick={() => { setShowFonts((v) => !v); setShowSizes(false); }}
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
            onClick={() => { setShowSizes((v) => !v); setShowFonts(false); }}
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

        {/* Image dans le contenu */}
        <label className="rte-btn" title="Insérer une image" onMouseDown={saveSelection}>
          🖼
          <input
            ref={insertImageInput}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageInsert}
          />
        </label>
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
