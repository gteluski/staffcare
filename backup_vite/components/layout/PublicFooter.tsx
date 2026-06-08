import { Link } from "react-router-dom";
import staffLogoLight from "@/assets/staff-logo-light.png";

const LEGAL_LINKS = [
  { path: "/termos-de-uso", label: "Termos de Uso" },
  { path: "/privacidade", label: "Privacidade" },
  { path: "/seguranca", label: "Segurança" },
];

export function PublicFooter() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(165deg, #1e3440 0%, #243d4d 50%, #2c4a5c 100%)" }}
    >
      {/* Subtle top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 sm:py-20 flex flex-col items-center gap-8">
        {/* Logo */}
        <img
          src={staffLogoLight}
          alt="Staff care"
          className="h-12 sm:h-14 object-contain opacity-75"
        />

        {/* Support text */}
        <p className="font-sans text-sm sm:text-base text-white/40 text-center leading-relaxed max-w-md">
          Organização, planejamento e apoio pastoral para a rotina real do ministério.
        </p>

        {/* Divider */}
        <div
          className="w-16 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}
        />

        {/* Legal links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LEGAL_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-xs font-sans text-white/30 hover:text-white/65 transition-colors duration-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="font-heading text-[11px] text-white/20 tracking-wider text-center">
          Staff care © {new Date().getFullYear()}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
