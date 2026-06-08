/* ── Plan features ── */
export interface PlanFeature {
  text: string;
  included: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { text: "7 dias gratuitos para experimentar", included: true },
  { text: "1 usuário por conta", included: true },
  { text: "5 GB de armazenamento em nuvem", included: true },
  { text: "Agenda com calendário litúrgico", included: true },
  { text: "Tarefas, Kanban e anotações", included: true },
  { text: "Pregações ilimitadas com modo pregação", included: true },
  { text: "Editor de textos pastorais", included: true },
  { text: "Biblioteca de documentos", included: true },
  { text: "Bíblia integrada", included: true },
  { text: "Relatórios pastorais completos", included: true },
  { text: "Controle financeiro", included: true },
  { text: "Diário e planner ministerial", included: true },
  { text: "Assistente pastoral com IA", included: true },
  { text: "Área de apoio pastoral", included: true },
  { text: "Pagamento via Pix", included: true },
];

/* ── FAQ ── */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  { q: "Para quem é essa plataforma?", a: "Para pastores, pastoras e lideranças ministeriais que desejam organizar sua rotina pastoral em um só ambiente — de forma prática e acessível." },
  { q: "Posso experimentar antes de pagar?", a: "Sim. Toda conta nova recebe 7 dias gratuitos com acesso completo a todos os módulos, sem precisar informar dados de pagamento." },
  { q: "Quanto custa após o período gratuito?", a: "A assinatura mensal é de R$ 79,90 por usuário. Sem taxas extras, sem surpresas." },
  { q: "Quais formas de pagamento são aceitas?", a: "Cartão de crédito com cobrança recorrente mensal, processada com segurança pela Stripe." },
  { q: "O que acontece quando os 7 dias gratuitos terminam?", a: "Você será orientado a assinar para continuar usando a plataforma. Seus dados são mantidos e ficam disponíveis assim que a assinatura for ativada." },
  { q: "Posso usar no celular?", a: "Sim. A plataforma funciona bem no celular, no tablet e no computador, e pode ser instalada como um aplicativo direto do navegador." },
  { q: "Meus dados ficam privados?", a: "Sim. Cada usuário possui seu próprio ambiente pessoal. Seus dados são tratados de forma privada e protegida." },
  { q: "A plataforma tem assistente pastoral?", a: "Sim. O assistente apoia em estudos, organização, planejamento e reflexão, com linguagem pastoral." },
  { q: "Preciso ter conhecimento técnico para usar?", a: "Não. A plataforma foi pensada para ser simples, intuitiva e acessível para o uso pastoral no dia a dia." },
];
