import { Link, useLocation } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import staffLogoDark from "@/assets/staff-logo-dark.png";

const LEGAL_NAV = [
  { path: "/termos-de-uso", label: "Termos de Uso" },
  { path: "/privacidade", label: "Política de Privacidade" },
  { path: "/cookies", label: "Política de Cookies" },
  { path: "/seguranca", label: "Segurança e Privacidade" },
  { path: "/lgpd", label: "LGPD e Tratamento de Dados" },
  { path: "/compliance", label: "Compliance e Evidências" },
  { path: "/incidentes", label: "Plano de Resposta a Incidentes" },
];

export function LegalPageLayout({
  title,
  subtitle,
  version,
  children,
}: {
  title: string;
  subtitle: string;
  version?: string;
  children: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background" >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={staffLogoDark} alt="Staff care" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Início</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:flex lg:gap-10">
        {/* Sidebar nav — desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />Documentos
            </p>
            <nav className="space-y-0.5">
              {LEGAL_NAV.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block text-sm px-3 py-1.5 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="lg:hidden mb-8 overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-2">
              {LEGAL_NAV.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    location.pathname === item.path
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
            {version && (
              <p className="mt-3 text-xs text-muted-foreground/70 border-l-2 border-border pl-3">
                Versão: {version} · Responsável Técnico: Guilherme José Teluski · Contato: contato@voxion.com.br
              </p>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-sm sm:prose-base max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-h2:text-lg prose-h2:sm:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground prose-li:leading-relaxed
            prose-strong:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          ">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Staff care · Santo Antônio da Platina/PR · Todos os direitos reservados.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            {LEGAL_NAV.map((item) => (
              <Link key={item.path} to={item.path} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
