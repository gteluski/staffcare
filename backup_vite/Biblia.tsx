import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookMarked, ChevronLeft, ChevronRight, BookOpen, Search, Loader2, AlertCircle, Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BIBLE_BOOKS, BIBLE_VERSIONS, type BibleBook, type BibleVersion } from "@/lib/bible-data";

type View = "books" | "reading";

interface BibleVerse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

async function fetchChapter(book: BibleBook, chapter: number, version: BibleVersion): Promise<BibleVerse[]> {
  if (!version.available || !version.apiKey) {
    throw new Error("VERSION_UNAVAILABLE");
  }
  const ref = encodeURIComponent(`${book.apiName} ${chapter}`);
  const res = await fetch(`https://bible-api.com/${ref}?translation=${version.apiKey}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.verses || []).map((v: any) => ({
    book_name: v.book_name,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text?.trim() || "",
  }));
}

export default function Biblia() {
  const [version, setVersion] = useState("arc");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState(1);
  const [view, setView] = useState<View>("books");
  const [search, setSearch] = useState("");

  const currentVersion = BIBLE_VERSIONS.find((v) => v.id === version) || BIBLE_VERSIONS[0];

  const atBooks = useMemo(() => BIBLE_BOOKS.filter((b) => b.testament === "AT"), []);
  const ntBooks = useMemo(() => BIBLE_BOOKS.filter((b) => b.testament === "NT"), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return BIBLE_BOOKS.filter((b) => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q));
  }, [search]);

  const openBook = (book: BibleBook, ch = 1) => {
    setSelectedBook(book);
    setChapter(ch);
    setView("reading");
  };

  const prevChapter = () => {
    if (!selectedBook) return;
    if (chapter > 1) {
      setChapter(chapter - 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
      if (idx > 0) {
        const prev = BIBLE_BOOKS[idx - 1];
        setSelectedBook(prev);
        setChapter(prev.chapters);
      }
    }
  };

  const nextChapter = () => {
    if (!selectedBook) return;
    if (chapter < selectedBook.chapters) {
      setChapter(chapter + 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
      if (idx < BIBLE_BOOKS.length - 1) {
        const next = BIBLE_BOOKS[idx + 1];
        setSelectedBook(next);
        setChapter(1);
      }
    }
  };

  // Fetch verses
  const { data: verses, isLoading, isError, error } = useQuery({
    queryKey: ["bible", version, selectedBook?.id, chapter],
    enabled: view === "reading" && !!selectedBook && currentVersion.available,
    queryFn: () => fetchChapter(selectedBook!, chapter, currentVersion),
    staleTime: 1000 * 60 * 30, // cache 30 min
    retry: 1,
  });

  // ─── Reading view ─────────────────────────────────────────────
  if (view === "reading" && selectedBook) {
    return (
      <div className="max-w-3xl space-y-4">
        {/* Nav bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView("books")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Livros
            </Button>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIBLE_VERSIONS.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="flex items-center gap-1.5">
                      {v.abbr} — {v.name}
                      {!v.available && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapter picker */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevChapter}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: selectedBook.chapters }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Cap. {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextChapter}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Book & chapter heading */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {selectedBook.name} {chapter}
          </h1>
          <p className="text-xs text-muted-foreground">
            {currentVersion.name}
            {currentVersion.available && (
              <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1.5 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                Disponível
              </Badge>
            )}
          </p>
        </div>

        {/* Content */}
        {!currentVersion.available ? (
          <UnavailableVersionCard version={currentVersion} onSwitchToArc={() => setVersion("arc")} />
        ) : isLoading ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Carregando texto…</p>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center">
              <AlertCircle className="h-8 w-8 text-destructive/50 mb-3" />
              <p className="text-sm text-muted-foreground">Não foi possível carregar o texto.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Verifique sua conexão e tente novamente.</p>
            </CardContent>
          </Card>
        ) : verses && verses.length > 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 sm:py-10 px-6 sm:px-10">
              <div className="max-w-2xl mx-auto font-heading text-lg sm:text-xl leading-[2] text-foreground">
                {verses.map((v) => (
                  <span key={v.verse} className="inline">
                    <sup className="text-xs text-primary/60 font-sans font-semibold mr-0.5 select-none">{v.verse}</sup>
                    <span>{v.text} </span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum versículo encontrado para este capítulo.</p>
            </CardContent>
          </Card>
        )}

        {/* Bottom nav */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={prevChapter} className="text-xs">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Capítulo anterior
          </Button>
          <span className="text-xs text-muted-foreground">{selectedBook.abbr} {chapter}</span>
          <Button variant="ghost" size="sm" onClick={nextChapter} className="text-xs">
            Próximo capítulo <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Book selector view ───────────────────────────────────────
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Bíblia</h1>
        <Select value={version} onValueChange={setVersion}>
          <SelectTrigger className="h-9 w-[240px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BIBLE_VERSIONS.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                <span className="flex items-center gap-1.5">
                  {v.abbr} — {v.name}
                  {!v.available && <Lock className="h-3 w-3 text-muted-foreground" />}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Version status */}
      {!currentVersion.available && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-3 flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{currentVersion.abbr} — Versão ainda não disponível</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">
                {currentVersion.licenseNote} Você pode navegar pela estrutura dos livros, mas o texto ainda não será exibido.
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" onClick={() => setVersion("arc")}>
                Usar ARC (Almeida Revista e Corrigida) — disponível
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar livro…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered ? (
        <BookGrid title="Resultados" books={filtered} onSelect={openBook} />
      ) : (
        <>
          <BookGrid title="Antigo Testamento" books={atBooks} onSelect={openBook} />
          <BookGrid title="Novo Testamento" books={ntBooks} onSelect={openBook} />
        </>
      )}

      {/* Available versions info */}
      <Card>
        <CardContent className="py-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Versões disponíveis</p>
          <div className="flex flex-wrap gap-2">
            {BIBLE_VERSIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVersion(v.id)}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  v.available
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {v.available ? <BookOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {v.abbr}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            Novas traduções serão adicionadas conforme os licenciamentos forem aprovados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function UnavailableVersionCard({ version, onSwitchToArc }: { version: BibleVersion; onSwitchToArc: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 sm:py-16">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <Lock className="h-10 w-10 text-muted-foreground/20 mx-auto" />
          <div>
            <p className="text-base font-medium text-foreground">{version.abbr} — Texto não disponível</p>
            <p className="text-sm text-muted-foreground mt-1">{version.licenseNote}</p>
          </div>
          <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
            A plataforma respeita os direitos autorais e utilizará apenas traduções devidamente licenciadas.
          </p>
          <Button variant="outline" size="sm" onClick={onSwitchToArc}>
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Ler na ARC (disponível)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookGrid({ title, books, onSelect }: { title: string; books: BibleBook[]; onSelect: (b: BibleBook, ch?: number) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (books.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">Nenhum livro encontrado.</p>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {books.map((book) => (
          <div key={book.id} className="relative">
            <button
              onClick={() => {
                if (book.chapters === 1) {
                  onSelect(book);
                } else {
                  setExpanded(expanded === book.id ? null : book.id);
                }
              }}
              className={`w-full rounded-lg border px-2 py-2.5 text-center transition-colors hover:bg-accent/40 ${
                expanded === book.id ? "bg-accent/40 border-primary/30" : ""
              }`}
            >
              <span className="text-xs font-medium text-foreground block truncate">{book.abbr}</span>
              <span className="text-[10px] text-muted-foreground block truncate leading-tight mt-0.5">{book.name}</span>
            </button>
            {expanded === book.id && book.chapters > 1 && (
              <Card className="absolute top-full left-0 z-30 mt-1 w-48 sm:w-56 shadow-lg">
                <CardContent className="py-2 px-2">
                  <p className="text-xs font-medium text-foreground mb-1.5 px-1">{book.name}</p>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: book.chapters }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => { setExpanded(null); onSelect(book, i + 1); }}
                        className="h-7 w-full rounded text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
