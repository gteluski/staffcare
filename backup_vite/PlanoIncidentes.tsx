import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PlanoIncidentes() {
  return (
    <LegalPageLayout
      title="Plano de Resposta a Incidentes"
      subtitle="Diretrizes institucionais para registro, triagem, contenção e comunicação de incidentes relacionados à plataforma."
      version="V2 adaptada"
    >
      <h2>1. Objetivo</h2>
      <p>
        Este documento consolida as diretrizes institucionais de resposta a incidentes relacionados à plataforma, aos ambientes autenticados, ao armazenamento de documentos, aos fluxos do assistente pastoral e às demandas administrativas ou técnicas.
      </p>

      <h2>2. Canais principais</h2>
      <ul>
        <li><strong>Canal institucional principal:</strong> contato@voxion.com.br</li>
        <li><strong>Canal de suporte técnico:</strong> contato@voxion.com.br</li>
        <li><strong>Canal para privacidade e dados pessoais:</strong> contato@voxion.com.br</li>
        <li><strong>Canal para demandas comerciais e operacionais:</strong> contato@voxion.com.br</li>
      </ul>

      <h2>3. Horário e SLA referencial</h2>
      <ul>
        <li><strong>Horário de atendimento:</strong> Segunda a Sexta — 9h às 18h.</li>
        <li><strong>Prazo inicial de triagem:</strong> até 1 dia útil, salvo fluxo prioritário.</li>
        <li>Incidentes críticos poderão seguir resposta prioritária conforme gravidade, impacto e disponibilidade operacional.</li>
      </ul>

      <h2>4. Informações recomendadas para abertura de chamado</h2>
      <ul>
        <li>Nome do solicitante.</li>
        <li>Canal de retorno.</li>
        <li>Descrição objetiva da ocorrência.</li>
        <li>Data, hora, URL, usuário afetado, prints ou evidências, quando houver.</li>
        <li>Indicação se envolve acesso, documento, agenda, finanças, biblioteca, assistente pastoral ou outros módulos.</li>
      </ul>

      <h2>5. Fluxo mínimo de resposta</h2>
      <ul>
        <li>Registro inicial e triagem.</li>
        <li>Classificação preliminar do incidente.</li>
        <li>Medidas de contenção proporcionais.</li>
        <li>Avaliação de impacto técnico e de dados pessoais, quando aplicável.</li>
        <li>Correção, comunicação e registro de lições aprendidas.</li>
      </ul>

      <h2>6. Observações</h2>
      <p>
        Este documento complementa a <a href="/seguranca">política de segurança</a>, a <a href="/privacidade">política de privacidade</a>, a <a href="/lgpd">política LGPD</a> e demais documentos institucionais aplicáveis. Não substitui contrato, parecer jurídico ou obrigação legal específica.
      </p>
    </LegalPageLayout>
  );
}
