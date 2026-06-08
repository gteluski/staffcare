import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function LgpdTratamentoDados() {
  return (
    <LegalPageLayout
      title="LGPD e Tratamento de Dados"
      subtitle="Diretrizes operacionais para conformidade com a Lei Geral de Proteção de Dados Pessoais."
      version="V2 adaptada"
    >
      <h2>1. Princípios de tratamento</h2>
      <ul>
        <li>Finalidade, adequação e necessidade.</li>
        <li>Livre acesso, qualidade dos dados e transparência.</li>
        <li>Segurança, prevenção e não discriminação.</li>
        <li>Responsabilização e prestação de contas.</li>
      </ul>

      <h2>2. Papéis no ecossistema</h2>
      <ul>
        <li>A classificação entre controladora e operadora poderá variar conforme o fluxo específico, o módulo utilizado e a relação jurídica aplicável.</li>
        <li>Em todos os casos, a administração da plataforma compromete-se a tratar dados pessoais de forma compatível com instruções legítimas, obrigações legais e boas práticas de governança.</li>
        <li>Sempre que necessário, as partes poderão firmar documento complementar específico sobre proteção de dados.</li>
      </ul>

      <h2>3. Fluxos críticos de dados</h2>
      <ul>
        <li>Autenticação e gestão de usuários.</li>
        <li>Agenda, planejamento, pregações, biblioteca, relatórios e finanças inseridos pelo usuário.</li>
        <li>Uploads de documentos, mídias e informações administrativas.</li>
        <li>Contatos, solicitações de suporte e comunicações operacionais.</li>
      </ul>

      <h2>4. Medidas mínimas</h2>
      <ul>
        <li>Controle de acesso por perfil e necessidade de conhecimento.</li>
        <li>Gestão de senhas, autenticação e trilhas mínimas de auditoria.</li>
        <li>Registro de eventos relevantes de segurança e operação.</li>
        <li>Revisão periódica de permissões e exposição de dados sensíveis.</li>
        <li>Boas práticas de minimização e segregação de dados.</li>
      </ul>

      <h2>5. Atendimento aos direitos dos titulares</h2>
      <ul>
        <li>Recebimento do pedido em canal formal.</li>
        <li>Validação mínima de identidade e legitimidade.</li>
        <li>Análise jurídica e operacional do pedido.</li>
        <li>Resposta no prazo legal aplicável, com registro interno.</li>
      </ul>

      <h2>6. Incidentes e comunicação</h2>
      <p>
        Havendo incidente de segurança com potencial risco ou dano relevante, deverão ser observados os fluxos internos de resposta, contenção, registro, avaliação de impacto e comunicação, conforme legislação e plano interno aplicável.
      </p>

      <h2>7. Disposições finais</h2>
      <p>
        Este documento complementa a <a href="/privacidade">Política de Privacidade</a> e possui natureza organizacional e contratual de suporte, devendo ser interpretado em conjunto com as políticas institucionais, contratos vigentes e documentos públicos aplicáveis.
      </p>

      <h2>8. Canal de contato</h2>
      <p>
        Solicitações relacionadas a titulares poderão ser iniciadas pelo canal <strong>contato@voxion.com.br</strong>.
      </p>
    </LegalPageLayout>
  );
}
