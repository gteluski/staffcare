import { Suspense } from "react";
import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Entrar - Staffcare",
  description: "Faça login no Staffcare para acessar suas tarefas, agenda e relatórios pastorais.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Carregando...</div>}>
      <AuthPage initialMode="login" />
    </Suspense>
  );
}
