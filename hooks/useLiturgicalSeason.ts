'use client';

import { getCurrentLiturgicalSeason, type LiturgicalSeasonInfo } from "@/lib/liturgical-season";
import { useMemo } from "react";

/** Returns current liturgical season info, memoized per day. */
export function useLiturgicalSeason(): LiturgicalSeasonInfo {
  return useMemo(() => getCurrentLiturgicalSeason(new Date()), [
    // Re-calculate once per day (key changes daily)
    new Date().toDateString(),
  ]);
}
