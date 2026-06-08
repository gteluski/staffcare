import { useState, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";

const QUICK_TOPICS = [
  "Me ajude a preparar um sermão sobre graça para este domingo",
  "O que os Cânones dizem sobre o batismo infantil?",
  "Sugira uma liturgia para um culto de Santa Ceia",
  "Quais são os meios de graça na teologia wesleyana?",
  "Me ajude a organizar minhas visitas pastorais desta semana",
];

export default function Assistente() {
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    setChatReady(true);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Assistente Pastoral</h1>
        </div>
      </div>
      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
        Converse com o assistente de IA especializado em teologia wesleyana, pregação, liturgia e organização pastoral.
        As respostas são fundamentadas nos documentos oficiais da Igreja Metodista.
      </p>

      {/* Embedded chat */}
      <div className="border rounded-lg bg-card overflow-hidden" style={{ height: "calc(100dvh - 240px)", minHeight: "400px" }}>
        {chatReady && <EmbeddedChat />}
      </div>
    </div>
  );
}

function EmbeddedChat() {
  return (
    <div className="h-full flex flex-col">
      <ChatPanel open={true} onClose={() => {}} embedded />
    </div>
  );
}
