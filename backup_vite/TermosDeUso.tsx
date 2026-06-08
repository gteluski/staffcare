import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function TermosDeUso() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      subtitle="Regras gerais de acesso, conduta, uso da conta e funcionamento do ambiente."
      version="V2 adaptada"
    >
      <h2>1. Aceite</h2>
      <p>
        Ao acessar ou utilizar a plataforma, páginas públicas, áreas autenticadas ou funcionalidades correlatas, o usuário declara ter lido e aceito estes Termos de Uso, bem como as políticas públicas aplicáveis.
      </p>

      <h2>2. Escopo dos serviços</h2>
      <p>
        A plataforma oferece ambiente digital para organização pastoral, agenda, tarefas, planejamento, pregações, editor, biblioteca, relatórios, finanças, Bíblia, área metodista e assistente pastoral, de acordo com o contexto de uso e o perfil do usuário.
      </p>

      <h2>3. Regras de conduta</h2>
      <ul>
        <li>Utilizar o ambiente apenas para finalidades legítimas.</li>
        <li>Não tentar acessar áreas não autorizadas, extrair dados indevidamente, contornar controles ou comprometer a segurança do sistema.</li>
        <li>Não inserir conteúdo ilícito, ofensivo, fraudulento ou que viole direitos de terceiros.</li>
        <li>Respeitar os fluxos, limites e permissões definidos para cada perfil.</li>
      </ul>

      <h2>4. Cadastro e conta</h2>
      <p>
        Quando houver conta autenticada, o usuário deverá manter seus dados corretos, zelar por suas credenciais e comunicar prontamente qualquer uso indevido, suspeita de invasão ou perda de acesso.
      </p>

      <h2>5. Propriedade intelectual</h2>
      <p>
        Marcas, layout, arquitetura, software, componentes, textos institucionais, organização visual e demais elementos da plataforma estão protegidos pela legislação aplicável, sendo vedada reprodução não autorizada.
      </p>

      <h2>6. Limitações</h2>
      <p>
        A disponibilidade da plataforma poderá depender de internet, serviços terceiros, manutenção, atualizações, contingências técnicas e fatores alheios ao controle direto dos responsáveis.
      </p>

      <h2>7. Privacidade e cookies</h2>
      <p>
        O uso do ambiente também está sujeito à <a href="/privacidade">Política de Privacidade</a> e à <a href="/cookies">Política de Cookies</a>, que integram estes Termos para todos os fins.
      </p>

      <h2>8. Foro e contato</h2>
      <p>
        Questões relacionadas a estes Termos poderão ser encaminhadas pelos canais oficiais indicados na página de contato e suporte. Fica eleito o foro de Santo Antônio da Platina/PR, quando aplicável.
      </p>
    </LegalPageLayout>
  );
}
