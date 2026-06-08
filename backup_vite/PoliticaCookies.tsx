import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PoliticaCookies() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      subtitle="Diretrizes sobre o uso de cookies e tecnologias semelhantes nas páginas públicas e áreas autenticadas da plataforma."
      version="V2 adaptada"
    >
      <h2>1. Objetivo</h2>
      <p>
        Esta Política de Cookies descreve, em linguagem institucional, como cookies e tecnologias semelhantes podem ser utilizados nas páginas públicas, áreas autenticadas e recursos operacionais vinculados à plataforma.
      </p>

      <h2>2. Categorias de cookies</h2>
      <ul>
        <li><strong>Estritamente necessários:</strong> essenciais para funcionamento básico, autenticação, segurança e navegação.</li>
        <li><strong>Funcionais:</strong> utilizados para lembrar preferências, contexto e ajustes de experiência.</li>
        <li><strong>Analíticos:</strong> voltados à medição agregada de uso, desempenho e comportamento de navegação.</li>
        <li><strong>De terceiros:</strong> vinculados a integrações, serviços embarcados, medição ou comunicação, quando efetivamente adotados.</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Manter sessão e proteger o acesso.</li>
        <li>Melhorar desempenho, estabilidade e usabilidade.</li>
        <li>Gerar métricas de navegação e operação, quando efetivamente implementadas.</li>
        <li>Apoiar recursos de atendimento, mensageria e integração, quando aplicável.</li>
      </ul>

      <h2>4. Gestão de preferências</h2>
      <p>
        O usuário poderá gerenciar cookies por meio de banner, central de preferências, configurações do navegador ou outros mecanismos disponibilizados, ressalvados os cookies estritamente necessários ao funcionamento do ambiente.
      </p>

      <h2>5. Observação importante</h2>
      <p>
        Esta política não declara uso de tecnologia específica que não esteja efetivamente implementada. Integrações, pixels, tags ou cookies de terceiros somente devem ser mencionados após confirmação operacional.
      </p>

      <h2>6. Atualizações</h2>
      <p>
        A presente política poderá ser atualizada sempre que houver mudança relevante de tecnologia, integrações ou requisitos legais.
      </p>
    </LegalPageLayout>
  );
}
