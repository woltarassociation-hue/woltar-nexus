import { createClient } from "@supabase/supabase-js";
import { upsertArticle, deleteArticle } from "./articles.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/*
  saveArticle :
  1. Sauvegarde TOUJOURS dans localStorage en premier.
  2. Tente la sync Supabase si configuré — mais n'échoue jamais sur l'UI.
  3. Retourne { record, syncOk, syncError } pour que le dashboard
     puisse afficher un message adapté.
*/
export async function saveArticle(article) {
  const local = upsertArticle(article);

  if (!supabase) {
    return { record: local, syncOk: false, syncError: null };
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .upsert([{ ...article, id: local.id }])
      .select();
    if (error) throw new Error(error.message);
    return { record: data[0] || local, syncOk: true, syncError: null };
  } catch (err) {
    console.error("[saveArticle] Supabase sync failed (article saved locally):", err);
    return { record: local, syncOk: false, syncError: err.message };
  }
}

export async function removeArticle(id) {
  deleteArticle(id);
  if (!supabase) return;
  try {
    await supabase.from("articles").delete().eq("id", id);
  } catch (err) {
    console.error("[removeArticle] Supabase sync failed:", err);
  }
}

export async function uploadCoverImage(file) {
  if (!supabase) {
    return readAsDataURL(file);
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
    console.error("[uploadCoverImage] Supabase failed, falling back to base64:", err);
    return readAsDataURL(file);
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
    reader.readAsDataURL(file);
  });
}
