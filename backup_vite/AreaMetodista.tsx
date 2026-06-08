import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Church, CalendarDays, FileText, BookOpen, Heart, Users, Landmark, Cross,
  Info, BookMarked, Scale, Sparkles, Download, ExternalLink, FileWarning,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ────────────────────────── Calendário Litúrgico ────────────────────────── */

interface LiturgicalSeason {
  name: string;
  color: string;
  colorLabel: string;
  description: string;
  period: string;
}

const LITURGICAL_SEASONS: LiturgicalSeason[] = [
  { name: "Advento", color: "bg-violet-600", colorLabel: "Roxo/Violeta", description: "4 domingos antes do Natal. Início do ano litúrgico. Preparação e esperança pela vinda do Senhor.", period: "Novembro/Dezembro" },
  { name: "Natal", color: "bg-yellow-400", colorLabel: "Branco/Dourado", description: "Celebração do nascimento de Jesus Cristo. Inclui a Véspera, Meia-noite, Alvorada e Dia de Natal (25/12).", period: "25 de dezembro" },
  { name: "Epifania", color: "bg-yellow-400", colorLabel: "Branco/Dourado", description: "Manifestação de Cristo às nações (6 de janeiro). Inclui o Batismo do Senhor (1º domingo após Epifania).", period: "6 de janeiro" },
  { name: "Tempo Comum (1ª parte)", color: "bg-green-600", colorLabel: "Verde", description: "Domingos após Epifania até Quarta-feira de Cinzas. Tema: Anúncio do Reino de Deus.", period: "Janeiro–Fevereiro" },
  { name: "Quaresma", color: "bg-violet-600", colorLabel: "Roxo/Violeta", description: "Quarta-feira de Cinzas + 5 domingos. Penitência, reflexão e preparação para a Páscoa.", period: "Fevereiro–Abril" },
  { name: "Semana Santa", color: "bg-violet-600", colorLabel: "Roxo → Preto → Branco", description: "Domingo de Ramos, Quinta-feira (Ceia e Lava-Pés), Sexta-feira da Paixão, Sábado de Aleluia.", period: "Semana antes da Páscoa" },
  { name: "Páscoa", color: "bg-yellow-400", colorLabel: "Branco/Dourado", description: "Domingo de Páscoa + 6 domingos. Celebração da ressurreição de Cristo. Inclui Ascensão.", period: "Abril–Junho" },
  { name: "Pentecostes", color: "bg-red-600", colorLabel: "Vermelho", description: "Descida do Espírito Santo sobre a Igreja. Marca o início da missão cristã no mundo.", period: "50 dias após a Páscoa" },
  { name: "Santíssima Trindade", color: "bg-yellow-400", colorLabel: "Branco", description: "Domingo após Pentecostes. Celebração do Deus Triúno: Pai, Filho e Espírito Santo.", period: "Domingo após Pentecostes" },
  { name: "Tempo Comum (2ª parte)", color: "bg-green-600", colorLabel: "Verde", description: "Domingos após Trindade até Cristo Rei. Tema: Vivência do Reino de Deus.", period: "Junho–Novembro" },
  { name: "Cristo Rei", color: "bg-yellow-400", colorLabel: "Branco", description: "Último domingo do ano litúrgico. Afirma a soberania de Cristo sobre toda a criação.", period: "Último domingo antes do Advento" },
];

const LECTIONARY_INFO = {
  pattern: "O lecionário segue um ciclo trienal: Ano A (Mateus), Ano B (Marcos), Ano C (Lucas).",
  readings: "Cada domingo prevê quatro leituras: 1ª Leitura (AT), Salmo, 2ª Leitura (Epístola) e Evangelho.",
  source: "Calendário Litúrgico 2025 (Ano C) — Colégio Episcopal da Igreja Metodista.",
};

/* ────────────────────────── Datas Metodistas ────────────────────────── */

