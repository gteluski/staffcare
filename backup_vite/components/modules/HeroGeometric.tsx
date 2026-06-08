import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import staffLogoLight from "@/assets/staff-logo-light.png";

/* ── Floating geometric shape ── */
function FloatingShape({
  className,
  delay = 0,
  duration = 20,
  size,
  style,
}: {
  className?: string;
  delay?: number;
  duration?: number;
  size: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className ?? ""}`}
      style={{ width: size, height: size, ...style }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.8, 1, 1.05, 0.95],
        y: [0, -15, 5, -10],
        x: [0, 8, -5, 3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    />
  );
}

/* ── Main hero ── */
export function HeroGeometric() {
  const containerRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 30, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 30, damping: 20 });

  const parallaxX = useTransform(springX, [0, 1], [-10, 10]);
  const parallaxY = useTransform(springY, [0, 1], [-8, 8]);
  const logoParallaxX = useTransform(springX, [0, 1], [-5, 5]);
  const logoParallaxY = useTransform(springY, [0, 1], [-4, 4]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    const el = containerRef.current;
    el?.addEventListener("mousemove", handleMouse);
    return () => el?.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden min-h-[100dvh] sm:min-h-[92vh] flex flex-col aurora-bg aurora-dark"
      style={{
        background: "linear-gradient(165deg, #1e3440 0%, #243d4d 40%, #2c4a5c 100%)",
      }}
    >
      {/* ── Geometric shapes ── */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingShape
          size={600}
          delay={0}
          duration={25}
          className="opacity-[0.06]"
          style={{
            top: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
          }}
        />
        <FloatingShape
          size={400}
          delay={3}
          duration={22}
          className="opacity-[0.04]"
          style={{
            top: "15%",
            right: "-8%",
            background: "radial-gradient(circle, rgba(200,220,230,0.15) 0%, transparent 70%)",
          }}
        />
        <FloatingShape
          size={250}
          delay={5}
          duration={18}
          className="opacity-[0.07]"
          style={{
            bottom: "10%",
            left: "8%",
            background: "radial-gradient(circle, rgba(241,241,241,0.1) 0%, transparent 70%)",
          }}
        />
        <FloatingShape
          size={150}
          delay={2}
          duration={15}
          className="opacity-[0.05]"
          style={{
            top: "50%",
            right: "18%",
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Depth lines with parallax */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <div
            className="absolute top-[18%] left-[5%] w-[35%] h-px opacity-[0.05]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
          />
          <div
            className="absolute top-[62%] right-[8%] w-[28%] h-px opacity-[0.04]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
          />
          <div
            className="absolute top-[35%] left-[58%] w-px h-[22%] opacity-[0.035]"
            style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent)" }}
          />
        </motion.div>

        {/* Subtle gradient mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                              radial-gradient(at 80% 20%, rgba(200,220,240,0.1) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* ── Top bar ── */}
      <motion.nav
        className="relative z-10 max-w-6xl mx-auto w-full px-5 sm:px-6 pt-5 sm:pt-7 flex items-center justify-end"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="flex items-center gap-3">
          <Link to="/auth?mode=signup">
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 text-white/90 hover:bg-white/10 hover:text-white rounded-full px-5 bg-white/[0.04] backdrop-blur-md font-heading text-xs transition-all duration-300"
            >
              Criar conta
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="sm"
              className="bg-white text-[#243d4d] hover:bg-white/90 rounded-full px-5 font-heading text-xs font-semibold shadow-lg shadow-black/10 btn-premium transition-all duration-300"
            >
              Login
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-6 pb-24 sm:pb-28">
        {/* Logo */}
        <motion.div
          className="mb-10 sm:mb-12"
          style={{ x: logoParallaxX, y: logoParallaxY }}
          initial={{ opacity: 0, scale: 0.85, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img
            src={staffLogoLight}
            alt="Staff care"
            className="h-28 sm:h-36 md:h-44 lg:h-52 object-contain drop-shadow-xl"
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-heading text-[1.5rem] sm:text-3xl md:text-4xl lg:text-[2.85rem] font-bold text-white text-center leading-[1.12] tracking-[-0.025em] max-w-2xl mb-7 sm:mb-9"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
        >
          A plataforma que ajuda você a organizar o ministério com mais clareza, constância e leveza.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="font-sans text-sm sm:text-base md:text-lg text-white/50 text-center leading-relaxed max-w-xl mb-11 sm:mb-14"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
        >
          Agenda, planejamento, pregações, documentos, relatórios, Bíblia e um assistente pastoral, tudo em um ambiente seguro, dinâmico e fácil de usar.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05 }}
        >
          <Link to="/auth?mode=signup" className="block">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-[#243d4d] hover:bg-white/95 font-heading font-semibold rounded-full px-10 h-14 text-base shadow-xl shadow-black/12 btn-premium"
            >
              Começar agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#beneficios" className="block">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white/15 text-white/85 hover:bg-white/8 hover:text-white rounded-full px-8 h-14 text-base bg-white/[0.04] backdrop-blur-md font-sans transition-all duration-300"
            >
              Ver como funciona
            </Button>
          </a>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-xs sm:text-sm text-white/30 font-sans mt-8 sm:mt-10 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.4 }}
        >
          Mais organização para servir com mais clareza.
        </motion.p>
      </div>

      {/* ── Bottom wave ── */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 70V35C240 5 480 5 720 35C960 65 1200 65 1440 35V70H0Z" fill="hsl(210 14% 95%)" />
        </svg>
      </div>
    </section>
  );
}
