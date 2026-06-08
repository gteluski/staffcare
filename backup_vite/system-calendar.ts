/**
 * Brazilian national holidays, commemorative dates, Christian liturgical calendar,
 * and Methodist denominational dates.
 * Generates AppEvent-compatible objects for any given year.
 * Movable dates (Easter-based) are computed using the Anonymous Gregorian algorithm.
 *
 * Sources:
 * - National holidays: Lei nº 662/1949, 6.802/1980, 10.607/2002, 14.759/2023
 * - Liturgical calendar: Calendário Litúrgico da Igreja Metodista
 * - Methodist dates: Calendário Regional 6ª Região, Cânones 2023
 */

export type SystemEventCategory =
  | "Feriado Nacional"
  | "Data Comemorativa"
  | "Liturgia"
  | "Data Metodista";

export interface SystemCalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: true;
  description: string | null;
  location: null;
  category: SystemEventCategory;
  calendar_context: "sistema";
  user_id: "system";
  created_at: string;
  updated_at: string;
  isSystemEvent: true;
}

// ─── Date Utilities ──────────────────────────────────────────────

/** Compute Easter Sunday (Anonymous Gregorian algorithm) */
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDaysToDate(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/** Get the Nth occurrence of a weekday in a month (0=Sun..6=Sat) */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = makeDate(year, month, 1);
  const firstOccurrence = addDaysToDate(first, (weekday - first.getDay() + 7) % 7);
  return addDaysToDate(firstOccurrence, (n - 1) * 7);
}

/** Advent: 4th Sunday before Dec 25 = Sunday closest to Nov 30 (St. Andrew) */
function computeAdvent1(year: number): Date {
  const nov30 = makeDate(year, 11, 30);
  const dayOfWeek = nov30.getDay();
  // Find nearest Sunday
  if (dayOfWeek <= 3) {
    return addDaysToDate(nov30, -dayOfWeek); // previous Sunday
  }
  return addDaysToDate(nov30, 7 - dayOfWeek); // next Sunday
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00`;
}

function toISOEnd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T23:59:59`;
}

