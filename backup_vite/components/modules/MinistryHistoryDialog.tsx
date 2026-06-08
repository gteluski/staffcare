import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { METHODIST_CITIES_6TH_REGION, MINISTRY_FUNCTIONS } from "@/lib/methodist-cities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MinistryHistory } from "@/hooks/useMinistry";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: MinistryHistory | null;
  onSave: (data: Omit<MinistryHistory, "id" | "user_id" | "created_at" | "updated_at">) => void;
  saving?: boolean;
}

const currentYear = new Date().getFullYear();

export function MinistryHistoryDialog({ open, onOpenChange, initial, onSave, saving }: Props) {
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [fn, setFn] = useState("");
  const [notes, setNotes] = useState("");
  const [reflections, setReflections] = useState("");
  const [plans, setPlans] = useState("");

  useEffect(() => {
    if (open) {
      setStartYear(initial?.start_year?.toString() ?? "");
      setEndYear(initial?.end_year?.toString() ?? "");
      setIsCurrent(initial?.is_current ?? false);
      setChurchName(initial?.church_name ?? "");
      setCity(initial?.city ?? "");
      setCitySearch("");
      setFn(initial?.ministry_function ?? "");
      setNotes(initial?.notes ?? "");
      setReflections(initial?.reflections ?? "");
      setPlans(initial?.plans ?? "");
    }
  }, [open, initial]);

  const filteredCities = useMemo(() => {
    if (citySearch.length < 3) return [];
    const q = citySearch.toLowerCase();
    return METHODIST_CITIES_6TH_REGION.filter((c) => c.toLowerCase().includes(q)).slice(0, 12);
  }, [citySearch]);

  const handleSubmit = () => {
    if (!startYear || !churchName || !city || !fn) return;
    onSave({
      start_year: parseInt(startYear),
      end_year: isCurrent ? null : (endYear ? parseInt(endYear) : null),
      is_current: isCurrent,
      church_name: churchName,
      city,
      ministry_function: fn,
      notes,
      reflections,
      plans,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{initial ? "Editar Experiência" : "Nova Experiência Ministerial"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Function */}
          <div className="space-y-1.5">
            <Label>Função Ministerial *</Label>
            <Select value={fn} onValueChange={setFn}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {MINISTRY_FUNCTIONS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Church */}
          <div className="space-y-1.5">
            <Label>Nome da Igreja *</Label>
            <Input value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="Ex: Igreja Metodista Central" />
          </div>

          {/* City autocomplete */}
          <div className="space-y-1.5">
            <Label>Cidade *</Label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {city || "Buscar cidade..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Digite 3+ letras..." value={citySearch} onValueChange={setCitySearch} />
                  <CommandList>
                    {citySearch.length < 3 ? (
                      <CommandEmpty>Digite ao menos 3 letras para buscar</CommandEmpty>
                    ) : filteredCities.length === 0 ? (
                      <CommandEmpty>Nenhuma cidade encontrada</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {filteredCities.map((c) => (
                          <CommandItem key={c} value={c} onSelect={() => { setCity(c); setCityOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", city === c ? "opacity-100" : "opacity-0")} />
                            {c}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Years */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ano de Início *</Label>
              <Input type="number" min={1950} max={currentYear} value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Ex: 2018" />
            </div>
            <div className="space-y-1.5">
              <Label>Ano de Término</Label>
              <Input type="number" min={1950} max={currentYear + 5} value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="Ex: 2022" disabled={isCurrent} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is_current" checked={isCurrent} onCheckedChange={(v) => setIsCurrent(!!v)} />
            <Label htmlFor="is_current" className="text-sm cursor-pointer">Atuando nesta igreja atualmente</Label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Anotações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas sobre este período..." />
          </div>
          <div className="space-y-1.5">
            <Label>Reflexões</Label>
            <Textarea rows={2} value={reflections} onChange={(e) => setReflections(e.target.value)} placeholder="Reflexões sobre a experiência..." />
          </div>
          <div className="space-y-1.5">
            <Label>Planos e Desejos</Label>
            <Textarea rows={2} value={plans} onChange={(e) => setPlans(e.target.value)} placeholder="Planos ou desejos para este período..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !startYear || !churchName || !city || !fn}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
