import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const FORMS_KEY = "woltar_forms";
const RESPONSES_KEY = "woltar_form_responses";

let _formsCache = null;
let _responsesCache = null;

// Form field types
export const FIELD_TYPES = {
  TEXT: "text",
  TEXTAREA: "textarea",
  EMAIL: "email",
  SELECT: "select",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  DATE: "date",
  NUMBER: "number",
  FILE: "file",
};

// RP Stats disponibles
export const ALL_RP_STATS = ["Agilité", "Perception", "Chance", "Mémoire", "Intelligence", "Créativité", "Charisme", "Force"];

// Default form template avec structure avancée
export const EMPTY_FORM_V2 = {
  id: null,
  title: "",
  description: "",
  category: "evenements",
  subcategory: "formulaires",
  status: "draft",
  openDate: "",
  closeDate: "",
  fields: [],
  rpOptions: {
    enableStats: false,
    statsAmount: 40,
    statsList: [...ALL_RP_STATS],
    customRpFields: [],
  },
  otherOptions: {
    duplicateSubmissionAllowed: false,
    emailNotification: false,
    maxResponses: null,
  },
};

function emit() {
  window.dispatchEvent(new Event("woltar:forms"));
}

function readLocalForms() {
  try { return JSON.parse(localStorage.getItem(FORMS_KEY) || "[]"); } catch { return []; }
}

function readLocalResponses() {
  try { return JSON.parse(localStorage.getItem(RESPONSES_KEY) || "[]"); } catch { return []; }
}

async function loadFormsFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("forms").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    _formsCache = (data || []).map(fromDb);
    localStorage.setItem(FORMS_KEY, JSON.stringify(_formsCache));
    emit();
  } catch (err) {
    console.warn("[forms] Supabase load failed:", err.message);
  }
}

async function loadResponsesFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("form_responses").select("*").order("submitted_at", { ascending: false })
    );
    if (error) throw error;
    _responsesCache = (data || []).map(fromDb);
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(_responsesCache));
    emit();
  } catch (err) {
    console.warn("[form_responses] Supabase load failed:", err.message);
  }
}

// Auto-init + realtime
if (supabase) {
  loadFormsFromSupabase();
  loadResponsesFromSupabase();
  supabase
    .channel("forms-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "forms" }, loadFormsFromSupabase)
    .on("postgres_changes", { event: "*", schema: "public", table: "form_responses" }, loadResponsesFromSupabase)
    .subscribe();
}

export function getForms() {
  return _formsCache ?? readLocalForms();
}

export function getPublishedForms() {
  return getForms().filter((f) => f.status === "published");
}

export function getForm(id) {
  return getForms().find((f) => f.id === id) || null;
}

export async function saveForm(form) {
  const forms = getForms();
  const now = new Date().toISOString();
  let record;
  if (form.id) {
    const idx = forms.findIndex((f) => f.id === form.id);
    if (idx !== -1) {
      record = { ...forms[idx], ...form, updatedAt: now };
      forms[idx] = record;
    } else {
      record = { ...form, createdAt: now, updatedAt: now };
      forms.push(record);
    }
  } else {
    record = { ...form, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    forms.push(record);
  }
  _formsCache = forms;
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  emit();

  if (!supabase) return { record, syncOk: false };
  try {
    const { error } = await withTimeout(
      supabase.from("forms").upsert([toDb(record)])
    );
    if (error) throw error;
    return { record, syncOk: true };
  } catch (err) {
    console.error("[saveForm] Supabase failed:", err.message);
    return { record, syncOk: false, syncError: err.message };
  }
}

export async function deleteForm(id) {
  const forms = (_formsCache ?? readLocalForms()).filter((f) => f.id !== id);
  const responses = (_responsesCache ?? readLocalResponses()).filter((r) => r.formId !== id);
  _formsCache = forms;
  _responsesCache = responses;
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  emit();

  if (!supabase) return;
  try {
    // Les réponses sont supprimées via ON DELETE CASCADE côté Supabase
    await withTimeout(supabase.from("forms").delete().eq("id", id));
  } catch (err) {
    console.error("[deleteForm] Supabase failed:", err.message);
  }
}

function getAllResponses() {
  return _responsesCache ?? readLocalResponses();
}

export function getResponses(formId) {
  return getAllResponses().filter((r) => r.formId === formId);
}

export async function saveResponse(response) {
  const responses = getAllResponses();
  const newResp = {
    ...response,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  };
  responses.push(newResp);
  _responsesCache = responses;
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  emit();

  if (!supabase) return { record: newResp, syncOk: false };
  try {
    const { error } = await withTimeout(
      supabase.from("form_responses").insert([toDb(newResp)])
    );
    if (error) throw error;
    return { record: newResp, syncOk: true };
  } catch (err) {
    console.error("[saveResponse] Supabase failed:", err.message);
    return { record: newResp, syncOk: false, syncError: err.message };
  }
}

export function exportResponsesCsv(formId) {
  const form = getForm(formId);
  if (!form) return;
  const responses = getResponses(formId);
  if (responses.length === 0) return;

  const rpOptions = form.rpOptions || {};
  const statNames = rpOptions.enableStats ? rpOptions.statsList || ALL_RP_STATS : [];

  const fieldIds = (form.fields || []).map((f) => f.id);
  const fieldLabels = (form.fields || []).map((f) => f.label);
  const customRpLabels = (rpOptions.customRpFields || []).map((f) => f.name);

  const headers = ["Pseudo", "Date de soumission", ...statNames, ...fieldLabels, ...customRpLabels];

  const rows = responses.map((r) => {
    const statCols = statNames.map((s) => String(r.statsValues?.[s] ?? ""));
    const fieldCols = fieldIds.map((id) => {
      const val = r.fields?.[id] || "";
      return `"${String(Array.isArray(val) ? val.join("; ") : val).replace(/"/g, '""')}"`;
    });
    const customRpCols = (rpOptions.customRpFields || []).map((f) => {
      const val = r.customRpFields?.[f.id] || "";
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    const date = new Date(r.submittedAt).toLocaleString("fr-FR");
    return [`"${(r.pseudo || "").replace(/"/g, '""')}"`, `"${date}"`, ...statCols, ...fieldCols, ...customRpCols].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reponses-${formId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
