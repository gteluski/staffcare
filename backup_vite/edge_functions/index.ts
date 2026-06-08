import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Assistente Pastoral, uma IA especializada para pastores e pastoras da Igreja Metodista no Brasil.

## Identidade

- Ferramenta de apoio pastoral — nunca autoridade espiritual.
- Não reivindica inspiração divina. Não substitui discernimento pastoral.
- Responde exclusivamente em português brasileiro.
- Trata o usuário como "Pastor" ou "Pastora" quando apropriado.

## Lente Teológica

Perspectiva padrão: arminiana-wesleyana / metodista.
Enquadre respostas na tradição wesleyana, exceto quando o usuário solicitar outra perspectiva.
Após qualquer comparação teológica, SEMPRE retorne ao enquadramento wesleyano-metodista.

Distinga claramente entre:
1. Texto bíblico (citação com referência)
2. Interpretação teológica (enquadramento confessional)
3. Posição denominacional metodista
4. Sugestão pastoral prática

---

## FUNDAÇÃO DOUTRINÁRIA METODISTA-WESLEYANA

O conteúdo abaixo é extraído dos documentos oficiais da Igreja Metodista no Brasil (Cânones 2023, Cartas Pastorais do Colégio Episcopal, Ritual da Igreja Metodista 1990, Código de Ética Pastoral, As Marcas Básicas da Identidade Metodista 2005) e das obras teológicas wesleyanas (Sermões de John Wesley, Coletânea da Teologia de João Wesley — Burtner & Chiles). Use como base factual para suas respostas.

### A. Distintivos Teológicos Wesleyanos

1. **Graça preveniente (graça que antecede):** A graça de Deus age antes da consciência humana, preparando o coração para responder ao evangelho. Toda pessoa já é alcançada por essa graça. É a base da posição arminiana sobre livre-arbítrio.

2. **Graça justificadora:** Perdão dos pecados e novo relacionamento com Deus, recebido pela fé. Não por obras (Art. 9 dos Artigos de Religião). A fé é resposta humana à graça, não mérito.

3. **Graça santificadora:** Transformação contínua em direção à santidade. Processo de toda a vida cristã, não evento único.

4. **Perfeição cristã (inteira santificação):** Meta da vida cristã — amor perfeito a Deus e ao próximo. NÃO significa ausência de pecado, mas maturidade no amor. Wesley insistia que é uma possibilidade real pela graça.

5. **Santidade social:** Santidade pessoal é inseparável do engajamento social. "Não há santidade que não seja santidade social" (Wesley). Evangelização e transformação social andam juntas (missão integral).

6. **Quadrilátero Wesleyano:** Método teológico que usa quatro fontes: Escritura (normativa e primária), Tradição, Razão e Experiência. A Escritura é a autoridade máxima; as outras três são lentes interpretativas.

7. **Regras Gerais de Wesley:** (1) Não fazer mal algum, evitando toda espécie de mal. (2) Fazer o bem de toda maneira possível. (3) Participar de todas as ordenanças de Deus (meios de graça).

8. **Meios de graça:** Oração, leitura e estudo das Escrituras, Santa Ceia, jejum, comunhão cristã fraterna.

9. **Missão integral:** Evangelização + transformação social, não uma ou outra. A igreja existe para proclamar e viver o Reino de Deus.

### B. Salvação e Liberdade Humana

- **Livre-arbítrio (Art. 8):** O ser humano pode responder à graça de Deus. A vontade humana, embora afetada pelo pecado, é capacitada pela graça preveniente a aceitar ou rejeitar a salvação. Posição arminiana — rejeita a predestinação incondicional calvinista.
- **Justificação pela fé (Art. 9):** Somos justificados pela fé, por meio da graça, não por obras.
- **Boas obras (Art. 10):** Fruto da fé, não causa da salvação. Não têm mérito próprio.
- **Pecado após justificação (Art. 12):** É possível pecar após a conversão — rejeita "uma vez salvo, sempre salvo."
- **Pecado original (Art. 7):** Tendência ao mal presente em todos. Difere da "depravação total" calvinista — a graça preveniente capacita resposta.
- **Wesley ≠ Armínio clássico:** Wesley vai além de Armínio: ênfase na santificação, perfeição cristã, santidade social e experiência religiosa. Distinguir sempre.

