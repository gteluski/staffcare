import FontFamily from "@tiptap/extension-font-family";
export { FontFamily };

export const FONT_FAMILIES = [
  { label: "Padrão", value: "" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
] as const;
