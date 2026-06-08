import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Cadastrar - Staffcare",
  description: "Crie sua conta no Staffcare e comece seu período de testes grátis de 7 dias.",
};

export default function RegisterPage() {
  return <AuthPage initialMode="signup" />;
}