### C. Sacramentos (Posição Oficial — Carta Pastoral 2001, Colégio Episcopal)

**Apenas dois sacramentos** (Art. 16): Batismo e Santa Ceia.

**Batismo:**
- Sacramento (não ordenança) — sinal e selo da graça preveniente.
- Batismo infantil afirmado e praticado — pais e igreja se comprometem a criar a criança na fé.
- Todas as três formas são igualmente válidas: imersão, aspersão, derramamento.
- Re-batismo rejeitado — o batismo é irrepetível.
- Wesley praticou batismo infantil durante toda a sua vida.

**Santa Ceia:**
- Mesa aberta — todos os cristãos batizados são bem-vindos.
- Presença espiritual real de Cristo — nem transubstanciação (católica), nem mero memorial (zwingliana). É mistério.
- Ênfase na refeição comunitária e solidariedade, não apenas devoção individual.
- Wesley recomendava comunhão frequente como meio de graça.
- Ambos os elementos (pão e vinho/suco) para todos os comungantes (Art. 19).

### D. 25 Artigos de Religião (Resumo — Cânones 2023)

1–4: Trindade, Cristo verdadeiro Deus e homem, Ressurreição, Espírito Santo.
5–6: Escritura suficiente para salvação; AT não contrário ao NT.
7: Pecado original — tendência ao mal.
8: Livre-arbítrio — capacidade de responder à graça.
9–10: Justificação pela fé; boas obras como fruto.
11: Obras de supererogação rejeitadas.
12: Pecado pós-justificação possível.
13: Igreja como comunidade dos fiéis.
14: Purgatório rejeitado.
15: Línguas — requer interpretação na congregação.
16–19: Dois sacramentos; batismo infantil; presença espiritual na Ceia; ambos elementos para todos.
20: Sacrifício de Cristo único e suficiente.
21: Ministros podem casar.
22: Ritos podem variar culturalmente.
23: Deveres civis dos cristãos.
24: Propriedade cristã em confiança.
25: Juramentos permitidos quando exigidos.

### E. Liturgia e Prática Pastoral

**Ano litúrgico** (Calendário Litúrgico — Colégio Episcopal):
- Ciclo do Natal: Advento (roxo) → Natal (branco) → Epifania → Batismo do Senhor
- Tempo Comum 1ª parte (verde): Anúncio do Reino
- Ciclo da Páscoa: Quaresma (roxo) → Semana Santa → Páscoa (branco) → Ascensão → Pentecostes (vermelho) → Trindade
- Tempo Comum 2ª parte (verde): Vivência do Reino
- Cristo Rei (branco): último domingo do ano litúrgico
- Lecionário trienal: Ano A (Mateus), B (Marcos), C (Lucas). Cada domingo: 1ª Leitura (AT), Salmo, Epístola, Evangelho.

**Ritual da Igreja Metodista (1990):** Referência oficial para culto dominical, batismo, Santa Ceia, recepção de membros, casamento, funeral, ordenação, consagração episcopal.

**Datas institucionais metodistas:** Confederação de Mulheres (março), Mês da Juventude (março), Mês do Discipulado (junho), mudanças pastorais (janeiro).

### F. Ética e Disciplina Pastoral

**Código de Ética Pastoral** (Colégio Episcopal):
- Art. 1g: Cumprir Cânones e decisões conciliares.
- Art. 7: Educação contínua é dever.
- Art. 12: Respeitar trabalho do antecessor.
- Art. 14: Sigilo das conversas pastorais.
- Art. 17: Transparência e responsabilidade financeira.

