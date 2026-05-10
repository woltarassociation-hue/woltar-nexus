import { createClient } from "@supabase/supabase-js";
import { upsertArticle, deleteArticle } from "./articles.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function saveArticle(article) {
  const local = upsertArticle(article);
  if (!supabase) return local;
  const { data, error } = await supabase
    .from("articles")
    .upsert([{ ...article, id: local.id }])
    .select();
  if (error) throw new Error(error.message);
  return data[0] || local;
}

export async function removeArticle(id) {
  deleteArticle(id);
  if (!supabase) return;
  try {
    await supabase.from("articles").delete().eq("id", id);
  } catch {
    // localStorage déjà mis à jour
  }
}

export async function uploadCoverImage(file) {
  if (!supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Impossible de lire l'image de couverture."));
      reader.readAsDataURL(file);
    });
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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Impossible de lire l'image de couverture."));
      reader.readAsDataURL(file);
    });
  }
}
