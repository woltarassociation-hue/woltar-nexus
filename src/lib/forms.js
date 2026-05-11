const FORMS_KEY = "woltar_forms";
const RESPONSES_KEY = "woltar_form_responses";

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

  // Champs du formulaire
  fields: [],

  // Options RP avancées
  rpOptions: {
    enableStats: false,
    statsAmount: 40,
    statsList: [...ALL_RP_STATS],
    customRpFields: [], // [ { id, name, type, config } ]
  },

  // Autres options
  otherOptions: {
    duplicateSubmissionAllowed: false,
    emailNotification: false,
    maxResponses: null, // null = unlimited
  },
};

function emit() {
  window.dispatchEvent(new Event("woltar:forms"));
}

export function getForms() {
  try {
    return JSON.parse(localStorage.getItem(FORMS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getPublishedForms() {
  return getForms().filter((f) => f.status === "published");
}

export function getForm(id) {
  return getForms().find((f) => f.id === id) || null;
}

export function saveForm(form) {
  const forms = getForms();
  const now = new Date().toISOString();
  if (form.id) {
    const idx = forms.findIndex((f) => f.id === form.id);
    if (idx !== -1) {
      forms[idx] = { ...forms[idx], ...form, updatedAt: now };
    } else {
      forms.push({ ...form, createdAt: now, updatedAt: now });
    }
  } else {
    const newForm = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    forms.push(newForm);
  }
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  emit();
}

export function deleteForm(id) {
  const forms = getForms().filter((f) => f.id !== id);
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  const responses = getAllResponses().filter((r) => r.formId !== id);
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  emit();
}

function getAllResponses() {
  try {
    return JSON.parse(localStorage.getItem(RESPONSES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getResponses(formId) {
  return getAllResponses().filter((r) => r.formId === formId);
}

export function saveResponse(response) {
  const responses = getAllResponses();
  const newResp = {
    ...response,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  };
  responses.push(newResp);
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  emit();
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
      // Gérer les arrays (checkbox)
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
