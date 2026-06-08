import { Link } from "react-router-dom";
import { ArrowRight, Menu, X, MessageCircle, Check, Calendar, BookOpen, FileText, BarChart3, Brain, Smartphone, ListTodo, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/PublicFooter";
import { PlanosFaq } from "@/components/planos/PlanosFaq";
import { FAQ } from "@/lib/plans-data";
import staffLogoDark from "@/assets/staff-logo-dark.png";
import { useState } from "react";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: Calendar, text: "Agenda com calendário litúrgico" },
  { icon: ListTodo, text: "Tarefas, Kanban e planejamento" },
  { icon: BookOpen, text: "Pregações com modo pregação" },
  { icon: FileText, text: "Editor e biblioteca de documentos" },
  { icon: BarChart3, text: "Relatórios e controle financeiro" },
  { icon: BookMarked, text: "Bíblia integrada" },
  { icon: Brain, text: "Assistente pastoral com IA" },
  { icon: Smartphone, text: "Funciona em celular, tablet e PC" },
];

export default function Planos() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: "#f1f1f1" }}>
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-border/50" style={{ backgroundColor: "rgba(241,241,241,0.92)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><img src={staffLogoDark} alt="Staff care" className="h-8 sm:h-9" /></Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">Início</Link>
            <a href="#assinatura" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">Assinatura</a>
            <a href="#faq" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">Dúvidas</a>
            <Link to="/auth">
              <Button size="sm" className="font-heading rounded-full px-5" style={{ backgroundColor: "#243d4d", color: "#f1f1f1" }}>Entrar</Button>
            </Link>
          </div>
          <button className="sm:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/50 px-4 py-4 flex flex-col gap-3" style={{ backgroundColor: "#f1f1f1" }}>
            <Link to="/" className="text-sm font-sans text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>Início</Link>
            <a href="#assinatura" className="text-sm font-sans text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>Assinatura</a>
            <a href="#faq" className="text-sm font-sans text-muted-foreground py-2" onClick={() => setMobileMenuOpen(false)}>Dúvidas</a>
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full font-heading rounded-full" style={{ backgroundColor: "#243d4d", color: "#f1f1f1" }}>Entrar</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Header ── */}
      <section className="py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-4 sm:px-6"
        >
          <p className="text-xs font-heading uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Assinatura
          </p>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-4 leading-tight" style={{ color: "#243d4d" }}>
            Comece com 7 dias gratuitos
          </h1>
          <p className="text-muted-foreground font-sans leading-relaxed max-w-xl mx-auto">
            Experimente todos os módulos da plataforma sem compromisso. Após o período gratuito, continue com uma assinatura simples e acessível.
          </p>
        </motion.div>
      </section>

      {/* ── Pricing card ── */}
      <section id="assinatura" className="pb-16 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto px-4 sm:px-6"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(36,61,77,0.12)" }}>
            {/* Header band */}
            <div className="px-6 sm:px-8 py-6 text-center" style={{ backgroundColor: "#243d4d" }}>
              <p className="text-[11px] font-heading uppercase tracking-[0.2em] text-white/40 mb-2">
                Acesso completo
              </p>
              <h2 className="text-xl font-heading font-bold text-white">
                Plano Staff care
              </h2>
              <p className="text-sm font-sans text-white/55 mt-1">
                Tudo o que o ministério pastoral precisa, em um só lugar.
              </p>
            </div>

            {/* Body */}
            <div className="bg-white px-6 sm:px-8 py-8 space-y-6">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl sm:text-5xl font-heading font-bold" style={{ color: "#243d4d" }}>
                    R$ 79,90
                  </span>
                  <span className="text-sm font-sans text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs font-sans text-muted-foreground mt-1.5">
                  por usuário · após 7 dias gratuitos
                </p>
              </div>

              <div className="border-t border-border/40" />

              {/* Features */}
              <ul className="space-y-3">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(36,61,77,0.06)" }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: "#243d4d" }} />
                    </div>
                    <span className="text-sm font-sans text-foreground/80">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border/40" />

              {/* CTA */}
              <Link to="/auth?mode=signup" className="block">
                <Button
                  className="w-full rounded-xl h-12 font-heading font-semibold text-base shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: "#243d4d", color: "#f1f1f1" }}
                >
                  Começar 7 dias grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-center text-xs font-sans text-muted-foreground">
                Sem compromisso durante o período gratuito.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "rgba(36,61,77,0.03)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-3" style={{ color: "#243d4d" }}>
              Como funciona
            </h2>
            <p className="text-muted-foreground text-sm font-sans">
              Três passos simples para começar a usar a plataforma.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Crie sua conta", desc: "Cadastre-se gratuitamente em menos de um minuto." },
              { step: "2", title: "Explore por 7 dias", desc: "Acesse todos os módulos e organize sua rotina pastoral." },
              { step: "3", title: "Continue com a assinatura", desc: "Após o período gratuito, assine por R$ 79,90/mês para manter o acesso." },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Number(item.step) * 0.1 }}
                className="text-center"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "rgba(36,61,77,0.08)" }}
                >
                  <span className="text-sm font-heading font-bold" style={{ color: "#243d4d" }}>
                    {item.step}
                  </span>
                </div>
                <h3 className="text-sm font-heading font-semibold mb-1" style={{ color: "#243d4d" }}>
                  {item.title}
                </h3>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-3" style={{ color: "#243d4d" }}>
              Dúvidas frequentes
            </h2>
            <p className="text-muted-foreground text-sm font-sans">
              Respostas claras para as perguntas mais comuns.
            </p>
          </div>
          <PlanosFaq items={FAQ} />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: "#243d4d" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4 leading-tight text-white">
            Experimente 7 dias grátis. Sem compromisso.
          </h2>
          <p className="text-white/50 font-sans leading-relaxed mb-10 max-w-xl mx-auto">
            Crie sua conta agora, explore todos os módulos e descubra como a plataforma pode apoiar sua rotina pastoral.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button
                size="lg"
                className="w-full sm:w-auto font-heading font-semibold rounded-full px-10 h-12 text-base shadow-lg"
                style={{ backgroundColor: "#f1f1f1", color: "#243d4d" }}
              >
                Começar 7 dias grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:contato@voxion.com.br?subject=Interesse na plataforma pastoral">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-8 h-12 text-base bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar conosco
              </Button>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
