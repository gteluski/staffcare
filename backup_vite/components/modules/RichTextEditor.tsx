import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import { FontSize } from "./FontSize";
import { LineHeight } from "./LineHeight";
import { FontFamily, FONT_FAMILIES } from "./FontFamily";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, ListChecks,
  Undo2, Redo2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Minus, Link as LinkIcon, Unlink,
  Highlighter, RemoveFormatting, Palette,
  ChevronDown, Type, Baseline, Indent, Outdent,
} from "lucide-react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = [
  { label: "8", value: "8px" },
  { label: "9", value: "9px" },
  { label: "10", value: "10px" },
  { label: "11", value: "11px" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
  { label: "72", value: "72px" },
];

const LINE_HEIGHTS = [
  { label: "Simples", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Duplo", value: "2" },
  { label: "2.5", value: "2.5" },
];

const TEXT_COLORS = [
  { label: "Preto", value: "#1a1a1a", display: "#1a1a1a" },
  { label: "Cinza escuro", value: "#4a4a4a", display: "#4a4a4a" },
  { label: "Cinza", value: "#808080", display: "#808080" },
  { label: "Vermelho", value: "#c0392b", display: "#c0392b" },
  { label: "Vermelho escuro", value: "#8b0000", display: "#8b0000" },
  { label: "Laranja", value: "#d35400", display: "#d35400" },
  { label: "Azul", value: "#2471a3", display: "#2471a3" },
  { label: "Azul marinho", value: "#1a3c5e", display: "#1a3c5e" },
  { label: "Verde", value: "#27ae60", display: "#27ae60" },
  { label: "Verde escuro", value: "#1e5631", display: "#1e5631" },
  { label: "Roxo", value: "#6c3483", display: "#6c3483" },
  { label: "Marrom", value: "#6d4c41", display: "#6d4c41" },
];

const HIGHLIGHT_COLORS = [
  { label: "Amarelo", value: "#fef08a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bfdbfe" },
  { label: "Rosa", value: "#fbcfe8" },
  { label: "Laranja", value: "#fed7aa" },
  { label: "Roxo", value: "#e9d5ff" },
];

/* ─── Toolbar button ─── */
function TB({
  active, onClick, icon, label, disabled, className = "",
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`editor-tb-btn ${active ? "active" : ""} ${disabled ? "disabled" : ""} ${className}`}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[11px] font-normal px-2.5 py-1">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Divider() {
  return <div className="editor-tb-divider" />;
}

export function RichTextEditor({ content, onChange, placeholder, className }: Props) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
        blockquote: {},
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Comece a escrever…",
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      FontFamily,
      TaskList.configure({ HTMLAttributes: { class: "not-prose" } }),
      TaskItem.configure({ nested: true }),
      Typography,
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: "editor-body",
        spellcheck: "true",
        lang: "pt-BR",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  const chars = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();

  const blockType = editor.isActive("heading", { level: 1 })
    ? "h1" : editor.isActive("heading", { level: 2 })
    ? "h2" : editor.isActive("heading", { level: 3 })
    ? "h3" : "p";

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "";
  const currentFontFamily = editor.getAttributes("textStyle").fontFamily || "";
  const currentColor = editor.getAttributes("textStyle").color || "";

  return (
    <div className={`editor-root ${className || ""}`}>
      {/* ════════════ RIBBON TOOLBAR ════════════ */}
      <div className="editor-ribbon">
        {/* ── Row 1: Font family, Size, Block type, Basic formatting ── */}
        <div className="editor-ribbon-row">
          {/* Font family */}
          <Select
            value={currentFontFamily || "default"}
            onValueChange={(v) => {
              if (v === "default") editor.chain().focus().unsetFontFamily().run();
              else editor.chain().focus().setFontFamily(v).run();
            }}
          >
            <SelectTrigger className="editor-select w-[130px]">
              <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.value || "default"} value={f.value || "default"}>
                  <span style={{ fontFamily: f.value || "inherit" }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font size */}
          <Select
            value={currentFontSize || "default"}
            onValueChange={(v) => {
              if (v === "default") editor.chain().focus().unsetFontSize().run();
              else editor.chain().focus().setFontSize(v).run();
            }}
          >
            <SelectTrigger className="editor-select w-[70px]">
              <SelectValue placeholder="Tam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Auto</SelectItem>
              {FONT_SIZES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Divider />

          {/* Block type */}
          <Select
            value={blockType}
            onValueChange={(v) => {
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: parseInt(v.replace("h", "")) as 1 | 2 | 3 }).run();
            }}
          >
            <SelectTrigger className="editor-select w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Parágrafo</SelectItem>
              <SelectItem value="h1"><span className="font-bold text-base">Título 1</span></SelectItem>
              <SelectItem value="h2"><span className="font-semibold text-sm">Título 2</span></SelectItem>
              <SelectItem value="h3"><span className="font-medium text-xs">Título 3</span></SelectItem>
            </SelectContent>
          </Select>

          <Divider />

          {/* Bold, Italic, Underline, Strike */}
          <TB active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold className="h-4 w-4" />} label="Negrito (Ctrl+B)" />
          <TB active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic className="h-4 w-4" />} label="Itálico (Ctrl+I)" />
          <TB active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon className="h-4 w-4" />} label="Sublinhado (Ctrl+U)" />
          <TB active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough className="h-4 w-4" />} label="Tachado" />

          <Divider />

          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="editor-tb-btn" title="Cor do texto">
                <div className="flex flex-col items-center">
                  <Baseline className="h-4 w-4" />
                  <div className="h-[3px] w-4 rounded-full mt-[-1px]" style={{ backgroundColor: currentColor || "hsl(var(--foreground))" }} />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Cor do texto</p>
              <div className="grid grid-cols-6 gap-1.5">
                <button className="w-6 h-6 rounded border border-border flex items-center justify-center hover:scale-110 transition-transform" title="Automático" onClick={() => editor.chain().focus().unsetColor().run()}>
                  <RemoveFormatting className="h-3 w-3 text-muted-foreground" />
                </button>
                {TEXT_COLORS.map((c) => (
                  <button key={c.value} className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform hover:ring-2 ring-primary/30" style={{ backgroundColor: c.display }} title={c.label} onClick={() => editor.chain().focus().setColor(c.value).run()} />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={`editor-tb-btn ${editor.isActive("highlight") ? "active" : ""}`} title="Realce">
                <Highlighter className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Realce</p>
              <div className="flex gap-1.5">
                <button className="w-6 h-6 rounded border border-border flex items-center justify-center hover:scale-110 transition-transform" title="Remover" onClick={() => editor.chain().focus().unsetHighlight().run()}>
                  <RemoveFormatting className="h-3 w-3 text-muted-foreground" />
                </button>
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c.value} className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform hover:ring-2 ring-primary/30" style={{ backgroundColor: c.value }} title={c.label} onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()} />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ── Row 2: Alignment, Spacing, Lists, Blocks, Links, Undo/Redo ── */}
        <div className="editor-ribbon-row">
          {/* Alignment group */}
          <div className="editor-btn-group">
            <TB active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} icon={<AlignLeft className="h-4 w-4" />} label="Alinhar à esquerda" />
            <TB active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} icon={<AlignCenter className="h-4 w-4" />} label="Centralizar" />
            <TB active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} icon={<AlignRight className="h-4 w-4" />} label="Alinhar à direita" />
            <TB active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} icon={<AlignJustify className="h-4 w-4" />} label="Justificar" />
          </div>

          <Divider />

          {/* Line spacing */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="editor-tb-btn gap-0.5 px-2" title="Espaçamento entre linhas">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current"><path d="M4 3l-2 2.5h1.5v5H2l2 2.5 2-2.5H4.5v-5H6L4 3z" fill="currentColor" /><line x1="8" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5"/></svg>
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2" align="start">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider px-2">Espaçamento</p>
              {LINE_HEIGHTS.map((lh) => (
                <button key={lh.value} className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted/80 transition-colors" onClick={() => editor.chain().focus().setLineHeight(lh.value).run()}>
                  {lh.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Divider />

          {/* Lists group */}
          <div className="editor-btn-group">
            <TB active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List className="h-4 w-4" />} label="Lista com marcadores" />
            <TB active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered className="h-4 w-4" />} label="Lista numerada" />
            <TB active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} icon={<ListChecks className="h-4 w-4" />} label="Lista de tarefas" />
          </div>

          <Divider />

          {/* Indent/Outdent */}
          <TB active={false} onClick={() => {
            if (editor.isActive("bulletList") || editor.isActive("orderedList")) editor.chain().focus().sinkListItem("listItem").run();
          }} icon={<Indent className="h-4 w-4" />} label="Aumentar recuo" />
          <TB active={false} onClick={() => {
            if (editor.isActive("bulletList") || editor.isActive("orderedList")) editor.chain().focus().liftListItem("listItem").run();
          }} icon={<Outdent className="h-4 w-4" />} label="Diminuir recuo" />

          <Divider />

          {/* Quote + HR */}
          <TB active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote className="h-4 w-4" />} label="Citação" />
          <TB active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="h-4 w-4" />} label="Linha horizontal" />

          <Divider />

          {/* Link */}
          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`editor-tb-btn ${editor.isActive("link") ? "active" : ""}`}
                onClick={() => { setLinkUrl(editor.getAttributes("link").href || ""); setLinkOpen(true); }}
                title="Link"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <p className="text-xs font-semibold text-foreground mb-2">Inserir link</p>
              <Input placeholder="https://exemplo.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyLink()} className="h-8 text-xs mb-2" />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={applyLink}>Aplicar</Button>
                {editor.isActive("link") && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }}>
                    <Unlink className="h-3 w-3 mr-1" /> Remover
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Divider />

          {/* Clear formatting */}
          <TB active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} icon={<RemoveFormatting className="h-4 w-4" />} label="Limpar formatação" />

          <div className="flex-1" />

          {/* Undo/Redo right-aligned */}
          <TB disabled={!editor.can().undo()} active={false} onClick={() => editor.chain().focus().undo().run()} icon={<Undo2 className="h-4 w-4" />} label="Desfazer (Ctrl+Z)" />
          <TB disabled={!editor.can().redo()} active={false} onClick={() => editor.chain().focus().redo().run()} icon={<Redo2 className="h-4 w-4" />} label="Refazer (Ctrl+Shift+Z)" />
        </div>
      </div>

      {/* ════════════ BUBBLE MENU ════════════ */}
      <BubbleMenu editor={editor} className="editor-bubble-menu">
        <TB active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold className="h-3.5 w-3.5" />} label="Negrito" />
        <TB active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic className="h-3.5 w-3.5" />} label="Itálico" />
        <TB active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon className="h-3.5 w-3.5" />} label="Sublinhado" />
        <TB active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough className="h-3.5 w-3.5" />} label="Tachado" />
        <div className="editor-tb-divider" />
        <TB active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} icon={<Highlighter className="h-3.5 w-3.5" />} label="Realce" />
        <TB active={editor.isActive("link")} onClick={() => { setLinkUrl(editor.getAttributes("link").href || ""); setLinkOpen(true); }} icon={<LinkIcon className="h-3.5 w-3.5" />} label="Link" />
      </BubbleMenu>

      {/* ════════════ DOCUMENT CANVAS ════════════ */}
      <div className="editor-paper-wrapper">
        <div className="editor-paper">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ════════════ STATUS BAR ════════════ */}
      <div className="editor-statusbar">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Ortografia pt-BR ativa
        </span>
        <div className="flex items-center gap-4">
          <span>{words} {words === 1 ? "palavra" : "palavras"}</span>
          <span>{chars} caracteres</span>
        </div>
      </div>
    </div>
  );
}
