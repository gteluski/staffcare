import {
  Church,
  Heart,
  Users,
  User,
  BookOpen,
  HandHelping,
  Wallet,
  Calendar,
  Flag,
  Star,
  Cross,
  Flame,
  type LucideIcon,
} from "lucide-react";

export type EventCategory =
  | "Culto"
  | "Visita Pastoral"
  | "Reunião da Igreja"
  | "Reunião Pessoal"
  | "Devocional"
  | "Sala de Oração"
  | "Compromisso Financeiro"
  | "Feriado Nacional"
  | "Data Comemorativa"
  | "Liturgia"
  | "Data Metodista"
  | "Outro";

export type CalendarContext = "principal" | "pessoal" | "pregacoes" | "sistema";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** HSL values for bg tint */
  color: string;
  /** Tailwind text class */
  textClass: string;
  /** Tailwind bg class */
  bgClass: string;
}

export const CATEGORIES: Record<EventCategory, CategoryMeta> = {
  Culto: { label: "Culto", icon: Church, color: "210 45% 28%", textClass: "text-primary", bgClass: "bg-primary/10" },
  "Visita Pastoral": { label: "Visita Pastoral", icon: Heart, color: "0 65% 50%", textClass: "text-red-600", bgClass: "bg-red-50" },
  "Reunião da Igreja": { label: "Reunião da Igreja", icon: Users, color: "220 60% 50%", textClass: "text-blue-600", bgClass: "bg-blue-50" },
  "Reunião Pessoal": { label: "Reunião Pessoal", icon: User, color: "280 50% 50%", textClass: "text-purple-600", bgClass: "bg-purple-50" },
  Devocional: { label: "Devocional", icon: BookOpen, color: "150 30% 40%", textClass: "text-emerald-700", bgClass: "bg-emerald-50" },
  "Sala de Oração": { label: "Sala de Oração", icon: HandHelping, color: "35 70% 50%", textClass: "text-amber-600", bgClass: "bg-amber-50" },
  "Compromisso Financeiro": { label: "Compromisso Financeiro", icon: Wallet, color: "170 50% 40%", textClass: "text-teal-600", bgClass: "bg-teal-50" },
  "Feriado Nacional": { label: "Feriado Nacional", icon: Flag, color: "145 50% 36%", textClass: "text-green-700", bgClass: "bg-green-50 dark:bg-green-950/40" },
  "Data Comemorativa": { label: "Data Comemorativa", icon: Star, color: "210 60% 50%", textClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-950/40" },
  Liturgia: { label: "Liturgia", icon: Cross, color: "270 45% 45%", textClass: "text-violet-700", bgClass: "bg-violet-50 dark:bg-violet-950/40" },
  "Data Metodista": { label: "Data Metodista", icon: Flame, color: "0 60% 40%", textClass: "text-rose-700", bgClass: "bg-rose-50 dark:bg-rose-950/40" },
  Outro: { label: "Outro", icon: Calendar, color: "220 10% 46%", textClass: "text-muted-foreground", bgClass: "bg-muted" },
};

/** Categories available for user-created events (excludes system-only categories) */
export const CATEGORY_LIST = Object.keys(CATEGORIES).filter(
  (k) => !["Feriado Nacional", "Data Comemorativa", "Liturgia", "Data Metodista"].includes(k)
) as EventCategory[];