const METHODIST_DATES = [
  { month: "Janeiro", events: ["Mudanças pastorais (nomeações episcopais entram em vigor)"] },
  { month: "Março", events: ["Dia da Confederação Metodista de Mulheres (11/03)", "Mês da Juventude Metodista"] },
  { month: "Junho", events: ["Mês do Discipulado"] },
  { month: "Variável", events: ["Dia Nacional de Missões (data definida anualmente)", "Assembleias e Concílios Regionais (conforme calendário de cada Região Eclesiástica)"] },
];

/* ────────────────────────── Artigos de Religião ────────────────────────── */

const ARTICLES_OF_FAITH = [
  "Fé na Santíssima Trindade",
  "O Verbo — verdadeiro Deus e verdadeiro homem",
  "Ressurreição corporal de Cristo",
  "O Espírito Santo como pessoa divina",
  "Suficiência das Escrituras para a salvação",
  "Antigo Testamento não contrário ao Novo",
  "Pecado original — tendência ao mal (não depravação total calvinista)",
  "Livre-arbítrio — o ser humano pode responder à graça",
  "Justificação pela fé, por meio da graça",
  "Boas obras como fruto da fé, não causa de salvação",
  "Obras de supererogação rejeitadas",
  "Possibilidade de pecado após a justificação",
  "Igreja como comunidade dos fiéis onde a Palavra é pregada e os sacramentos administrados",
  "Purgatório explicitamente rejeitado",
  "Falar em línguas requer interpretação na congregação",
  "Apenas dois sacramentos: Batismo e Santa Ceia",
  "Batismo: infantil afirmado; todas as formas válidas (imersão, aspersão, derramamento)",
  "Santa Ceia: mesa aberta; presença espiritual real",
  "Ambos os elementos (pão e vinho/suco) para todos",
  "Sacrifício de Cristo na cruz é único e suficiente",
  "Ministros podem se casar",
  "Ritos e cerimônias podem variar conforme a cultura",
  "Cristãos devem cumprir deveres civis",
  "Propriedade cristã é administrada em confiança",
  "Juramentos são permitidos quando exigidos por magistrado",
];

/* ────────────────────────── Distinctivos Wesleyanos ────────────────────────── */

const WESLEYAN_DISTINCTIVES = [
  { term: "Graça preveniente", desc: "A graça de Deus age antes da consciência humana, preparando o coração para a fé." },
  { term: "Graça justificadora", desc: "Perdão e novo relacionamento com Deus por meio da fé." },
  { term: "Graça santificadora", desc: "Transformação contínua em direção à santidade." },
  { term: "Perfeição cristã", desc: "Meta da santificação plena — amor perfeito, não ausência de pecado." },
  { term: "Santidade social", desc: "Santidade pessoal inseparável do engajamento social." },
  { term: "Meios de graça", desc: "Oração, Escritura, Santa Ceia, jejum, comunhão cristã." },
  { term: "Quadrilátero Wesleyano", desc: "Escritura (primária), Tradição, Razão, Experiência." },
  { term: "Regras Gerais de Wesley", desc: "Não fazer mal, fazer o bem, participar das ordenanças de Deus." },
  { term: "Missão integral", desc: "Evangelização + transformação social, não uma ou outra." },
];

/* ────────────────────────── Sacramentos ────────────────────────── */

const BAPTISM_POINTS = [
  "Sacramento, não ordenança — sinal e selo da graça preveniente de Deus.",
  "Batismo infantil afirmado — pais e igreja se comprometem a criar a criança na fé.",
  "Todas as três formas são igualmente válidas: imersão, aspersão e derramamento.",
  "Re-batismo rejeitado — o batismo é irrepetível na tradição metodista.",
  "Wesley praticou batismo infantil durante toda a sua vida.",
];

