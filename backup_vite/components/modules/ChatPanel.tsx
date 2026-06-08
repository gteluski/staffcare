import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ChatMessage, streamChat } from "@/lib/chat-stream";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  embedded?: boolean;
}

const WELCOME_MESSAGE = `Olá! Sou o **Assistente Pastoral**, preparado para apoiar seu ministério.

Posso ajudar com:
- 📖 Perguntas bíblicas e teológicas
- 📝 Preparação de sermões e estudos
- ⛪ Liturgia e prática metodista
- 🗓️ Organização ministerial
- 📌 Uso da plataforma

Como posso ajudá-lo(a) hoje?`;

export function ChatPanel({ open, onClose, embedded }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Only send non-welcome messages to the API
    const apiMessages = newMessages.filter(
      (_, i) => !(i === 0 && newMessages[0].role === "assistant")
    );

    let assistantContent = "";
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        messages: apiMessages,
        signal: controller.signal,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && prev.length > 1 && last.content !== WELCOME_MESSAGE) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantContent }];
          });
        },
        onDone: () => {
          setIsLoading(false);
        },
        onError: (errMsg) => {
          setError(errMsg);
          setIsLoading(false);
        },
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Erro de conexão. Tente novamente.");
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setIsLoading(false);
    setError(null);
  };

  if (!open) return null;

  return (
    <div className={cn(
      "flex flex-col",
      embedded
        ? "h-full bg-background"
        : "fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] bg-background border-l border-border shadow-2xl max-h-[100dvh]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-foreground/60" />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Assistente Pastoral
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Limpar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {!embedded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
        <div className="space-y-4 pb-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-chat-user-bubble text-chat-user-foreground"
                    : "bg-chat-assistant-bubble text-chat-assistant-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-chat-assistant-bubble text-chat-assistant-foreground rounded-lg px-3.5 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/10 border-t border-destructive/20">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm bg-background"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Ferramenta de apoio pastoral. Não substitui o discernimento ministerial.
        </p>
      </div>
    </div>
  );
}
