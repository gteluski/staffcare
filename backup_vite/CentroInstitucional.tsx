import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Lock, Scale, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/PublicFooter";
import staffLogoDark from "@/assets/staff-logo-dark.png";

const SECTIONS = [
  {
    title: "Documentos Legais",
    icon: FileText,
    items: [
      {
        path: "/termos-de-uso",
        title: "Termos de Uso",
        desc: "Regras gerais de acesso, conduta, uso da conta e funcionamento do ambiente.",
      },
      {
        path: "/cookies",
        title: "Política de Cookies",
        desc: "Diretrizes sobre uso de cookies e tecnologias semelhantes na plataforma.",
      },
    ],
  },
  {
    title: "Privacidade e Proteção de Dados",
    icon: Shield,
    items: [
      {
        path: "/privacidade",
        title: "Política de Privacidade",
        desc: "Transparência sobre coleta, uso, compartilhamento e retenção de dados pessoais.",
      },
      {
        path: "/lgpd",
        title: "LGPD e Tratamento de Dados",
        desc: "Diretrizes operacionais para conformidade com a Lei Geral de Proteção de Dados.",
      },
    ],
  },
  {
    title: "Segurança e Governança",
    icon: Lock,
    items: [
      {
        path: "/seguranca",
        title: "Segurança e Privacidade",
        desc: "Conexão protegida, acesso autenticado, controle por perfil e práticas de segurança.",
      },
      {
        path: "/incidentes",
        title: "Plano de Resposta a Incidentes",
        desc: "Diretrizes para registro, triagem, contenção e comunicação de incidentes.",
      },
    ],
  },
  {
    title: "Compliance e Evidências",
    icon: Scale,
    items: [
      {
        path: "/compliance",
        title: "Compliance e Evidências Institucionais",
        desc: "Evidências públicas sobre controles, governança e readiness da plataforma.",
      },
    ],
  },
];

export default function CentroInstitucional() {
  return (
    <div className="min-h-screen bg-background" >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
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

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
          Central de Documentos Institucionais
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Acesse todos os documentos legais, políticas de privacidade, segurança e governança da plataforma Staff care em um só lugar.
        </p>
      </section>

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-10">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-4">
              <section.icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Contact section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Contato e Suporte</h2>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Para dúvidas sobre privacidade, segurança, exercício de direitos ou qualquer questão institucional, entre em contato pelo canal oficial.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <a href="mailto:contato@voxion.com.br">contato@voxion.com.br</a>
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Segunda a Sexta — 9h às 18h
              </p>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