const SUPPER_POINTS = [
  "Mesa aberta — todos os cristãos batizados são bem-vindos.",
  "Ênfase na refeição comunitária, não na devoção privada.",
  "Conectada à justiça social e à solidariedade.",
  "Wesley recomendava comunhão frequente.",
  "Presença espiritual real — mistério, não definida mecanicamente (nem transubstanciação, nem mero memorial).",
];

/* ────────────────────────── Ética Pastoral ────────────────────────── */

const ETHICS_HIGHLIGHTS = [
  { article: "Art. 1g", text: "Pastores devem cumprir os Cânones e decisões conciliares." },
  { article: "Art. 7", text: "Educação contínua é um dever pastoral." },
  { article: "Art. 12", text: "Respeitar o trabalho do antecessor ao assumir uma igreja." },
  { article: "Art. 14", text: "Sigilo das conversas pastorais." },
  { article: "Art. 17", text: "Transparência e responsabilidade financeira." },
];

/* ────────────────────────── Documentos Oficiais ────────────────────────── */

interface OfficialDoc {
  title: string;
  authority: string;
  year: string;
  tier: string;
  scope: string;
  /** File name in the methodist-docs storage bucket */
  storagePath: string;
}

const OFFICIAL_DOCS: OfficialDoc[] = [
  { title: "Cânones 2023", authority: "Colégio Episcopal / 21º Concílio Geral", year: "2023", tier: "Constitucional", scope: "Constituição, 25 Artigos de Religião, Credo Social, estrutura organizacional, normas rituais, ordens ministeriais.", storagePath: "canones-2023.pdf" },
  { title: "Planejamento Pastoral 2026", authority: "6ª Região Eclesiástica / Concílio Regional", year: "2026", tier: "Operacional", scope: "Planejamento estratégico regional, ênfases missionárias, temas anuais, ações e calendário de atividades.", storagePath: "planejamento-pastoral-2026.pdf" },
];

/* ────────────────────────── Marcos Históricos ────────────────────────── */

const HISTORY_MILESTONES = [
  { year: "1867", text: "J.E. Newman inicia trabalho metodista permanente no Brasil." },
  { year: "1876–1886", text: "Missão de J.J. Ransom." },
  { year: "1880", text: "Justus Nelson leva o metodismo à Amazônia." },
  { year: "1881", text: "Martha Watts funda o Colégio Piracicabano (atual Unimep)." },
  { year: "1886", text: "Primeira Conferência Anual." },
  { year: "1930", text: "Proclamação de Autonomia da Igreja Metodista no Brasil." },
];

/* ────────────────────────── Component ────────────────────────── */

type Tab = "liturgico" | "documentos" | "sacramentos" | "identidade" | "etica" | "historia";

