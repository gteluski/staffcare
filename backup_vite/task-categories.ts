import {
  Church, Briefcase, User, BookOpen, Wallet, Tag, type LucideIcon,
} from "lucide-react";
import type { TaskCategory, TaskPriority } from "@/hooks/useTasks";

export interface TaskCategoryMeta {
  label: string;
  icon: LucideIcon;
  textClass: string;
  bgClass: string;
}

export const TASK_CATEGORIES: Record<TaskCategory, TaskCategoryMeta> = {
  Pastoral: { label: "Pastoral", icon: Church, textClass: "text-primary", bgClass: "bg-primary/10" },
  Administrativa: { label: "Administrativa", icon: Briefcase, textClass: "text-blue-600", bgClass: "bg-blue-50" },
  Pessoal: { label: "Pessoal", icon: User, textClass: "text-purple-600", bgClass: "bg-purple-50" },
  Estudo: { label: "Estudo", icon: BookOpen, textClass: "text-emerald-700", bgClass: "bg-emerald-50" },
  Financeira: { label: "Financeira", icon: Wallet, textClass: "text-teal-600", bgClass: "bg-teal-50" },
  Outra: { label: "Outra", icon: Tag, textClass: "text-muted-foreground", bgClass: "bg-muted" },
};

export const TASK_CATEGORY_LIST = Object.keys(TASK_CATEGORIES) as TaskCategory[];

export const PRIORITY_META: Record<TaskPriority, { label: string; dotClass: string }> = {
  alta: { label: "Alta", dotClass: "bg-red-500" },
  média: { label: "Média", dotClass: "bg-amber-500" },
  baixa: { label: "Baixa", dotClass: "bg-emerald-500" },
};

export const PRIORITY_LIST: TaskPriority[] = ["alta", "média", "baixa"];
