import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import dashboardImg from "@/assets/screenshots/dashboard-preview.jpg";
import agendaImg from "@/assets/screenshots/agenda-preview.jpg";
import editorImg from "@/assets/screenshots/editor-preview.jpg";
import tarefasImg from "@/assets/screenshots/tarefas-preview.jpg";
import bibliotecaImg from "@/assets/screenshots/biblioteca-preview.jpg";
import assistenteImg from "@/assets/screenshots/assistente-preview.jpg";

interface ScreenCard {
  src: string;
  label: string;
}

const ROW_1: ScreenCard[] = [
  { src: dashboardImg, label: "Dashboard" },
  { src: agendaImg, label: "Agenda" },
  { src: editorImg, label: "Editor de Sermões" },
];

const ROW_2: ScreenCard[] = [
  { src: tarefasImg, label: "Tarefas" },
  { src: bibliotecaImg, label: "Biblioteca" },
  { src: assistenteImg, label: "Assistente Pastoral" },
];

/* ── Infinite marquee row ── */
function MarqueeRow({
  items,
  reverse = false,
  speed = 35,
}: {
  items: ScreenCard[];
  reverse?: boolean;
  speed?: number;
}) {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden group">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 z-10 pointer-events-none" style={{
        background: "linear-gradient(to right, #243d4d, transparent)",
      }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 z-10 pointer-events-none" style={{
        background: "linear-gradient(to left, #243d4d, transparent)",
      }} />

      <motion.div
        className="flex gap-5 sm:gap-6 w-max group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-${reverse ? "reverse" : "forward"} ${speed}s linear infinite`,
        }}
      >
        {doubled.map((card, i) => (
          <div
            key={`${card.label}-${i}`}
            className="shrink-0 w-[280px] sm:w-[360px] lg:w-[420px] rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          >
            <img
              src={card.src}
              alt={card.label}
              loading="lazy"
              width={420}
              height={263}
              className="w-full h-auto object-cover"
            />
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
              <span className="text-xs font-heading text-white/45 tracking-wide">
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Main section ── */
export function PlatformShowcase() {
  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32 aurora-bg aurora-dark"
      style={{ background: "linear-gradient(165deg, #1e3440 0%, #243d4d 50%, #2c4a5c 100%)" }}
    >
      <style>{`
        @keyframes marquee-forward {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
      }} />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          className="max-w-2xl mb-16 sm:mb-18"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-heading font-semibold text-white/35 tracking-[0.2em] uppercase mb-4">
            Plataforma em uso
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6 tracking-tight">
            Uma experiência criada para a rotina real do ministério
          </h2>
          <p className="font-sans text-sm sm:text-base text-white/40 leading-relaxed max-w-lg mb-8">
            Agenda, planejamento, pregações, documentos, relatórios, Bíblia e assistente pastoral — tudo reunido em uma plataforma prática e organizada.
          </p>
          <Link to="/auth?mode=signup">
            <Button
              size="lg"
              className="bg-white text-[#243d4d] hover:bg-white/95 font-heading font-semibold rounded-full px-8 h-12 text-sm shadow-xl shadow-black/12 btn-premium"
            >
              Conhecer a plataforma
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Marquee rows — full width */}
      <div className="space-y-5 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <MarqueeRow items={ROW_1} speed={40} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <MarqueeRow items={ROW_2} reverse speed={45} />
        </motion.div>
      </div>
    </section>
  );
}
