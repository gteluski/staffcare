'use client';

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User, CalendarDays, CheckSquare, BookOpen, FileText, Bot, Church,
  ChevronRight, CheckCircle, Circle, Sparkles, X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface ChecklistItem {
  key: string;
  icon: typeof User;
  label: string;
  description: string;
  path: string;
  done: boolean;
}

export function WelcomeChecklist() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [dismissed, setDismissed] = useState(true);

  // Initialize dismissed state on client-side to avoid hydration mismatch
  useEffect(() => {
    if (user) {
      const isDismissed = localStorage.getItem(`welcome-dismissed-${user.id}`) === "true";
      setDismissed(isDismissed);
    }
  }, [user]);

  // Query counts for each checklist item
  const { data: counts, isLoading } = useQuery({
    queryKey: ["welcome-checklist", user?.id],
    queryFn: async () => {
      if (!user) return { events: 0, tasks: 0, sermons: 0, files: 0 };
      const [events, tasks, sermons, files] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("sermons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("library_files").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      return {
        events: events.count ?? 0,
        tasks: tasks.count ?? 0,
        sermons: sermons.count ?? 0,
        files: files.count ?? 0,
      };
    },
    enabled: !!user && !dismissed,
    staleTime: 30_000,
  });

  if (dismissed || isLoading || !counts || !profile) return null;

  const profileComplete = !!(profile.full_name && profile.church_name);

  const items: ChecklistItem[] = [
    {
      key: "profile",
      icon: User,
      label: "Complete seu perfil pastoral",
      description: "Nome, título pastoral e igreja local",
      path: "/perfil",
      done: profileComplete,
    },
    {
      key: "event",
      icon: CalendarDays,
      label: "Crie seu primeiro compromisso",
      description: "Adicione um culto, visita ou reunião na agenda",
      path: "/agenda",
      done: counts.events > 0,
    },
    {
      key: "task",
      icon: CheckSquare,
      label: "Registre sua primeira tarefa",
      description: "Registre algo que precisa fazer esta semana",
      path: "/tarefas",
      done: counts.tasks > 0,
    },
    {
      key: "sermon",
      icon: BookOpen,
      label: "Escreva seu primeiro documento ou sermão",
      description: "Crie um esboço ou registro de pregação",
      path: "/pregacoes",
      done: counts.sermons > 0,
    },
    {
      key: "file",
      icon: FileText,
      label: "Envie um documento à biblioteca",
      description: "Suba um arquivo para a biblioteca em nuvem",
      path: "/biblioteca",
      done: counts.files > 0,
    },
    {
      key: "assistant",
      icon: Bot,
      label: "Conheça o Assistente Pastoral",
      description: "Peça ajuda com um estudo, organização ou reflexão",
      path: "/assistente",
      done: false, // Can't easily track this, always suggest
    },
    {
      key: "methodist",
      icon: Church,
      label: "Explore os recursos metodistas da plataforma",
      description: "Conheça os recursos denominacionais disponíveis",
      path: "/metodista",
      done: false,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  // Auto-dismiss if all tasks that can be tracked are done (5 of 7)
  const trackableDone = items.filter((i) => i.key !== "assistant" && i.key !== "methodist").every((i) => i.done);

  const handleDismiss = () => {
    if (user) localStorage.setItem(`welcome-dismissed-${user.id}`, "true");
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {trackableDone ? "Você está no caminho certo!" : "Por onde começar"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {trackableDone
                  ? "Continue explorando — a plataforma está pronta para o seu dia a dia."
                  : "Comece por onde fizer mais sentido para a sua rotina."}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground/40 hover:text-muted-foreground p-1 -m-1"
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{doneCount} de {items.length} concluídos</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                item.done
                  ? "bg-muted/30"
                  : "bg-card hover:bg-muted/50 border border-border/50"
              }`}
            >
              {item.done ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground/70 leading-snug">{item.description}</p>
              </div>
              {!item.done && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {trackableDone && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="rounded-full text-xs"
            >
              Entendi, pode fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
