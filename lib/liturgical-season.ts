/**
 * Liturgical season detection based on the existing system-calendar.ts Easter/Advent logic.
 * Determines the current liturgical season for any given date.
 */

export type LiturgicalSeason =
  | "advento"
  | "natal"
  | "epifania"
  | "quaresma"
  | "semana-santa"
  | "pascoa"
  | "pentecostes"
  | "tempo-comum";

export interface LiturgicalSeasonInfo {
  season: LiturgicalSeason;
  label: string;
  /** Liturgical color name in Portuguese */
  colorName: string;
  /** HSL accent color for themed areas */
  accentHsl: string;
  /** Tailwind-compatible classes for subtle theming */
  bgClass: string;
  textClass: string;
  /** Short spiritual note */
  note: string;
}

// ─── Easter & Advent (same algorithms as system-calendar.ts) ─────

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

function computeAdvent1(year: number): Date {
  const nov30 = new Date(year, 10, 30);
  const dayOfWeek = nov30.getDay();
  if (dayOfWeek <= 3) {
    return addDays(nov30, -dayOfWeek);
  }
  return addDays(nov30, 7 - dayOfWeek);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// ─── Season Detection ────────────────────────────────────────────

export function getCurrentLiturgicalSeason(now: Date = new Date()): LiturgicalSeasonInfo {
  const year = now.getFullYear();
  const today = dateOnly(now);

  const easter = computeEaster(year);
  const advent1 = computeAdvent1(year);
  const prevAdvent1 = computeAdvent1(year - 1);

  // Key dates
  const ashWednesday = dateOnly(addDays(easter, -46));
  const palmSunday = dateOnly(addDays(easter, -7));
  const easterDay = dateOnly(easter);
  const pentecost = dateOnly(addDays(easter, 49));
  const advent1Day = dateOnly(advent1);
  const christmas = dateOnly(new Date(year, 11, 25));
  const epiphany = dateOnly(new Date(year, 0, 6));
  const prevChristmas = dateOnly(new Date(year - 1, 11, 25));
  const prevAdvent = dateOnly(prevAdvent1);

  // Determine season
  let season: LiturgicalSeason;

  if (today >= advent1Day) {
    // After Advent 1 of current year
    if (today >= christmas) {
      season = "natal";
    } else {
      season = "advento";
    }
  } else if (today < epiphany) {
    // Jan 1-5: still Christmas from previous year
    season = "natal";
  } else if (today >= epiphany && today < ashWednesday) {
    // After Epiphany, before Lent — could be Epiphany period or Tempo Comum
    if (today <= dateOnly(new Date(year, 0, 12))) {
      season = "epifania";
    } else {
      season = "tempo-comum";
    }
  } else if (today >= ashWednesday && today < palmSunday) {
    season = "quaresma";
  } else if (today >= palmSunday && today < easterDay) {
    season = "semana-santa";
  } else if (today >= easterDay && today < pentecost) {
    season = "pascoa";
  } else if (today >= pentecost && today < dateOnly(addDays(easter, 56))) {
    season = "pentecostes";
  } else {
    season = "tempo-comum";
  }

  return SEASON_INFO[season];
}

const SEASON_INFO: Record<LiturgicalSeason, LiturgicalSeasonInfo> = {
  advento: {
    season: "advento",
    label: "Advento",
    colorName: "Roxo",
    accentHsl: "270 40% 45%",
    bgClass: "bg-violet-50/60 dark:bg-violet-950/20",
    textClass: "text-violet-700 dark:text-violet-400",
    note: "Tempo de esperança e preparação para o Natal do Senhor.",
  },
  natal: {
    season: "natal",
    label: "Natal",
    colorName: "Branco / Dourado",
    accentHsl: "45 70% 50%",
    bgClass: "bg-amber-50/50 dark:bg-amber-950/15",
    textClass: "text-amber-700 dark:text-amber-400",
    note: "Celebração do nascimento de Jesus Cristo.",
  },
  epifania: {
    season: "epifania",
    label: "Epifania",
    colorName: "Branco",
    accentHsl: "45 60% 52%",
    bgClass: "bg-amber-50/40 dark:bg-amber-950/10",
    textClass: "text-amber-600 dark:text-amber-400",
    note: "Manifestação de Cristo às nações.",
  },
  quaresma: {
    season: "quaresma",
    label: "Quaresma",
    colorName: "Roxo",
    accentHsl: "280 35% 38%",
    bgClass: "bg-purple-50/50 dark:bg-purple-950/20",
    textClass: "text-purple-700 dark:text-purple-400",
    note: "Tempo de reflexão, arrependimento e preparação para a Páscoa.",
  },
  "semana-santa": {
    season: "semana-santa",
    label: "Semana Santa",
    colorName: "Roxo / Vermelho",
    accentHsl: "280 40% 35%",
    bgClass: "bg-purple-50/60 dark:bg-purple-950/25",
    textClass: "text-purple-800 dark:text-purple-400",
    note: "Semana da Paixão de Cristo.",
  },
  pascoa: {
    season: "pascoa",
    label: "Tempo Pascal",
    colorName: "Branco / Dourado",
    accentHsl: "48 65% 52%",
    bgClass: "bg-yellow-50/40 dark:bg-yellow-950/15",
    textClass: "text-yellow-700 dark:text-yellow-500",
    note: "Celebração da Ressurreição do Senhor.",
  },
  pentecostes: {
    season: "pentecostes",
    label: "Pentecostes",
    colorName: "Vermelho",
    accentHsl: "0 60% 45%",
    bgClass: "bg-red-50/40 dark:bg-red-950/15",
    textClass: "text-red-700 dark:text-red-400",
    note: "Descida do Espírito Santo e nascimento da Igreja.",
  },
  "tempo-comum": {
    season: "tempo-comum",
    label: "Tempo Comum",
    colorName: "Verde",
    accentHsl: "150 35% 38%",
    bgClass: "bg-emerald-50/40 dark:bg-emerald-950/15",
    textClass: "text-emerald-700 dark:text-emerald-400",
    note: "Tempo de crescimento na fé e discipulado.",
  },
};
