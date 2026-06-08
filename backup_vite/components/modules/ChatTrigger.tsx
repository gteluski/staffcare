import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatTriggerProps {
  onClick: () => void;
}

export function ChatTrigger({ onClick }: ChatTriggerProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      title="Assistente Pastoral"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}
