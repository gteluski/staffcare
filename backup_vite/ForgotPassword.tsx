import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import staffLogoDark from "@/assets/staff-logo-dark.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o e-mail. Tente novamente.",
        variant: "destructive",
      });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={staffLogoDark} alt="Staff care" className="h-16 mx-auto object-contain" />
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Recuperar senha
            </h1>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              {sent
                ? "Verifique sua caixa de entrada."
                : "Informe seu e-mail e enviaremos um link para redefinir sua senha."}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="bg-accent/50 rounded-lg p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para criar uma nova senha.
                </p>
              </div>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail cadastrado</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar link de recuperação
              </Button>
              <div className="text-center">
                <Link to="/auth" className="text-sm text-primary hover:underline">
                  <ArrowLeft className="inline h-3 w-3 mr-1" />
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