export default function AreaMetodista() {
  const [tab, setTab] = useState<Tab>("liturgico");
  const [fileStatus, setFileStatus] = useState<Record<string, "available" | "unavailable" | "checking">>({});

  useEffect(() => {
    const initial: Record<string, "checking"> = {};
    OFFICIAL_DOCS.forEach((d) => { initial[d.storagePath] = "checking"; });
    setFileStatus(initial);

    OFFICIAL_DOCS.forEach(async (doc) => {
      try {
        const { data } = supabase.storage.from("methodist-docs").getPublicUrl(doc.storagePath);
        const res = await fetch(data.publicUrl, { method: "HEAD" });
        setFileStatus((prev) => ({ ...prev, [doc.storagePath]: res.ok ? "available" : "unavailable" }));
      } catch {
        setFileStatus((prev) => ({ ...prev, [doc.storagePath]: "unavailable" }));
      }
    });
  }, []);

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Church className="h-6 w-6 text-primary" /> Área Metodista
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Conteúdo institucional, litúrgico e doutrinário da Igreja Metodista no Brasil, organizado a partir dos documentos oficiais do Colégio Episcopal.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="liturgico" className="text-xs gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Litúrgico</TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs gap-1.5"><FileText className="h-3.5 w-3.5" /> Documentos</TabsTrigger>
          <TabsTrigger value="sacramentos" className="text-xs gap-1.5"><Cross className="h-3.5 w-3.5" /> Sacramentos</TabsTrigger>
          <TabsTrigger value="identidade" className="text-xs gap-1.5"><Heart className="h-3.5 w-3.5" /> Identidade</TabsTrigger>
          <TabsTrigger value="etica" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> Ética Pastoral</TabsTrigger>
          <TabsTrigger value="historia" className="text-xs gap-1.5"><Landmark className="h-3.5 w-3.5" /> História</TabsTrigger>
        </TabsList>

        {/* ──── Litúrgico ──── */}
        <TabsContent value="liturgico" className="space-y-4">
          <SourceBadge source="Calendário Litúrgico 2025 (Ano C) — Colégio Episcopal" />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tempos Litúrgicos</CardTitle>
              <CardDescription>Ciclo anual do ano cristão conforme a tradição metodista.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {LITURGICAL_SEASONS.map((s) => (
                <div key={s.name} className="flex items-start gap-3 py-3 border-b last:border-0">
                  <div className={`${s.color} h-4 w-4 rounded-full shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{s.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{s.colorLabel}</Badge>
                      <span className="text-[11px] text-muted-foreground">{s.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lecionário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs text-muted-foreground">
              <p>{LECTIONARY_INFO.pattern}</p>
              <p>{LECTIONARY_INFO.readings}</p>
              <p className="text-[11px] italic">{LECTIONARY_INFO.source}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Datas Institucionais Metodistas</CardTitle>
              <CardDescription>Datas denominacionais relevantes ao calendário anual.</CardDescription>
            </CardHeader>
            <CardContent>
              {METHODIST_DATES.map((m) => (
                <div key={m.month} className="py-2 border-b last:border-0">
                  <span className="text-xs font-semibold text-foreground">{m.month}</span>
                  <ul className="mt-1 space-y-0.5">
                    {m.events.map((e, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-primary/50">{e}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground/60 mt-3 italic">
                Fonte: Calendário 2026 — 6ª Região Eclesiástica. Datas regionais podem variar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <SourceBadge source="Documentos oficiais do Colégio Episcopal — inventário de fontes aprovadas" />

          <div className="space-y-3">
            {OFFICIAL_DOCS.map((doc) => (
              <DocCard key={doc.title} doc={doc} fileStatus={fileStatus[doc.storagePath]} />
            ))}
          </div>

          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <Info className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Apenas documentos oficiais aprovados para consulta pública são disponibilizados nesta seção.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── Sacramentos ──── */}
        <TabsContent value="sacramentos" className="space-y-4">
          <SourceBadge source="Carta Pastoral sobre os Sacramentos (2001) — Colégio Episcopal" />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-primary" /> Batismo
              </CardTitle>
              <CardDescription>Posição oficial da Igreja Metodista</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {BAPTISM_POINTS.map((p, i) => (
                  <li key={i} className="text-xs text-muted-foreground pl-3 relative leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary/50">{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cross className="h-4 w-4 text-primary" /> Santa Ceia
              </CardTitle>
              <CardDescription>Posição oficial da Igreja Metodista</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {SUPPER_POINTS.map((p, i) => (
                  <li key={i} className="text-xs text-muted-foreground pl-3 relative leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary/50">{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground/60 text-center italic">
            Fonte: Carta Pastoral sobre os Sacramentos (2001, Bispo Paulo Tarso). Consolida as cartas sobre Batismo e Ceia do Senhor (1996).
          </p>
        </TabsContent>

        {/* ──── Identidade ──── */}
        <TabsContent value="identidade" className="space-y-4">
          <SourceBadge source="Cânones 2023, Cap. V — Plano para a Vida e a Missão" />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">25 Artigos de Religião</CardTitle>
              <CardDescription>Confissão doutrinária metodista (Cânones 2023)</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="articles">
                  <AccordionTrigger className="text-xs">Ver todos os 25 artigos</AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-1.5 list-decimal list-inside">
                      {ARTICLES_OF_FAITH.map((a, i) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed">{a}</li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Distintivos Wesleyanos
              </CardTitle>
              <CardDescription>Características teológicas que definem a tradição metodista</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {WESLEYAN_DISTINCTIVES.map((d) => (
                <div key={d.term} className="py-2.5 border-b last:border-0">
                  <span className="text-xs font-semibold text-foreground">{d.term}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground/60 text-center italic">
            Fonte: Cânones 2023 (Artigos de Religião e Cap. V); As Marcas Básicas da Identidade Metodista (Colégio Episcopal, 3ª ed., 2005).
          </p>
        </TabsContent>

        {/* ──── Ética Pastoral ──── */}
        <TabsContent value="etica" className="space-y-4">
          <SourceBadge source="Código de Ética Pastoral — Colégio Episcopal" />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Destaques do Código de Ética Pastoral</CardTitle>
              <CardDescription>Princípios orientadores para a prática ministerial metodista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ETHICS_HIGHLIGHTS.map((e) => (
                  <div key={e.article} className="flex items-start gap-3">
                    <Badge variant="outline" className="text-[10px] py-0 shrink-0 mt-0.5">{e.article}</Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">{e.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> Disciplina Eclesiástica
              </CardTitle>
              <CardDescription>Princípios do Manual de Disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Disciplina é expressão de amor, não punição (Hb 12:10b).",
                  "Objetivo: restauração, não expulsão.",
                  "Fundamentada nas Regras Gerais de Wesley.",
                  "Processo em três fases: conciliação → audiência → decisão.",
                  "Segue o modelo de Jesus em Mateus 18:15-17.",
                ].map((p, i) => (
                  <li key={i} className="text-xs text-muted-foreground pl-3 relative leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary/50">{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── História ──── */}
        <TabsContent value="historia" className="space-y-4">
          <SourceBadge source="História do Metodismo no Brasil — fontes históricas aprovadas" />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Marcos Históricos do Metodismo no Brasil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {HISTORY_MILESTONES.map((m) => (
                  <div key={m.year} className="flex gap-4 py-3 border-b last:border-0">
                    <span className="text-sm font-bold text-primary shrink-0 w-14 text-right">{m.year}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <Info className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Conteúdo histórico adicional será expandido conforme fontes oficiais forem estruturadas para a plataforma.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground text-center pt-2 max-w-lg mx-auto">
        Todo o conteúdo desta seção segue exclusivamente as fontes oficiais da Igreja Metodista no Brasil e a tradição teológica arminiana-wesleyana.
      </p>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 bg-muted/50 rounded-md px-3 py-1.5">
      <BookOpen className="h-3 w-3 shrink-0" />
      <span className="italic">Fonte: {source}</span>
    </div>
  );
}

function DocCard({ doc, fileStatus }: { doc: OfficialDoc; fileStatus?: "available" | "unavailable" | "checking" }) {
  const handleDownload = () => {
    const { data } = supabase.storage.from("methodist-docs").getPublicUrl(doc.storagePath);
    window.open(data.publicUrl, "_blank");
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{doc.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{doc.authority} ({doc.year})</p>
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">{doc.tier}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{doc.scope}</p>

        <div className="mt-3 flex items-center gap-2">
          {fileStatus === "checking" ? (
            <span className="text-[11px] text-muted-foreground/60">Verificando disponibilidade…</span>
          ) : fileStatus === "available" ? (
            <>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleDownload}>
                <ExternalLink className="h-3 w-3" /> Abrir PDF
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleDownload}>
                <Download className="h-3 w-3" /> Baixar
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <FileWarning className="h-3.5 w-3.5" />
              <span>Arquivo ainda não disponível para download. O documento será adicionado em breve.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
