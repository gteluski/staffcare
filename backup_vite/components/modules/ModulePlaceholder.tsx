import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint: string;
}

export function ModulePlaceholder({ icon: Icon, title, description, hint }: ModulePlaceholderProps) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
      </div>
      <p className="text-muted-foreground text-base mb-6 leading-relaxed">{description}</p>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Icon className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm max-w-sm">{hint}</p>
        </CardContent>
      </Card>
    </div>
  );
}
