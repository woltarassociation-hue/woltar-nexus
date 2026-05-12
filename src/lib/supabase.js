// Ré-exports pour rétrocompatibilité avec AssociationDashboard
export { upsertArticle as saveArticle } from "./articles.js";
export { isConfigured as supabaseConfigured } from "./db.js";

import { supabase } from "./db.js";
import { compressImage } from "./imageUtils.js";

export async function uploadCoverImage(file) {
  if (!supabase) {
    return compressImage(file);
  }
  try {
    const fileName = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("article-images")
      .upload(fileName, file);
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("article-images").getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error("[uploadCoverImage] Supabase failed, fallback base64:", err.message);
    return compressImage(file);
  }
}

// removeArticle maintenu pour rétrocompatibilité éventuelle
export { deleteArticle as removeArticle } from "./articles.js";
