import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PoliticaPrivacidade() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      subtitle="Regras de transparência sobre coleta, uso, compartilhamento e retenção de dados."
      version="V2 adaptada"
    >
      <h2>1. Identificação e escopo</h2>
      <p>
        Esta Política de Privacidade estabelece as diretrizes de transparência aplicáveis ao tratamento de dados pessoais realizado no contexto da plataforma Staff care, de suas páginas públicas, áreas autenticadas, canais de suporte, fluxos administrativos e comunicações relacionadas ao serviço.
      </p>

      <h2>2. Agentes envolvidos</h2>
      <ul>
        <li>Responsável pela disponibilização, manutenção e suporte técnico da plataforma: Guilherme José Teluski.</li>
        <li>A depender do fluxo específico, o tratamento poderá envolver a própria administração da plataforma, usuários autenticados e prestadores de infraestrutura estritamente necessários à operação.</li>
        <li>Quando cabível, a qualificação entre controladora e operadora deverá observar o contexto do fluxo, o contrato aplicável e a legislação vigente.</li>
      </ul>

      <h2>3. Dados tratados</h2>
      <ul>
        <li><strong>Dados cadastrais de usuários:</strong> nome, e-mail, telefone, perfil de acesso, igreja, distrito, região e identificadores internos.</li>
        <li><strong>Dados de autenticação e sessão:</strong> credenciais, tokens, registros de acesso, mudanças de senha, permissões e logs operacionais.</li>
        <li><strong>Dados operacionais:</strong> agenda, tarefas, pregações, documentos, biblioteca, finanças, relatórios e registros inseridos pelo próprio usuário.</li>
        <li><strong>Dados de atendimento e suporte:</strong> contatos enviados por formulários, solicitações operacionais e comunicações administrativas.</li>
      </ul>

      <h2>4. Finalidades do tratamento</h2>
      <ul>
        <li>Disponibilizar a plataforma e autenticar usuários.</li>
        <li>Gerenciar permissões, módulos, documentos, agenda, relatórios e demais recursos contratados.</li>
        <li>Atender obrigações legais, regulatórias, contratuais e de segurança da informação.</li>
        <li>Prevenir fraude, abuso, acesso indevido, incidentes e uso irregular da plataforma.</li>
        <li>Atender solicitações relacionadas a privacidade, proteção de dados e suporte técnico.</li>
      </ul>

      <h2>5. Bases legais</h2>
      <p>
        Os tratamentos de dados pessoais poderão se apoiar, conforme o caso concreto, em execução de contrato e procedimentos preliminares, cumprimento de obrigação legal ou regulatória, exercício regular de direitos, legítimo interesse devidamente avaliado, consentimento quando exigido e demais hipóteses autorizadas pela Lei nº 13.709/2018.
      </p>

      <h2>6. Compartilhamento de dados</h2>
      <p>
        Os dados poderão ser compartilhados, na medida do necessário, com fornecedores de infraestrutura, hospedagem, autenticação, armazenamento, mensageria, analytics, suporte técnico e autoridades competentes, sempre sob controles adequados e observância da finalidade.
      </p>

      <h2>7. Retenção e descarte</h2>
      <p>
        Os dados serão mantidos pelo prazo necessário ao atendimento das finalidades informadas, ao cumprimento de exigências legais, regulatórias e contratuais, à preservação de evidências e à tutela de direitos, sendo posteriormente eliminados, anonimizados ou mantidos bloqueados quando cabível.
      </p>

      <h2>8. Direitos do titular</h2>
      <p>
        Os titulares poderão solicitar, nos termos da legislação aplicável e observadas as limitações legais, confirmação da existência de tratamento, acesso, correção, atualização, anonimização, bloqueio, eliminação, portabilidade quando cabível, informações sobre compartilhamento e revogação de consentimento, quando essa base legal for utilizada.
      </p>

      <h2>9. Segurança e boas práticas</h2>
      <p>
        São adotadas medidas técnicas, administrativas e organizacionais compatíveis com a natureza da operação, incluindo autenticação, segregação por perfil, controle de acesso, revisão de permissões, monitoramento, políticas internas e rotinas proporcionais de segurança da informação.
      </p>

      <h2>10. Canal de privacidade</h2>
      <p>
        O canal inicial para solicitações relacionadas à privacidade, proteção de dados e exercício de direitos é: <strong>contato@voxion.com.br</strong>.
      </p>

      <h2>11. Atualizações</h2>
      <p>
        Esta política poderá ser atualizada para refletir evolução normativa, contratual, operacional ou tecnológica, preservando-se o registro de versão e a data de vigência aplicável.
      </p>
    </LegalPageLayout>
  );
}