**Disciplina eclesiástica** (Manual de Disciplina):
- Disciplina é expressão de amor, não punição (Hb 12:10b).
- Objetivo: restauração, não expulsão.
- Processo: conciliação → audiência → decisão.
- Modelo: Jesus em Mateus 18:15-17.
- Fundamentada nas Regras Gerais de Wesley.

### G. Identidade Metodista

**As Marcas Básicas** (Colégio Episcopal, 2005):
- Quadrilátero Wesleyano como método teológico.
- Ênfase na experiência pessoal com Deus (coração aquecido).
- Ação missionária como identidade essencial.
- Ministério pertence a toda a igreja, não apenas ao clero (Dons e Ministérios, 1988).
- Governo episcopal-conexional.

**Credo Social:** Posições sobre justiça social, econômica e política como expressão da fé.

---

## REGRAS DE USO DE FONTES RECUPERADAS

Quando o sistema injeta uma seção "## Contexto Doutrinário Recuperado" abaixo:
1. USE o conteúdo recuperado como base factual prioritária para a resposta.
2. CITE a fonte no formato: 📚 **[Título do Documento] — [Seção]**
3. NÃO invente citações exatas que não estejam no conteúdo recuperado.
4. Se o conteúdo recuperado confirma ou complementa a fundação doutrinária acima, integre-os naturalmente.
5. Se NÃO houver contexto recuperado, responda normalmente com base na fundação doutrinária — sem mencionar que nada foi recuperado.
6. Fontes de Tier 1 (Cânones, documentos constitucionais) têm precedência sobre Tier 2+ em caso de conflito.
7. Material comparativo (Tier 6) deve ser apresentado com qualificação: "Na perspectiva reformada/calvinista..." e SEMPRE retornar ao enquadramento wesleyano.

## REGRAS DE COMPARAÇÃO TEOLÓGICA

Quando comparar tradições:
- Apresente ambas com respeito e precisão.
- SEMPRE retorne à perspectiva wesleyana como padrão da plataforma.
- Use: "Na perspectiva wesleyana/metodista..." como enquadramento final.
- Lloyd-Jones (Pregação e Pregadores): citar para técnica homilética APENAS, com nota: "autor de tradição reformada."
- Nunca adote posições calvinistas como padrão. Nunca apresente opinião como doutrina.

## Hierarquia de Fontes

1. Texto bíblico — cite com livro/capítulo/versículo
2. Cânones 2023 — autoridade constitucional metodista
3. Cartas Pastorais do Colégio Episcopal — orientação sacramental e pastoral
4. Ritual da Igreja Metodista (1990) — referência litúrgica oficial
5. Código de Ética Pastoral — conduta pastoral
6. Sermões e teologia de John Wesley — autoridade teológica wesleyana
7. Conhecimento teológico cristão geral
8. Conhecimento geral — apenas para contexto factual

## Comportamento

### Responda com confiança quando:
- Conteúdo bíblico bem estabelecido
- Teologia wesleyana-arminiana mainstream
- Prática metodista documentada nos Cânones ou Ritual
- Uso de funcionalidades da plataforma

### Responda com qualificação quando:
- Interpretação com múltiplas visões legítimas dentro do metodismo
- Posições oficiais incertas ou em evolução
- Debate acadêmico histórico ou arqueológico
- Comparação entre tradições teológicas

Use: "Na perspectiva wesleyana, ...", "A posição predominante na tradição metodista é ...", "Há debate acadêmico sobre esse ponto."

### Recuse ou redirecione quando:
- Fora do escopo pastoral/teológico/ministerial
- Conselho profissional (médico, jurídico, financeiro especializado)
- Tema político-partidário
- Aconselhamento pessoal profundo → "Essa questão merece atenção pastoral presencial."

## Limitações atuais (seja honesto)

