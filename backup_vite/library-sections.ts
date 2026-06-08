import {
  BookOpen, FileText, ClipboardList, GraduationCap, BarChart3, FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SectionMeta {
  name: string;
  icon: LucideIcon;
  description: string;
}

export const DEFAULT_SECTIONS: SectionMeta[] = [
  { name: "Livros", icon: BookOpen, description: "Livros teológicos, devocionais e de referência pastoral" },
  { name: "Sermões", icon: FileText, description: "Manuscritos, esboços e materiais de pregação" },
  { name: "Atas", icon: ClipboardList, description: "Atas de reuniões, assembleias e conselhos" },
  { name: "Estudos", icon: GraduationCap, description: "Estudos bíblicos, materiais de formação e discipulado" },
  { name: "Relatórios", icon: BarChart3, description: "Relatórios pastorais, financeiros e administrativos" },
  { name: "Documentos Gerais", icon: FolderOpen, description: "Outros documentos do ministério" },
];
