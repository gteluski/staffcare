import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, MailCheck, ArrowLeft } from "lucide-react";
import staffLogoLight from "@/assets/staff-logo-light.png";
import staffLogoDark from "@/assets/staff-logo-dark.png";
import authVisual from "@/assets/auth-visual.jpg";
import { motion, AnimatePresence } from "framer-motion";

const PASSWORD_RULES = [
  { label: "Mínimo 9 caracteres", test: (p: string) => p.length >= 9 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um número", test: (p: string) => /\d/.test(p) },
  { label: "Um símbolo (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordValid = useMemo(
    () => PASSWORD_RULES.every((r) => r.test(password)),
    [password]
  );
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (!passwordValid) {
        toast({ title: "Senha fraca", description: "A senha não atende todos os requisitos.", variant: "destructive" });
        return;
      }
      if (!passwordsMatch) {
        toast({ title: "Senhas diferentes", description: "As senhas digitadas não são iguais.", variant: "destructive" });
        return;
      }
      if (!fullName.trim()) {
        toast({ title: "Nome obrigatório", description: "Preencha seu nome completo.", variant: "destructive" });
        return;
      }
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg =
          error.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos. Verifique e tente novamente."
            : error.message === "Email not confirmed"
              ? "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação."
              : error.message;
        toast({ title: "Não foi possível entrar", description: msg, variant: "destructive" });
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim() || undefined },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: "Não foi possível criar a conta", description: error.message, variant: "destructive" });
      } else {
        setSignUpDone(true);
      }
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({ title: "Informe seu e-mail", description: "Digite o e-mail usado no cadastro.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail reenviado ✉️", description: "Verifique sua caixa de entrada novamente." });
    }
    setLoading(false);
  };

  /* ── Glass input className helper ── */
  const inputClass =
    "h-12 rounded-xl border-white/20 bg-white/60 backdrop-blur-sm font-sans text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-[#243d4d]/40 focus-visible:border-[#243d4d]/30 transition-all duration-200";

  /* ── Confirmation screen ── */
  if (signUpDone) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#f4f2ef" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-md shadow-[0_8px_40px_rgba(36,61,77,0.12)] p-10 text-center space-y-6"
        >
          <img src={staffLogoDark} alt="Staff care" className="h-14 mx-auto object-contain" />
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#243d4d" }}>
            <MailCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-xl font-bold" style={{ color: "#243d4d" }}>
            Verifique seu e-mail
          </h1>
          <div className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: "#f4f2ef" }}>
            <p className="text-sm font-sans leading-relaxed" style={{ color: "#243d4d" }}>
              Enviamos um link de confirmação para <strong>{email}</strong>.
            </p>
            <p className="text-sm font-sans leading-relaxed text-muted-foreground">
              Abra seu e-mail e clique no link para ativar sua conta. Se não encontrar, verifique a pasta de spam.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleResendConfirmation}
            disabled={loading}
            className="w-full h-12 rounded-xl font-sans"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reenviar e-mail de confirmação
          </Button>
          <button
            type="button"
            onClick={() => { setSignUpDone(false); setIsLogin(true); }}
            className="text-sm font-sans hover:underline inline-flex items-center gap-1.5"
            style={{ color: "#243d4d" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Main auth page ── */
  return (
    <div className="min-h-[100dvh] flex" style={{ backgroundColor: "#f4f2ef" }}>
      {/* ── Left form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-20 relative z-10">
        {/* Top bar */}
        <div className="absolute top-6 left-6 sm:left-12 lg:left-20 flex items-center gap-4">
          <Link to="/" className="group flex items-center gap-2 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao site
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px] mx-auto"
        >
          {/* Logo */}
          <img src={staffLogoDark} alt="Staff care" className="h-12 object-contain mb-10" />

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 12 : -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-7"
            >
              {/* Header */}
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-bold tracking-tight" style={{ color: "#243d4d" }}>
                  {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
                </h1>
                <p className="font-sans text-[15px] text-muted-foreground leading-relaxed">
                  {isLogin
                    ? "Entre para continuar sua rotina pastoral com clareza e organização."
                    : "Comece com 7 dias gratuitos — sem compromisso."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-sans text-[13px] font-medium" style={{ color: "#243d4d" }}>
                        Nome completo
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Guilherme Silva"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-sans text-[13px] font-medium" style={{ color: "#243d4d" }}>
                        Telefone <span className="text-muted-foreground font-normal">(opcional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sans text-[13px] font-medium" style={{ color: "#243d4d" }}>
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-sans text-[13px] font-medium" style={{ color: "#243d4d" }}>
                      Senha
                    </Label>
                    {isLogin && (
                      <Link
                        to="/esqueci-senha"
                        className="text-xs font-sans font-medium hover:underline transition-colors"
                        style={{ color: "#243d4d" }}
                      >
                        Esqueci minha senha
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      required
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground rounded-lg p-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {!isLogin && password.length > 0 && (
                    <ul className="space-y-1.5 mt-3 pl-0.5">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(password);
                        return (
                          <li key={rule.label} className="flex items-center gap-2 text-xs font-sans">
                            {ok ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                            )}
                            <span className={ok ? "text-emerald-600" : "text-muted-foreground/60"}>
                              {rule.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-sans text-[13px] font-medium" style={{ color: "#243d4d" }}>
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      required
                      className={inputClass}
                    />
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-xs font-sans text-destructive flex items-center gap-1.5 mt-1">
                        <XCircle className="h-3.5 w-3.5" /> As senhas não são iguais.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-heading rounded-xl shadow-[0_2px_12px_rgba(36,61,77,0.15)] hover:shadow-[0_4px_20px_rgba(36,61,77,0.2)] hover:-translate-y-[1px] transition-all duration-300"
                  style={{ backgroundColor: "#243d4d", color: "#fff" }}
                  disabled={loading || (!isLogin && (!passwordValid || !passwordsMatch))}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? "Entrar" : "Criar conta — 7 dias grátis"}
                </Button>
              </form>

              {/* Toggle login/signup */}
              <div className="text-center pt-4">
                <p className="text-sm font-sans text-muted-foreground">
                  {isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setPassword(""); setConfirmPassword(""); }}
                    className="font-semibold hover:underline transition-colors"
                    style={{ color: "#243d4d" }}
                  >
                    {isLogin ? "Criar conta" : "Entrar"}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Right visual panel (hidden on mobile) ── */}
      <div className="hidden lg:block lg:w-[48%] relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={authVisual}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(36,61,77,0.85) 0%, rgba(36,61,77,0.4) 40%, rgba(36,61,77,0.2) 100%)",
            }}
          />
        </motion.div>

        {/* Floating content */}
        <div className="relative z-10 flex flex-col justify-end h-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-5"
          >
            <img src={staffLogoLight} alt="Staff care" className="h-10 object-contain opacity-80" />
            <h2 className="font-heading text-2xl font-bold text-white/95 leading-snug max-w-[340px]">
              Organização e clareza para o ministério pastoral
            </h2>
            <p className="font-sans text-sm text-white/60 leading-relaxed max-w-[320px]">
              Planejamento, agenda, pregações, finanças e suporte teológico — tudo em um só lugar.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["Agenda", "Pregações", "Planejamento", "Assistente IA"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-sans font-medium px-3.5 py-1.5 rounded-full bg-white/10 text-white/70 backdrop-blur-sm border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
