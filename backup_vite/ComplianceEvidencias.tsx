import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function ComplianceEvidencias() {
  return (
    <LegalPageLayout
      title="Compliance e Evidências Institucionais"
      subtitle="Organização institucional das evidências públicas e internas relacionadas a compliance, segurança, documentos, controles e readiness."
      version="V2 adaptada"
    >
      <h2>1. Finalidade do documento</h2>
      <p>
        Este documento organiza, de forma institucional, as evidências públicas e internas relacionadas a compliance, segurança, proteção de dados, controles operacionais e readiness da plataforma Staff care, sem criar alegações que não possam ser comprovadas.
      </p>

      <h2>2. Premissa de veracidade</h2>
      <p>
        Somente podem ser apresentados publicamente fatos, documentos, controles implementados e evidências efetivamente existentes. <strong>Não se declaram certificações, auditorias, homologações ou selos formais inexistentes.</strong>
      </p>

      <h2>3. Controles e evidências documentais</h2>
      <ul>
        <li>Ambiente com autenticação individual e controle de acesso por perfil.</li>
        <li>Segregação entre dados do usuário, conteúdos públicos e base doutrinária do assistente pastoral.</li>
        <li>Políticas públicas e documentos institucionais disponíveis para transparência e governança.</li>
        <li>Governança documental com controle de versão e revisão periódica.</li>
        <li>Estrutura de segurança, hardening e compliance em evolução contínua.</li>
      </ul>

      <h2>4. Certificações formais</h2>
      <p>
        Até ulterior comprovação documental anexada, este documento não declara certificação formal específica da plataforma. Caso exista certificação futura, ela deverá ser incluída com organismo emissor, escopo, número do certificado, vigência e evidência verificável.
      </p>

      <h2>5. Auditorias e avaliações</h2>
      <p>
        Avaliações internas, revisões de permissões, hardening, pentests, pareceres ou auditorias externas somente devem ser divulgados com registro real, data, escopo e status claramente informados.
      </p>

      <h2>6. Estrutura recomendada de exibição pública</h2>
      <ul>
        <li>Documentos públicos vigentes.</li>
        <li>Controles e práticas efetivamente implementados.</li>
        <li>Itens em readiness ou dependência externa/manual.</li>
        <li>Canais de contato e suporte.</li>
        <li>Última atualização documental.</li>
      </ul>

      <h2>7. Atualização</h2>
      <p>
        Este documento deverá ser revisto sempre que houver nova evidência documental, auditoria efetiva, certificação válida ou mudança material de governança.
      </p>
    </LegalPageLayout>
  );
}