function makeEvent(
  id: string,
  title: string,
  date: Date,
  category: SystemEventCategory,
  description?: string,
): SystemCalendarEvent {
  return {
    id: `sys-${id}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    title,
    start_time: toISO(date),
    end_time: toISOEnd(date),
    all_day: true,
    description: description ?? null,
    location: null,
    category,
    calendar_context: "sistema",
    user_id: "system",
    created_at: toISO(date),
    updated_at: toISO(date),
    isSystemEvent: true,
  };
}

// ─── National Holidays ───────────────────────────────────────────

function getNationalHolidays(year: number): SystemCalendarEvent[] {
  const easter = computeEaster(year);
  const carnaval = addDaysToDate(easter, -47);
  const sextaSanta = addDaysToDate(easter, -2);

  return [
    makeEvent("confraternizacao", "Confraternização Universal", makeDate(year, 1, 1), "Feriado Nacional", "Feriado nacional — 1º de janeiro"),
    makeEvent("carnaval", "Carnaval", carnaval, "Feriado Nacional", "Ponto facultativo nacional"),
    makeEvent("sexta-santa", "Sexta-feira Santa", sextaSanta, "Feriado Nacional", "Paixão de Cristo"),
    makeEvent("tiradentes", "Tiradentes", makeDate(year, 4, 21), "Feriado Nacional", "Feriado nacional — homenagem a Joaquim José da Silva Xavier"),
    makeEvent("trabalho", "Dia do Trabalho", makeDate(year, 5, 1), "Feriado Nacional", "Feriado nacional — 1º de maio"),
    makeEvent("independencia", "Independência do Brasil", makeDate(year, 9, 7), "Feriado Nacional", "Feriado nacional — 7 de setembro"),
    makeEvent("aparecida", "Nossa Senhora Aparecida", makeDate(year, 10, 12), "Feriado Nacional", "Padroeira do Brasil"),
    makeEvent("finados", "Finados", makeDate(year, 11, 2), "Feriado Nacional", "Feriado nacional — Dia de Finados"),
    makeEvent("republica", "Proclamação da República", makeDate(year, 11, 15), "Feriado Nacional", "Feriado nacional — 15 de novembro"),
    makeEvent("consciencia-negra", "Dia da Consciência Negra", makeDate(year, 11, 20), "Feriado Nacional", "Feriado nacional — Lei nº 14.759/2023"),
    makeEvent("natal-feriado", "Natal", makeDate(year, 12, 25), "Feriado Nacional", "Feriado nacional — 25 de dezembro"),
  ];
}

// ─── Commemorative Dates ─────────────────────────────────────────

function getCommemorativeDates(year: number): SystemCalendarEvent[] {
  const easter = computeEaster(year);
  const motherDay = nthWeekday(year, 5, 0, 2); // 2nd Sunday of May
  const fatherDay = nthWeekday(year, 8, 0, 2); // 2nd Sunday of August

  return [
    makeEvent("ano-novo", "Ano Novo", makeDate(year, 1, 1), "Data Comemorativa", "Celebração do Ano Novo"),
    makeEvent("pascoa", "Páscoa", easter, "Data Comemorativa", "Domingo de Páscoa — Ressurreição de Cristo"),
    makeEvent("dia-maes", "Dia das Mães", motherDay, "Data Comemorativa", "Segundo domingo de maio"),
    makeEvent("dia-pais", "Dia dos Pais", fatherDay, "Data Comemorativa", "Segundo domingo de agosto"),
    makeEvent("dia-criancas", "Dia das Crianças", makeDate(year, 10, 12), "Data Comemorativa", "12 de outubro — Dia das Crianças"),
    makeEvent("natal-comemorativo", "Natal", makeDate(year, 12, 25), "Data Comemorativa", "Celebração do nascimento de Jesus Cristo"),
  ];
}

// ─── Liturgical Calendar ─────────────────────────────────────────
// Source: Calendário Litúrgico da Igreja Metodista

function getLiturgicalDates(year: number): SystemCalendarEvent[] {
  const easter = computeEaster(year);
  const advent1 = computeAdvent1(year);
  // Previous year's Advent marks the start, but we show current year's dates
  const advent1Prev = computeAdvent1(year - 1);

  const events: SystemCalendarEvent[] = [];

  // ── Christmas Cycle ──
  // Epifania — January 6
  events.push(makeEvent("epifania", "Epifania do Senhor", makeDate(year, 1, 6), "Liturgia",
    "Manifestação de Cristo às nações. Cor litúrgica: branco."));

  // Batismo do Senhor — 1st Sunday after Jan 6
  const jan6 = makeDate(year, 1, 6);
  const batismoSenhor = addDaysToDate(jan6, (7 - jan6.getDay()) % 7 || 7);
  events.push(makeEvent("batismo-senhor", "Batismo do Senhor", batismoSenhor, "Liturgia",
    "1º Domingo após Epifania. Marca o início do Tempo Comum. Cor litúrgica: branco."));

  // ── Easter Cycle ──
  // Quarta-feira de Cinzas
  const cinzas = addDaysToDate(easter, -46);
  events.push(makeEvent("quarta-cinzas", "Quarta-feira de Cinzas", cinzas, "Liturgia",
    "Início da Quaresma — 40 dias de preparação para a Páscoa. Cor litúrgica: roxo."));

  // Domingo de Ramos
  const ramos = addDaysToDate(easter, -7);
  events.push(makeEvent("domingo-ramos", "Domingo de Ramos", ramos, "Liturgia",
    "Entrada triunfal de Jesus em Jerusalém. Início da Semana Santa. Cor litúrgica: vermelho."));

  // Quinta-feira Santa (Ceia do Senhor e Lava-Pés)
  const quintaSanta = addDaysToDate(easter, -3);
  events.push(makeEvent("quinta-santa", "Quinta-feira Santa", quintaSanta, "Liturgia",
    "Ceia do Senhor e Lava-Pés. Cor litúrgica: branco/roxo."));

  // Domingo de Páscoa (liturgical)
  events.push(makeEvent("pascoa-liturgica", "Domingo de Páscoa", easter, "Liturgia",
    "Ressurreição do Senhor Jesus Cristo. Cor litúrgica: branco/dourado."));

  // Ascensão do Senhor — 40 days after Easter (Thursday)
  const ascensao = addDaysToDate(easter, 39);
  events.push(makeEvent("ascensao", "Ascensão do Senhor", ascensao, "Liturgia",
    "40 dias após a Páscoa. Cor litúrgica: branco."));

  // Pentecostes — 50 days after Easter
  const pentecostes = addDaysToDate(easter, 49);
  events.push(makeEvent("pentecostes", "Pentecostes", pentecostes, "Liturgia",
    "Descida do Espírito Santo. Nascimento da Igreja. Cor litúrgica: vermelho."));

  // Santíssima Trindade — Sunday after Pentecost
  const trindade = addDaysToDate(pentecostes, 7);
  events.push(makeEvent("trindade", "Santíssima Trindade", trindade, "Liturgia",
    "Domingo após Pentecostes. Cor litúrgica: branco."));

  // Cristo Rei — Last Sunday before Advent 1
  const cristoRei = addDaysToDate(advent1, -7);
  events.push(makeEvent("cristo-rei", "Cristo Rei", cristoRei, "Liturgia",
    "Último domingo do ano litúrgico. Cor litúrgica: branco."));

  // Advent Sundays (4 Sundays)
  events.push(makeEvent("advento-1", "1º Domingo do Advento", advent1, "Liturgia",
    "Início do Ano Litúrgico. Esperança. Cor litúrgica: roxo."));
  events.push(makeEvent("advento-2", "2º Domingo do Advento", addDaysToDate(advent1, 7), "Liturgia",
    "Paz. Cor litúrgica: roxo."));
  events.push(makeEvent("advento-3", "3º Domingo do Advento", addDaysToDate(advent1, 14), "Liturgia",
    "Alegria (Gaudete). Cor litúrgica: roxo ou rosa."));
  events.push(makeEvent("advento-4", "4º Domingo do Advento", addDaysToDate(advent1, 21), "Liturgia",
    "Amor. Cor litúrgica: roxo."));

  // Natal litúrgico
  events.push(makeEvent("natal-liturgico", "Natal do Senhor", makeDate(year, 12, 25), "Liturgia",
    "Nascimento de Jesus Cristo. Cor litúrgica: branco/dourado."));

  return events;
}

// ─── Methodist Denominational Dates ──────────────────────────────
// Sources: Calendário Regional 6ª Região, Cânones 2023, tradição metodista

function getMethodistDates(year: number): SystemCalendarEvent[] {
  const events: SystemCalendarEvent[] = [];

  // January — Mudanças Pastorais (pastoral appointment transitions)
  events.push(makeEvent("mudancas-pastorais", "Mês de Mudanças Pastorais", makeDate(year, 1, 1), "Data Metodista",
    "Início do ciclo de novas nomeações pastorais na Igreja Metodista."));

  // March 11 — Dia da Confederação Metodista de Mulheres
  events.push(makeEvent("conf-mulheres", "Dia da Confederação Metodista de Mulheres", makeDate(year, 3, 11), "Data Metodista",
    "Celebração da Confederação Metodista de Mulheres. Fonte: Calendário Regional."));

  // March — Mês da Juventude Metodista
  events.push(makeEvent("juventude-metodista", "Mês da Juventude Metodista", makeDate(year, 3, 1), "Data Metodista",
    "Março é dedicado à juventude na Igreja Metodista. Fonte: Calendário Regional."));

  // May 24 — Dia do Coração Aquecido (Aldersgate Day)
  events.push(makeEvent("coracao-aquecido", "Dia do Coração Aquecido", makeDate(year, 5, 24), "Data Metodista",
    "24 de maio de 1738 — experiência de John Wesley na Rua Aldersgate, Londres. Data fundacional do metodismo. \"Senti meu coração estranhamente aquecido.\""));

  // June — Mês do Discipulado
  events.push(makeEvent("discipulado", "Mês do Discipulado", makeDate(year, 6, 1), "Data Metodista",
    "Junho é dedicado ao discipulado na Igreja Metodista. Fonte: Calendário Regional."));

  // June 28 — Dia de John Wesley (nascimento)
  events.push(makeEvent("john-wesley", "Aniversário de John Wesley", makeDate(year, 6, 28), "Data Metodista",
    "Nascimento de John Wesley (17 de junho de 1703, calendário juliano / 28 de junho gregoriano). Fundador do metodismo."));

  // August — 2nd Sunday: Dia da Pastora e do Pastor
  const diaPastor = nthWeekday(year, 8, 0, 2);
  events.push(makeEvent("dia-pastor", "Dia da Pastora e do Pastor Metodista", diaPastor, "Data Metodista",
    "Segundo domingo de agosto. Celebração da vocação pastoral na Igreja Metodista."));

  // September 2 — Fundação da Igreja Metodista no Brasil (1867)
  events.push(makeEvent("fundacao-metodista-br", "Fundação da Igreja Metodista no Brasil", makeDate(year, 9, 2), "Data Metodista",
    "2 de setembro de 1867 — início da missão metodista permanente no Brasil, com o Rev. Junius E. Newman."));

  // October — Mês Missionário
  events.push(makeEvent("mes-missionario", "Mês Missionário", makeDate(year, 10, 1), "Data Metodista",
    "Outubro é dedicado à vocação missionária na Igreja Metodista."));

  // October — Dia da Reforma (31)
  events.push(makeEvent("dia-reforma", "Dia da Reforma Protestante", makeDate(year, 10, 31), "Data Metodista",
    "31 de outubro de 1517 — Martinho Lutero publica as 95 Teses. Herança reformada compartilhada pelo metodismo."));

  // November — Dia Nacional de Ação de Graças (4th Thursday of November — follows Brazilian tradition)
  const acaoGracas = nthWeekday(year, 11, 4, 4); // 4th Thursday
  events.push(makeEvent("acao-gracas", "Dia de Ação de Graças", acaoGracas, "Data Metodista",
    "Tradição de gratidão cristã. Quarta quinta-feira de novembro."));

  return events;
}

// ─── Public API ──────────────────────────────────────────────────

export function getSystemCalendarEvents(years: number[]): SystemCalendarEvent[] {
  const all: SystemCalendarEvent[] = [];
  for (const year of years) {
    all.push(...getNationalHolidays(year));
    all.push(...getCommemorativeDates(year));
    all.push(...getLiturgicalDates(year));
    all.push(...getMethodistDates(year));
  }
  return all;
}

export function getYearsInRange(start: Date, end: Date): number[] {
  const years: number[] = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    years.push(y);
  }
  return years;
}
