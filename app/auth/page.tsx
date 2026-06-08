import { Suspense } from "react";
import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Autenticação - Staffcare",
  description: "Faça login ou crie sua conta no Staffcare.",
};

export default function AuthenticationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Carregando...</div>}>
      <AuthPage initialMode="login" />
    </Suspense>
  );
}
