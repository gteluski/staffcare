// Accent-insensitive, case-insensitive city search utility

export interface CityData {
  name: string;
  state: "SP" | "PR" | "SC";
}

// Normalize string: remove accents and lowercase
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Search cities with accent-insensitive, case-insensitive partial matching
// Prefix matches rank higher than contains matches
export function searchCities(
  cities: CityData[],
  query: string,
  minChars = 3,
  maxResults = 15
): CityData[] {
  if (query.length < minChars) return [];

  const q = normalizeString(query);

  const results: { city: CityData; score: number }[] = [];

  for (const city of cities) {
    const n = normalizeString(city.name);

    if (n.startsWith(q)) {
      results.push({ city, score: 3 }); // prefix
    } else if (n.includes(` ${q}`)) {
      results.push({ city, score: 2 }); // word-start
    } else if (n.includes(q)) {
      results.push({ city, score: 1 }); // contains
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name, "pt-BR"))
    .slice(0, maxResults)
    .map((r) => r.city);
}
