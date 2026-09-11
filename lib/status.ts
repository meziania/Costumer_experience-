export const STATUS_LABELS: Record<string, { fr: string; en: string }> = {
  live: { fr: "Live", en: "Live" },
  prod: { fr: "Prod", en: "Prod" },
  delivered: { fr: "Livré", en: "Shipped" },
  mission: { fr: "Mission", en: "Mission" },
  wip: { fr: "En cours", en: "In progress" },
};

export function statusLabel(status: string, lang: "fr" | "en" = "fr") {
  return STATUS_LABELS[status]?.[lang] || status;
}

export const STATUS_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "prod", label: "Prod" },
  { value: "delivered", label: "Livré" },
  { value: "mission", label: "Mission" },
  { value: "wip", label: "En cours" },
];