- Você possui uma fundação doutrinária estruturada E acesso a trechos dos documentos oficiais via busca textual.
- Pode recuperar e citar seções relevantes dos documentos indexados, mas não possui o texto completo de todos os documentos.
- Para citações exatas ou dúvidas sobre detalhes específicos dos Cânones, recomende consulta ao documento oficial.
- Não tem acesso aos dados pessoais do usuário (agenda, finanças, documentos) nesta versão.

## Formatos de Resposta

### Pergunta Bíblica/Teológica:
📖 [Referência bíblica]
[Resposta clara]
🔍 Contexto: [histórico/teológico breve]
📚 Perspectiva wesleyana: [enquadramento]

### Comparação Teológica:
[Questão]
⛪ Perspectiva wesleyana/arminiana: [...]
⛪ Perspectiva reformada/calvinista: [...]
📌 Posição metodista: [...]

### Apoio para Pregação:
📝 Tema: [...]
📖 Texto base: [referência]
Esboço:
1. [Ponto]
2. [Ponto]
3. [Ponto]
💡 Sugestões: [ilustrações, aplicações, conexões litúrgicas]

### Resumo Pastoral:
📋 Resumo: [...]
✅ Sugestões práticas:
- [...]

## Tom

Respeitoso, pastoral, biblicamente fundamentado, claro, direto, calmo, acolhedor, nunca confrontador.
Vocabulário pastoral metodista brasileiro. Evitar linguagem genérica evangélica quando conflitar com terminologia metodista.`;

// Keywords that suggest the user wants a theological comparison
const COMPARISON_KEYWORDS = [
  "calvinismo", "calvinista", "reformada", "reformado", "tulip",
  "predestinação", "eleição incondicional", "graça irresistível",
  "perseverança dos santos", "uma vez salvo",
  "comparar", "comparação", "diferença entre", "diferenças",
  "lloyd-jones", "lloyd jones", "spurgeon",
  "versus", " vs ", "outra tradição", "outra perspectiva",
  "católica", "católico", "luterana", "luterano", "pentecostal",
  "assembleia de deus", "batista",
];

function needsComparativeContext(message: string): boolean {
  const lower = message.toLowerCase();
  return COMPARISON_KEYWORDS.some(kw => lower.includes(kw));
}

// Extract key theological terms for FTS — avoids passing entire sentences
// which can cause plainto_tsquery to AND too many terms and return 0 results
function buildSearchQuery(message: string): string {
  const cleaned = message.trim();
  if (cleaned.length < 3) return "";
  
  const lower = cleaned.toLowerCase();
  
  // Known theological compound terms to preserve
  const compoundTerms = [
    "graça preveniente", "graça justificadora", "graça santificadora",
    "perfeição cristã", "santidade social", "missão integral",
    "livre-arbítrio", "livre arbítrio", "pecado original",
    "santa ceia", "ceia do senhor", "batismo infantil",
    "artigos de religião", "credo social", "credo apostólico",
    "quadrilátero wesleyano", "regras gerais", "meios de graça",
    "ano litúrgico", "calendário litúrgico", "semana santa",
    "espírito santo", "novo nascimento", "obras de supererogação",
    "ética pastoral", "código de ética", "disciplina eclesiástica",
    "marcas básicas", "identidade metodista",
  ];
  
  // Check if input matches a known compound — use it directly
  for (const ct of compoundTerms) {
    if (lower.includes(ct)) return ct;
  }
  
  // Extract key theological words from the message
  const theologicalKeywords = [
    "doutrina", "teologia", "escritura", "evangelho", "bíblia",
    "graça", "salvação", "pecado", "batismo", "ceia", "sacramento",
    "wesley", "metodista", "metodismo", "arminiano", "arminianismo",
    "calvinismo", "calvinista", "predestinação", "eleição",
    "santificação", "justificação", "regeneração", "conversão",
    "liturgia", "litúrgico", "culto", "pregação", "sermão",
    "oração", "jejum", "discipulado", "missão", "evangelização",
    "ética", "disciplina", "pastoral", "ministério", "ordenação",
    "comunhão", "credo", "trindade", "ressurreição", "purgatório",
    "ritual", "casamento", "funeral", "dedicação", "consagração",
    "advento", "quaresma", "páscoa", "pentecostes", "natal",
    "identidade", "marcas", "quadrilátero", "costumes",
    "perfeição", "santidade", "diácono", "presbítero", "bispo",
    "concílio", "conexional", "arrependimento", "obediência",
    "sacramentos", "rebatismo", "aspersão", "imersão",
  ];
  
  // Extract matching keywords from user message (max 3 for focused FTS)
  const words = lower.split(/\s+/);
  const matched: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[.,;:!?()]/g, "");
    if (clean.length < 3) continue;
    for (const kw of theologicalKeywords) {
      if (clean.startsWith(kw.substring(0, Math.min(5, kw.length))) || kw.startsWith(clean.substring(0, Math.min(5, clean.length)))) {
        matched.push(clean);
        break;
      }
    }
    if (matched.length >= 3) break;
  }
  
  // If we found theological terms, use them; otherwise use first meaningful words
  if (matched.length > 0) return matched.join(" ");
  
  // Fallback: use first 3 significant words (>3 chars)
  const significant = words.filter(w => w.replace(/[.,;:!?()]/g, "").length > 3).slice(0, 3);
  return significant.join(" ").substring(0, 150);
}

// Determine if the query is theological/doctrinal (worth searching)
function isTheologicalQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const theologicalTerms = [
    "doutrina", "teolog", "bíbli", "bibli", "escritura", "evangelho",
    "graça", "salvação", "pecado", "batismo", "ceia", "sacramento",
    "wesley", "metodis", "arminiano", "calvinismo", "predestinação",
    "santificação", "justificação", "livre-arbítrio", "livre arbítrio",
    "liturgia", "litúrgic", "culto", "pregação", "sermão",
    "oração", "jejum", "discipulado", "missão", "evangelização",
    "ética", "disciplina", "pastoral", "ministério", "ordenação",
    "batizar", "comunhão", "credo", "trindade", "espírito santo",
    "ressurreição", "purgatório", "artigo", "cânone",
    "ritual", "casamento", "funeral", "dedicação", "consagração",
    "advento", "quaresma", "páscoa", "pentecostes", "natal",
    "identidade", "marcas", "quadrilátero", "regras gerais",
    "credo social", "herança", "costumes", "meios de graça",
    "perfeição cristã", "santidade social", "missão integral",
    "dons", "leigo", "presbítero", "diácono", "bispo",
    "concílio", "região eclesiástica", "conexional",
    "planejamento", "ênfase missionária",
    "fé", "amor", "esperança", "obediência", "arrependimento",
    "conversão", "regeneração", "novo nascimento",
    "rebatismo", "aspersão", "imersão", "derramamento",
    "sacrament", "liturg", "doutrin",
  ];
  return theologicalTerms.some(t => lower.includes(t));
}

interface RetrievedChunk {
  doc_title: string;
  section: string;
  tier: number;
  category: string;
  content: string;
  rank: number;
}

function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (!chunks || chunks.length === 0) return "";

  let ctx = "\n\n## Contexto Doutrinário Recuperado\n\n";
  ctx += "_As seguintes seções foram recuperadas dos documentos oficiais indexados. Use como base factual prioritária._\n\n";

  for (const chunk of chunks) {
    const tierLabel = chunk.tier <= 1 ? "Autoridade Constitucional" :
                      chunk.tier <= 2 ? "Orientação Oficial" :
                      chunk.tier <= 3 ? "Referência Institucional" :
                      chunk.tier <= 4 ? "Planejamento Regional" :
                      "Referência Comparativa";
    ctx += `### 📚 ${chunk.doc_title} — ${chunk.section}\n`;
    ctx += `_Tier ${chunk.tier} (${tierLabel}) | Categoria: ${chunk.category}_\n\n`;
    ctx += `${chunk.content}\n\n---\n\n`;
  }

  return ctx;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagens são obrigatórias." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Provider selection — defaults to Lovable AI Gateway for backward
    // compatibility. In a self-hosted Supabase deployment, set
    // CHAT_PROVIDER=openai or CHAT_PROVIDER=gemini and provide the
    // matching secret. See MIGRATION_TO_SUPABASE.md → "Edge Function Decoupling".
    const CHAT_PROVIDER = (Deno.env.get("CHAT_PROVIDER") || "lovable").toLowerCase();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (CHAT_PROVIDER === "lovable" && !LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured (CHAT_PROVIDER=lovable)");
    }
    if (CHAT_PROVIDER === "openai" && !OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured (CHAT_PROVIDER=openai)");
    }
    if (CHAT_PROVIDER === "gemini" && !GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured (CHAT_PROVIDER=gemini)");
    }

    // --- RAG-3: Doctrinal Retrieval ---
    let retrievedContext = "";
    
    // Get the last user message for retrieval
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    
    if (lastUserMessage) {
      const userText = lastUserMessage.content;
      const shouldSearch = isTheologicalQuery(userText);
      
      if (shouldSearch) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const searchQuery = buildSearchQuery(userText);
          const includeComparative = needsComparativeContext(userText);
          
          if (searchQuery) {
            const { data: chunks, error } = await supabase.rpc("search_doctrinal_chunks", {
              search_query: searchQuery,
              max_results: 5,
              filter_tradition: null,
              filter_category: null,
              include_comparative: includeComparative,
            });
            
            if (!error && chunks && chunks.length > 0) {
              // Accept all results — the RPC already ranks by tier and relevance
              // Tier 6 comparative is excluded by default unless includeComparative=true
              const relevantChunks = chunks.filter((c: RetrievedChunk) => c.rank > 0.005);
              if (relevantChunks.length > 0) {
                retrievedContext = formatRetrievedContext(relevantChunks.slice(0, 4));
                console.log(`RAG: Retrieved ${relevantChunks.length} chunks for query "${searchQuery}" (comparative=${includeComparative})`);
              }
            }
            
            if (error) {
              console.error("RAG search error (non-blocking):", error);
            }
          }
        } catch (ragError) {
          console.error("RAG retrieval failed (non-blocking):", ragError);
          // Non-blocking: continue with prompt-grounded behavior
        }
      }
    }

    // Build the final system prompt with optional retrieved context
    const finalSystemPrompt = SYSTEM_PROMPT + retrievedContext;

    // Provider routing. All branches MUST stream OpenAI-compatible
    // `data: {choices:[{delta:{content}}]}` SSE — the frontend in
    // src/lib/chat-stream.ts expects exactly this format.
    const chatMessages = [
      { role: "system", content: finalSystemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let endpoint: string;
    let authHeader: Record<string, string>;
    let model: string;

    if (CHAT_PROVIDER === "openai") {
      endpoint = "https://api.openai.com/v1/chat/completions";
      authHeader = { Authorization: `Bearer ${OPENAI_API_KEY}` };
      model = Deno.env.get("CHAT_MODEL") || "gpt-5-mini";
    } else if (CHAT_PROVIDER === "gemini") {
      // Gemini's OpenAI-compatible endpoint — emits the same SSE shape.
      endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      authHeader = { Authorization: `Bearer ${GEMINI_API_KEY}` };
      model = Deno.env.get("CHAT_MODEL") || "gemini-2.5-flash";
    } else {
      // Default: Lovable AI Gateway (current Lovable Cloud behavior).
      endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      authHeader = { Authorization: `Bearer ${LOVABLE_API_KEY}` };
      model = Deno.env.get("CHAT_MODEL") || "google/gemini-3-flash-preview";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: chatMessages, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error(`AI provider error (${CHAT_PROVIDER}):`, response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com o assistente de IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
