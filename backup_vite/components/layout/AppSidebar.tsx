import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, CalendarDays, CheckSquare, Mic, BookOpen, FileEdit,
  BarChart3, Wallet, BookMarked, Church, Bot, BookHeart, ClipboardList,
  LogOut, CreditCard, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, SidebarSeparator, SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import staffLogoLight from "@/assets/staff-logo-light.png";

/* ── Sidebar icon color mapping ── */
const iconColorMap: Record<string, string> = {
  "/dashboard": "icon-box-teal",
  "/agenda": "icon-box-blue",
  "/tarefas": "icon-box-emerald",
  "/planner": "icon-box-cyan",
  "/pregacoes": "icon-box-violet",
  "/editor": "icon-box-indigo",
  "/biblioteca": "icon-box-orange",
  "/relatorios": "icon-box-amber",
  "/financeiro": "icon-box-emerald",
  "/biblia": "icon-box-rose",
  "/metodista": "icon-box-teal",
  "/assistente": "icon-box-indigo",
  "/diario": "icon-box-violet",
  "/assinatura": "icon-box-amber",
};

const groups = [
  {
    label: "Organização",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Agenda", url: "/agenda", icon: CalendarDays },
      { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
      { title: "Planner", url: "/planner", icon: ClipboardList },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { title: "Pregações", url: "/pregacoes", icon: Mic },
      { title: "Editor", url: "/editor", icon: FileEdit },
      { title: "Biblioteca", url: "/biblioteca", icon: BookOpen },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
    ],
  },
  {
    label: "Apoio",
    items: [
      { title: "Bíblia", url: "/biblia", icon: BookMarked },
      { title: "Área Metodista", url: "/metodista", icon: Church },
      { title: "Assistente", url: "/assistente", icon: Bot },
      { title: "Diário", url: "/diario", icon: BookHeart },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const resolvedAvatarUrl = useAvatarUrl(profile?.avatar_url);

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="sidebar-glow">
      {/* ── Header / Logo ── */}
      <SidebarHeader className="px-3 py-4">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <img src={staffLogoLight} alt="Staff care" className="h-7 object-contain opacity-90" />
            <button
              onClick={toggleSidebar}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={toggleSidebar}
            className="h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </SidebarHeader>

      <SidebarSeparator className="opacity-30" />

      {/* ── Navigation groups ── */}
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-heading uppercase tracking-[0.15em] text-sidebar-foreground/35 px-3">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  const colorClass = iconColorMap[item.url] || "icon-box-primary";
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={collapsed ? item.title : undefined}
                        size="default"
                      >
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-sans font-medium transition-all duration-200 hover:bg-sidebar-accent/50"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                        >
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${active ? 'bg-white/15 scale-105' : `bg-white/[0.04]`}`}
                            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                          >
                            <item.icon className="h-[16px] w-[16px]" />
                          </div>
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ── Conta ── */}
        <SidebarGroup className="py-1.5">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-heading uppercase tracking-[0.15em] text-sidebar-foreground/35 px-3">
              Conta
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/assinatura")}
                  tooltip={collapsed ? "Assinatura" : undefined}
                >
                  <NavLink
                    to="/assinatura"
                    className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-sans font-medium transition-all duration-200 hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${isActive("/assinatura") ? 'bg-white/15 scale-105' : 'bg-white/[0.04]'}`}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                      <CreditCard className="h-[16px] w-[16px]" />
                    </div>
                    {!collapsed && <span>Assinatura</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: profile + logout ── */}
      <SidebarFooter className="border-t border-sidebar-border/30 p-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/perfil")}
              tooltip={collapsed ? "Meu Perfil" : undefined}
              className="flex items-center gap-2.5 px-2 py-2 text-sm font-sans text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all duration-200"
            >
              <Avatar className="h-7 w-7 shrink-0 ring-2 ring-sidebar-accent/30">
                <AvatarImage src={resolvedAvatarUrl || undefined} alt="Foto" />
                <AvatarFallback className="text-[9px] font-heading bg-sidebar-accent text-sidebar-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && profile?.full_name && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{profile.full_name}</p>
                  <p className="text-[10px] text-sidebar-foreground/45 truncate">
                    {profile.pastoral_title || "Pastor"}
                  </p>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setLogoutOpen(true)}
              tooltip={collapsed ? "Sair" : undefined}
              className="flex items-center gap-3 px-2.5 py-2 text-sm font-sans text-sidebar-foreground/45 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-[16px] w-[16px] shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="sm:max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Sair da plataforma?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">Você será desconectado(a) e precisará entrar novamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={signOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans rounded-xl">Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
