import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

import Landing from "./pages/Landing";
import Planos from "./pages/Planos";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AlterarSenha from "./pages/AlterarSenha";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Tarefas from "./pages/Tarefas";
import Pregacoes from "./pages/Pregacoes";
import Biblioteca from "./pages/Biblioteca";
import Editor from "./pages/Editor";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import Biblia from "./pages/Biblia";
import AreaMetodista from "./pages/AreaMetodista";
import Assistente from "./pages/Assistente";
import DiarioMinisterial from "./pages/DiarioMinisterial";
import PlannerMinisterial from "./pages/PlannerMinisterial";
import Perfil from "./pages/Perfil";
import Assinatura from "./pages/Assinatura";
import CheckoutReturn from "./pages/CheckoutReturn";
import NotFound from "./pages/NotFound";
import SegurancaPrivacidade from "./pages/SegurancaPrivacidade";
import TermosDeUso from "./pages/legal/TermosDeUso";
import PoliticaPrivacidade from "./pages/legal/PoliticaPrivacidade";
import PoliticaCookies from "./pages/legal/PoliticaCookies";
import LgpdTratamentoDados from "./pages/legal/LgpdTratamentoDados";
import ComplianceEvidencias from "./pages/legal/ComplianceEvidencias";
import PlanoIncidentes from "./pages/legal/PlanoIncidentes";
import CentroInstitucional from "./pages/legal/CentroInstitucional";
import WebhookMonitor from "./pages/admin/WebhookMonitor";
import RLSValidator from "./pages/admin/RLSValidator";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, mustChangePassword, profileSettings } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  if (mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (profileSettings && !profileSettings.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function RequireAuthPasswordChange({ children }: { children: React.ReactNode }) {
  const { session, loading, mustChangePassword } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  if (!mustChangePassword) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { session, loading, mustChangePassword, profileSettings } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  if (mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (profileSettings && profileSettings.onboarding_completed) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading, mustChangePassword } = useAuth();

  if (loading) return <LoadingScreen />;
  if (session && mustChangePassword) return <Navigate to="/alterar-senha" replace />;
  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/seguranca" element={<SegurancaPrivacidade />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/cookies" element={<PoliticaCookies />} />
            <Route path="/lgpd" element={<LgpdTratamentoDados />} />
            <Route path="/compliance" element={<ComplianceEvidencias />} />
            <Route path="/incidentes" element={<PlanoIncidentes />} />
            <Route path="/documentos" element={<CentroInstitucional />} />
            <Route path="/auth" element={<PublicOnly><Auth /></PublicOnly>} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/alterar-senha" element={<RequireAuthPasswordChange><AlterarSenha /></RequireAuthPasswordChange>} />
            <Route path="/onboarding" element={<RequireOnboarding><Onboarding /></RequireOnboarding>} />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/pregacoes" element={<Pregacoes />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/biblia" element={<Biblia />} />
              <Route path="/metodista" element={<AreaMetodista />} />
              <Route path="/assistente" element={<Assistente />} />
              <Route path="/diario" element={<DiarioMinisterial />} />
              <Route path="/planner" element={<PlannerMinisterial />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/assinatura" element={<Assinatura />} />
              <Route path="/checkout/return" element={<CheckoutReturn />} />
              <Route path="/admin/webhooks" element={<WebhookMonitor />} />
              <Route path="/admin/rls" element={<RLSValidator />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
