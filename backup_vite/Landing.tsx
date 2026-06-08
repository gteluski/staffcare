import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays, CheckSquare, BookOpen, FileText, BarChart3, DollarSign,
  BookMarked, Bot, PenTool, Smartphone, Shield, Heart, ArrowRight,
  Monitor, Tablet, Star, Users, Clock, LayoutDashboard, MessageCircle,
  FileText as DocIcon, HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/PublicFooter";
import { HeroGeometric } from "@/components/landing/HeroGeometric";
import { PlatformShowcase } from "@/components/landing/PlatformShowcase";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/* ── Benefits ── */
const BENEFITS = [
  {
    icon: CalendarDays,
    title: "Organize sua rotina pastoral com mais clareza",
    desc: "Reúna agenda, compromissos, planejamento e registros importantes em um só ambiente.",
  },
  {
    icon: BookOpen,
    title: "Prepare sermões e estudos com mais praticidade",
    desc: "Escreva, revise, organize séries de pregações e utilize o modo pregação com mais conforto e legibilidade.",
  },
  {
    icon: Shield,
    title: "Guarde seus materiais com segurança e facilidade",
    desc: "Mantenha sermões, atas, estudos, relatórios e documentos sempre acessíveis na nuvem.",
  },
  {
    icon: BarChart3,
    title: "Acompanhe sua rotina ministerial com mais visão",
    desc: "Visualize compromissos, atividades, pregações e relatórios de forma útil para o dia a dia.",
  },
  {
    icon: Bot,
    title: "Conte com um assistente pastoral",
    desc: "Receba apoio para estudos, organização, planejamento e reflexão com linguagem pastoral.",
  },
  {
    icon: Smartphone,
    title: "Use com facilidade em qualquer dispositivo",
    desc: "Acesse pelo celular, tablet ou computador em uma experiência simples, leve e acolhedora.",
  },
];

/* ── Modules ── */
const MODULES = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Visão geral da sua rotina pastoral com resumos e ações rápidas." },
  { icon: CalendarDays, title: "Agenda", desc: "Calendário litúrgico, feriados, datas metodistas e compromissos pessoais." },
  { icon: CheckSquare, title: "Tarefas", desc: "Organize visitas, reuniões e pendências com prioridade e prazo." },
  { icon: BookOpen, title: "Pregações", desc: "Esboce, desenvolva e organize sermões com texto bíblico e notas." },
  { icon: FileText, title: "Biblioteca", desc: "Armazene atas, relatórios, estudos e documentos por pastas." },
  { icon: PenTool, title: "Editor", desc: "Escreva documentos e textos pastorais com editor rico integrado." },
  { icon: BarChart3, title: "Relatórios", desc: "Gere relatórios pastorais para conferências e prestação de contas." },
  { icon: DollarSign, title: "Financeiro", desc: "Controle entradas, saídas, dízimos e despesas com clareza." },
  { icon: BookMarked, title: "Bíblia", desc: "Consulte as Escrituras diretamente na plataforma." },
  { icon: HeartHandshake, title: "Área de apoio pastoral", desc: "Recursos e referências para o cuidado ministerial diário." },
  { icon: Bot, title: "Assistente Pastoral", desc: "IA com base wesleyana para teologia, liturgia e organização." },
];

/* ── Who it's for ── */
const AUDIENCE = [
  { icon: Users, text: "Pastores e pastoras" },
  { icon: Heart, text: "Liderança ministerial" },
  { icon: Clock, text: "Rotina pastoral real" },
  { icon: Star, text: "Organização pessoal e ministerial" },
];

