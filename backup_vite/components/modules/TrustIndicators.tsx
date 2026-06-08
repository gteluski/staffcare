import { type LucideIcon, ShieldCheck, Lock, UserCheck, Eye, FolderLock, KeyRound, ServerCog } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrustItem {
  icon: LucideIcon;
  label: string;
  description?: string;
}

export const TRUST_INDICATORS: TrustItem[] = [
  { icon: Lock, label: "Conexão protegida", description: "Comunicação criptografada via HTTPS" },
  { icon: UserCheck, label: "Dados por usuário", description: "Cada conta acessa apenas seus próprios dados" },
  { icon: KeyRound, label: "Acesso por perfil", description: "Permissões controladas por nível de acesso" },
  { icon: Eye, label: "Ambiente privado", description: "Informações pastorais não ficam expostas publicamente" },
  { icon: FolderLock, label: "Arquivos protegidos", description: "Documentos acessíveis apenas pelo proprietário" },
  { icon: ShieldCheck, label: "Fluxos sensíveis protegidos", description: "Ações críticas passam por verificações adicionais" },
  { icon: ServerCog, label: "Privacidade respeitada", description: "Dados usados exclusivamente para o funcionamento da plataforma" },
];

/**
 * Inline row of small trust pills — ideal for footers, login areas, plan cards.
 */
export function TrustBadgeRow({
  items = TRUST_INDICATORS,
  max,
  className,
}: {
  items?: TrustItem[];
  max?: number;
  className?: string;
}) {
  const visible = max ? items.slice(0, max) : items;
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {visible.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground select-none"
        >
          <item.icon className="h-3 w-3 text-primary/70 shrink-0" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Compact horizontal strip with icons only + hover tooltip feel.
 * Great for tight spaces like auth pages or card footers.
 */
export function TrustIconStrip({
  items = TRUST_INDICATORS,
  max,
  className,
}: {
  items?: TrustItem[];
  max?: number;
  className?: string;
}) {
  const visible = max ? items.slice(0, max) : items;
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {visible.map((item) => (
        <div
          key={item.label}
          className="group relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 border border-border/50 transition-colors hover:bg-primary/10"
          title={item.label}
        >
          <item.icon className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
        </div>
      ))}
    </div>
  );
}

/**
 * Card grid with icon + label + description — ideal for security page or landing sections.
 */
export function TrustCardGrid({
  items = TRUST_INDICATORS,
  columns = 3,
  className,
}: {
  items?: TrustItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid gap-3 sm:gap-4", colClass, className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 transition-shadow hover:shadow-sm"
        >
          <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
            <item.icon className="h-[18px] w-[18px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{item.label}</p>
            {item.description && (
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Subtle single-line trust statement with a shield icon.
 * Use below CTAs or at the bottom of sign-up forms.
 */
export function TrustStatement({
  text = "Seus dados são privados e protegidos. Cada pastor acessa apenas seu próprio ambiente.",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <p className={cn("flex items-center justify-center gap-1.5 text-xs text-muted-foreground", className)}>
      <ShieldCheck className="h-3.5 w-3.5 text-primary/60 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
