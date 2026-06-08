'use client';

import { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatTrigger } from "@/components/chat/ChatTrigger";
import { TrialBanner } from "@/components/subscription/TrialBanner";
import { ExpiredTrialModal } from "@/components/subscription/ExpiredTrialModal";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useLiturgicalSeason } from "@/hooks/useLiturgicalSeason";
import { useSubscription } from "@/hooks/useSubscription";
import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter } from "next/navigation";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const UNRESTRICTED_ROUTES = ["/assinatura", "/perfil", "/dashboard"];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agenda": "Agenda",
  "/tarefas": "Tarefas",
  "/planner": "Planner Ministerial",
  "/pregacoes": "Pregações",
  "/editor": "Editor",
  "/biblioteca": "Biblioteca",
  "/relatorios": "Relatórios",
  "/financeiro": "Financeiro",
  "/biblia": "Bíblia",
  "/metodista": "Área Metodista",
  "/assistente": "Assistente Pastoral",
  "/diario": "Diário Ministerial",
  "/perfil": "Meu Perfil",
  "/assinatura": "Assinatura",
};

function getPageTitle(pathname: string) {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Staff care";
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const season = useLiturgicalSeason();
  const { hasAccess, isLoading } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();

  const isUnrestricted = UNRESTRICTED_ROUTES.some(r => pathname.startsWith(r));

  // If the user's trial expired and they are accessing restricted pages, redirect to signature
  if (!isLoading && !hasAccess && !isUnrestricted) {
    router.push("/assinatura");
    return null;
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full overflow-hidden">
        <AppSidebar />

        <SidebarInset>
          <PaymentTestModeBanner />
          <TrialBanner />

          {/* Liturgical accent line */}
          <div
            className="h-[2px] shrink-0"
            style={{
              background: `linear-gradient(90deg, hsl(${season.accentHsl}), hsl(${season.accentHsl} / 0.4))`,
            }}
          />

          {/* ── Premium glass header ── */}
          <header className="glass-header h-12 flex items-center gap-2 px-4 shrink-0 sticky top-0 z-20">
            <SidebarTrigger className="-ml-1 text-[#243d4d]" />
            <Separator orientation="vertical" className="h-4 mx-1 opacity-30" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-heading text-sm font-semibold text-foreground tracking-tight">
                    {pageTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0 ring-2 ring-background"
                style={{ background: `hsl(${season.accentHsl})` }}
              />
              <span className="font-sans font-medium hidden sm:inline text-muted-foreground">
                {season.label}
              </span>
            </div>
          </header>

          {/* ── Page content with aurora background ── */}
          <main className="flex-1 overflow-auto p-4 sm:p-5 md:p-6 lg:p-8 safe-bottom aurora-bg aurora-medium">
            {children}
          </main>
        </SidebarInset>
      </div>

      <ExpiredTrialModal />

      {!chatOpen && <ChatTrigger onClick={() => setChatOpen(true)} />}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </SidebarProvider>
  );
}
