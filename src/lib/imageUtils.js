/*
  compressImage — redimensionne et compresse une image via canvas
  avant stockage en base64 dans localStorage.

  Les GIF sont passés tels quels (sans canvas) pour préserver l'animation.
  maxWidth/maxHeight : dimensions max en pixels.
  quality : facteur JPEG 0–1 (0.82 ≈ bon équilibre qualité/poids).
*/
export function compressImage(
  file,
  { maxWidth = 1400, maxHeight = 1400, quality = 0.82 } = {}
) {
  // GIF : canvas ne conserve que la première frame — on lit directement en base64
  if (file.type === "image/gif") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Impossible de lire le GIF."));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de charger l'image pour la compression."));
    };

    img.src = url;
  });
}
