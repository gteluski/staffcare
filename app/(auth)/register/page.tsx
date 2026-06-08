import { Suspense } from "react";
import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Cadastrar - Staffcare",
  description: "Crie sua conta no Staffcare e comece seu período de testes grátis de 7 dias.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Carregando...</div>}>
      <AuthPage initialMode="signup" />
    </Suspense>
  );
}
