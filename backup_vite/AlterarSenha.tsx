import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import staffLogoDark from "@/assets/staff-logo-dark.png";

const PASSWORD_RULES = [
  { label: "Mínimo 9 caracteres", test: (p: string) => p.length >= 9 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um número", test: (p: string) => /\d/.test(p) },
  { label: "Um símbolo (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function AlterarSenha() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, clearMustChangePassword } = useAuth();

  const passwordValid = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;

    setLoading(true);
    // Update password
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      toast({ title: "Erro ao alterar senha", description: pwError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Clear must_change_password flag via secure backend function
    if (user) {
      const session = (await supabase.auth.getSession()).data.session;
      await supabase.functions.invoke("update-profile-flags", {
        body: { flag: "clear_must_change_password" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
    }
    clearMustChangePassword();

    toast({ title: "Senha alterada com sucesso! ✅", description: "Bem-vindo(a) ao Staff care." });
    navigate("/", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={staffLogoDark} alt="Staff care" className="h-20 mx-auto object-contain" />
          <div className="space-y-2">
            <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
            <h1 className="font-heading text-xl font-bold text-foreground">
              Criar sua senha pessoal
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Por segurança, é necessário criar uma nova senha antes de continuar.
              Escolha uma senha forte e que só você saiba.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crie uma senha forte"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                        {ok ? <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                        <span className={ok ? "text-green-700" : "text-muted-foreground"}>{rule.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> As senhas não são iguais.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-11 text-base" disabled={loading || !passwordValid || !passwordsMatch}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar nova senha e continuar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Sair da conta
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