/* ── Trust lines ── */
const TRUST_ITEMS = [
  { icon: Clock, text: "Organizada para a rotina real do ministério" },
  { icon: Shield, text: "Dados privados e ambiente pessoal" },
  { icon: Star, text: "Leve, clara e fácil de usar" },
  { icon: Heart, text: "Feita para o cuidado pastoral diário" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ── Hero ── */}
      <HeroGeometric />

      {/* ── Benefits ── */}
      <section id="beneficios" className="section-premium py-24 sm:py-32 bg-background aurora-bg aurora-soft">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
          >
            <p className="text-xs font-heading font-semibold text-primary tracking-[0.2em] uppercase mb-3">Benefícios</p>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-5 tracking-tight">
              Tudo o que você precisa para uma rotina ministerial mais organizada
            </h2>
            <p className="font-sans text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Uma plataforma pensada para apoiar o dia a dia do ministério com praticidade, clareza e continuidade.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                className="benefit-card group"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                variants={fadeUp}
              >
                <div className="benefit-icon-box">
                  <b.icon />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground mb-2 tracking-tight">{b.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden aurora-bg aurora-dark"
        style={{ background: "linear-gradient(165deg, #1e3440 0%, #243d4d 50%, #2c4a5c 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(at 70% 30%, rgba(200,220,240,0.08) 0%, transparent 50%)`,
        }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
          >
            <p className="text-xs font-heading font-semibold text-white/45 tracking-[0.2em] uppercase mb-3">Para quem é</p>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight">
              Para quem esta plataforma foi criada
            </h2>
          </motion.div>

          <motion.div
            className="max-w-2xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            variants={fadeUp}
          >
            <div className="bg-white/[0.06] rounded-2xl border border-white/[0.08] p-8 sm:p-10 text-center mb-10 backdrop-blur-sm">
              <p className="font-sans text-white/75 leading-relaxed text-base sm:text-lg">
                Se você é pastor, pastora ou exerce liderança ministerial em sua igreja, esta plataforma foi pensada para a rotina real do ministério — não para uma rotina idealizada.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {AUDIENCE.map((item, i) => (
                <motion.div
                  key={item.text}
                  className="flex flex-col items-center gap-3 text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                  variants={fadeUp}
                >
                  <div className="h-11 w-11 rounded-xl bg-white/[0.08] flex items-center justify-center backdrop-blur-sm border border-white/[0.06]">
                    <item.icon className="h-5 w-5 text-white/65" />
                  </div>
                  <span className="text-white/65 text-xs sm:text-sm font-sans font-medium leading-tight">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modulos" className="section-premium py-24 sm:py-32 bg-background aurora-bg aurora-soft">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
          >
            <p className="text-xs font-heading font-semibold text-primary tracking-[0.2em] uppercase mb-3">Módulos</p>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-5 tracking-tight">
              Tudo em um só lugar
            </h2>
            <p className="font-sans text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Uma experiência completa para acompanhar a rotina pastoral, organizar o ministério e facilitar o cuidado diário com mais constância e direção.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                className="module-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                variants={fadeUp}
              >
                <div className="module-icon-box">
                  <m.icon />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold text-foreground mb-0.5 tracking-tight">{m.title}</h3>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Showcase ── */}
      <PlatformShowcase />

      {/* ── Mobile / App ── */}
      <section className="section-premium py-24 sm:py-32 bg-background aurora-bg aurora-soft">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              className="order-2 lg:order-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              variants={fadeUp}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Smartphone, label: "iPhone e Android" },
                  { icon: Tablet, label: "iPad e Tablet" },
                  { icon: Monitor, label: "Notebook e Desktop" },
                  { icon: Star, label: "Instalável como App" },
                ].map((d) => (
                  <div key={d.label} className="device-card">
                    <d.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                    <p className="font-heading text-xs font-semibold text-foreground">{d.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              variants={fadeUp}
            >
              <p className="text-xs font-heading font-semibold text-primary tracking-[0.2em] uppercase mb-3">Use onde estiver</p>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6 tracking-tight">
                No celular, no tablet ou no computador
              </h2>
              <p className="font-sans text-muted-foreground leading-relaxed mb-6">
                A plataforma funciona bem no computador, no tablet, no iPhone e no Android, com uma experiência fluida e prática para o dia a dia.
              </p>
              <p className="font-sans text-muted-foreground leading-relaxed">
                Pode até instalar como um aplicativo direto do navegador — sem precisar de loja de apps.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section
        className="py-24 sm:py-32 relative overflow-hidden aurora-bg aurora-dark"
        style={{ background: "linear-gradient(165deg, #1e3440 0%, #243d4d 50%, #2c4a5c 100%)" }}
      >
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6">
          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
          >
            <div className="text-center mb-12">
              <p className="text-xs font-heading font-semibold text-white/45 tracking-[0.2em] uppercase mb-3">Confiança</p>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-5 tracking-tight">
                Uma experiência séria, clara e acolhedora
              </h2>
              <p className="font-sans text-white/45 max-w-xl mx-auto leading-relaxed">
                Segurança, privacidade e transparência são compromissos contínuos, não promessas vagas.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5 mb-10">
              {TRUST_ITEMS.map((item) => (
                <div key={item.text} className="trust-badge">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/[0.05]">
                    <item.icon className="h-4 w-4 text-white/65" />
                  </div>
                  <span className="font-sans text-sm font-medium text-white/75">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link to="/seguranca" className="text-white/50 hover:text-white/85 transition-colors font-sans font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Segurança e Privacidade
              </Link>
              <Link to="/documentos" className="text-white/50 hover:text-white/85 transition-colors font-sans font-medium flex items-center gap-1.5">
                <DocIcon className="h-3.5 w-3.5" /> Central de Documentos
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Subscription ── */}
      <section className="section-premium py-24 sm:py-32 bg-background aurora-bg aurora-soft">
        <motion.div
          className="max-w-2xl mx-auto px-5 sm:px-6 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          variants={fadeUp}
        >
          <p className="text-xs font-heading font-semibold text-primary tracking-[0.2em] uppercase mb-3">Assinatura</p>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-5 tracking-tight">
            Comece com 7 dias gratuitos
          </h2>
          <p className="font-sans text-muted-foreground leading-relaxed max-w-lg mx-auto mb-12">
            Crie sua conta gratuitamente, experimente a plataforma por 7 dias e, depois desse período, continue com sua assinatura mensal de R$&nbsp;79,90 por usuário.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-semibold rounded-full px-10 h-14 text-base btn-premium">
                Criar conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/planos">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-border text-foreground hover:bg-card rounded-full px-8 h-14 text-base font-sans">
                Ver assinatura
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-24 px-5 sm:py-36 relative overflow-hidden aurora-bg aurora-dark"
        style={{ background: "linear-gradient(165deg, #1e3440 0%, #243d4d 50%, #2c4a5c 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
        }} />

        <motion.div
          className="relative max-w-xl mx-auto sm:px-6 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          variants={fadeUp}
        >
          <h2 className="font-heading text-[1.6rem] leading-snug sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-white tracking-tight">
            Comece a organizar sua caminhada ministerial com mais clareza, leveza e propósito.
          </h2>

          <p className="font-sans text-sm sm:text-base text-white/45 mb-12 sm:mb-14 leading-relaxed max-w-md mx-auto">
            Crie sua conta, explore por 7 dias e descubra como a plataforma pode apoiar seu ministério.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup" className="block">
              <Button size="lg" className="w-full sm:w-auto bg-white text-[#243d4d] hover:bg-white/95 font-heading font-semibold rounded-full px-10 h-14 text-base shadow-xl shadow-black/12 btn-premium">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:contato@voxion.com.br" className="block">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/15 text-white/85 hover:bg-white/8 rounded-full px-8 h-14 text-base bg-white/[0.04] backdrop-blur-md font-sans transition-all duration-300">
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar sobre acesso
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <PublicFooter />
    </div>
  );
}
