import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Lock, UserCheck, Eye, FolderLock, ShieldCheck, ServerCog, KeyRound, RefreshCw, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_ITEMS = [
  { icon: Lock, title: "Conexão protegida por HTTPS", desc: "Toda comunicação entre o seu dispositivo e a plataforma é criptografada em trânsito." },
  { icon: UserCheck, title: "Acesso individual autenticado", desc: "Cada pastor acessa a plataforma com sua própria conta, protegida por e-mail e senha pessoal." },
  { icon: KeyRound, title: "Permissões por perfil de acesso", desc: "Diferentes níveis de acesso garantem que cada pessoa veja apenas o que lhe é pertinente." },
  { icon: Eye, title: "Ambiente privado", desc: "Informações pastorais não ficam expostas publicamente sem necessidade." },
  { icon: FolderLock, title: "Arquivos protegidos", desc: "Documentos acessíveis apenas pelo proprietário, em ambiente de armazenamento controlado." },
  { icon: ShieldCheck, title: "Fluxos sensíveis protegidos", desc: "Ações como troca de senha e gerenciamento de assinatura passam por verificações adicionais." },
  { icon: ServerCog, title: "Privacidade respeitada", desc: "Dados usados exclusivamente para o funcionamento da plataforma." },
];

export default function SegurancaPrivacidade() {
  return (
    <LegalPageLayout
      title="Segurança e Privacidade"
      subtitle="Uma plataforma pensada para proteger seus dados, respeitar sua rotina pastoral e oferecer um ambiente confiável para o uso diário."
      version="V2 adaptada"
    >
      {/* Trust highlights grid */}
      <div className="not-prose grid gap-3 sm:grid-cols-2 mb-12">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
              <item.icon className="h-[18px] w-[18px] text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>1. Conexão protegida</h2>
      <p>
        Toda a comunicação entre o dispositivo do usuário e a plataforma é realizada por meio de conexão criptografada (HTTPS/TLS), garantindo que os dados trafeguem de forma protegida contra interceptação.
      </p>

      <h2>2. Acesso autenticado e controle por perfil</h2>
      <ul>
        <li>Cada usuário possui credencial individual e intransferível.</li>
        <li>Credenciais temporárias para primeiro acesso exigem troca obrigatória de senha.</li>
        <li>Senhas definitivas observam padrão mínimo de segurança definido pela plataforma.</li>
        <li>Perfis administrativos concentram configuração estrutural e controles sensíveis.</li>
        <li>Perfis de usuário acessam apenas seus próprios dados, documentos e recursos permitidos.</li>
        <li>Permissões respeitam o princípio do menor privilégio.</li>
        <li>É vedado compartilhar senha, sessão autenticada ou código de acesso.</li>
      </ul>

      <h2>3. Privacidade dos dados do usuário</h2>
      <ul>
        <li>Cada usuário acessa apenas seus próprios dados. Não há visibilidade cruzada entre contas.</li>
        <li>Documentos e informações pastorais são privados por conta.</li>
        <li>Conteúdos internos da plataforma não ficam expostos publicamente sem necessidade.</li>
        <li>Dados sensíveis recebem tratamento restrito conforme a arquitetura da plataforma.</li>
        <li>A plataforma não compartilha informações de uso com terceiros. Dados são utilizados exclusivamente para o funcionamento dos módulos.</li>
      </ul>

      <h2>4. Gestão de arquivos e documentos</h2>
      <ul>
        <li>Cada arquivo enviado à biblioteca é associado exclusivamente ao usuário que o enviou.</li>
        <li>Documentos pastorais, administrativos, contratuais e financeiros são acessíveis apenas por perfis ou usuários especificamente autorizados.</li>
        <li>A segregação entre dados do usuário, conteúdos públicos e base doutrinária do assistente pastoral é mantida de forma estrita.</li>
      </ul>

      <h2>5. Fluxos sensíveis protegidos</h2>
      <ul>
        <li>Operações como alteração de dados administrativos, gerenciamento de assinatura e exclusão de conteúdo passam por camadas adicionais de verificação.</li>
        <li>Campos administrativos e de sistema não podem ser alterados por usuários comuns.</li>
        <li>A redefinição de acesso observa fluxo formal ou administrativo autorizado.</li>
      </ul>

      <h2>6. Segurança em evolução contínua</h2>
      <p>
        A estrutura de segurança, hardening e compliance da plataforma está em evolução contínua. São adotadas medidas técnicas, administrativas e organizacionais compatíveis com a natureza da operação, incluindo:
      </p>
      <ul>
        <li>Autenticação e segregação por perfil.</li>
        <li>Controle de acesso e revisão periódica de permissões.</li>
        <li>Registro de eventos relevantes de segurança e operação.</li>
        <li>Boas práticas de minimização e segregação de dados.</li>
        <li>Governança documental com controle de versão e revisão periódica.</li>
      </ul>

      <h2>7. Incidentes, contato e resposta</h2>
      <p>
        Todo evento suspeito, falha operacional relevante, perda de acesso, vazamento ou comportamento anômalo deverá ser reportado pelo canal definido. O fluxo mínimo de resposta inclui:
      </p>
      <ul>
        <li>Registro inicial e triagem (até 1 dia útil).</li>
        <li>Classificação preliminar do incidente.</li>
        <li>Medidas de contenção proporcionais.</li>
        <li>Avaliação de impacto técnico e de dados pessoais, quando aplicável.</li>
        <li>Correção, comunicação e registro de lições aprendidas.</li>
      </ul>
      <p>
        <strong>Canal de contato:</strong> contato@voxion.com.br<br />
        <strong>Horário de atendimento:</strong> Segunda a Sexta — 9h às 18h.
      </p>

      <h2>8. Transparência e limites de certificação</h2>
      <div className="not-prose flex items-start gap-4 rounded-xl bg-muted/40 border border-border p-5 mb-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mt-0.5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            A plataforma <strong className="text-foreground">não possui certificação externa de segurança</strong> neste momento.
            As práticas descritas nesta página refletem o que está efetivamente implementado na arquitetura atual.
          </p>
          <p>
            Somente podem ser apresentados publicamente fatos, documentos, controles implementados e evidências efetivamente existentes.
            <strong className="text-foreground"> Não se declaram certificações, auditorias, homologações ou selos formais inexistentes.</strong>
          </p>
          <p>
            Segurança é tratada como um <strong className="text-foreground">compromisso contínuo</strong>, não como um estado final.
            Melhorias, revisões e fortalecimentos são realizados de forma recorrente.
          </p>
        </div>
      </div>

      <div className="not-prose mt-10 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Se você tem dúvidas sobre segurança ou privacidade, estamos à disposição.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <a href="mailto:contato@voxion.com.br">Falar sobre segurança</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/auth?mode=signup">Começar agora</a>
          </Button>
        </div>
      </div>
    </LegalPageLayout>
  );
}
