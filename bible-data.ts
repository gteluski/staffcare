// Bible book structure for navigation — no copyrighted content
export interface BibleBook {
  id: string;
  name: string;
  abbr: string;
  chapters: number;
  testament: "AT" | "NT";
  /** English name for API calls */
  apiName: string;
}

export interface BibleVersion {
  id: string;
  name: string;
  abbr: string;
  /** Whether real text is currently available */
  available: boolean;
  /** API translation key (for bible-api.com) */
  apiKey?: string;
  /** Licensing note shown when not available */
  licenseNote?: string;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "arc", name: "Almeida Revista e Corrigida", abbr: "ARC", available: true, apiKey: "almeida" },
  { id: "ara", name: "Almeida Revista e Atualizada", abbr: "ARA", available: false, licenseNote: "Pendente de licenciamento pela Sociedade Bíblica do Brasil." },
  { id: "naa", name: "Nova Almeida Atualizada", abbr: "NAA", available: false, licenseNote: "Pendente de licenciamento pela Sociedade Bíblica do Brasil." },
  { id: "nvi", name: "Nova Versão Internacional", abbr: "NVI", available: false, licenseNote: "Pendente de licenciamento pela Biblica Brasil." },
  { id: "ntlh", name: "Nova Tradução na Linguagem de Hoje", abbr: "NTLH", available: false, licenseNote: "Pendente de licenciamento pela Sociedade Bíblica do Brasil." },
  { id: "nvt", name: "Nova Versão Transformadora", abbr: "NVT", available: false, licenseNote: "Pendente de licenciamento pela Editora Mundo Cristão." },
  { id: "kjp", name: "King James Português Brasil", abbr: "KJP", available: false, licenseNote: "Pendente de integração com fonte aprovada." },
];

export const BIBLE_BOOKS: BibleBook[] = [
  // Antigo Testamento
  { id: "gn", name: "Gênesis", abbr: "Gn", chapters: 50, testament: "AT", apiName: "Genesis" },
  { id: "ex", name: "Êxodo", abbr: "Êx", chapters: 40, testament: "AT", apiName: "Exodus" },
  { id: "lv", name: "Levítico", abbr: "Lv", chapters: 27, testament: "AT", apiName: "Leviticus" },
  { id: "nm", name: "Números", abbr: "Nm", chapters: 36, testament: "AT", apiName: "Numbers" },
  { id: "dt", name: "Deuteronômio", abbr: "Dt", chapters: 34, testament: "AT", apiName: "Deuteronomy" },
  { id: "js", name: "Josué", abbr: "Js", chapters: 24, testament: "AT", apiName: "Joshua" },
  { id: "jz", name: "Juízes", abbr: "Jz", chapters: 21, testament: "AT", apiName: "Judges" },
  { id: "rt", name: "Rute", abbr: "Rt", chapters: 4, testament: "AT", apiName: "Ruth" },
  { id: "1sm", name: "1 Samuel", abbr: "1Sm", chapters: 31, testament: "AT", apiName: "1 Samuel" },
  { id: "2sm", name: "2 Samuel", abbr: "2Sm", chapters: 24, testament: "AT", apiName: "2 Samuel" },
  { id: "1rs", name: "1 Reis", abbr: "1Rs", chapters: 22, testament: "AT", apiName: "1 Kings" },
  { id: "2rs", name: "2 Reis", abbr: "2Rs", chapters: 25, testament: "AT", apiName: "2 Kings" },
  { id: "1cr", name: "1 Crônicas", abbr: "1Cr", chapters: 29, testament: "AT", apiName: "1 Chronicles" },
  { id: "2cr", name: "2 Crônicas", abbr: "2Cr", chapters: 36, testament: "AT", apiName: "2 Chronicles" },
  { id: "ed", name: "Esdras", abbr: "Ed", chapters: 10, testament: "AT", apiName: "Ezra" },
  { id: "ne", name: "Neemias", abbr: "Ne", chapters: 13, testament: "AT", apiName: "Nehemiah" },
  { id: "et", name: "Ester", abbr: "Et", chapters: 10, testament: "AT", apiName: "Esther" },
  { id: "jo", name: "Jó", abbr: "Jó", chapters: 42, testament: "AT", apiName: "Job" },
  { id: "sl", name: "Salmos", abbr: "Sl", chapters: 150, testament: "AT", apiName: "Psalms" },
  { id: "pv", name: "Provérbios", abbr: "Pv", chapters: 31, testament: "AT", apiName: "Proverbs" },
  { id: "ec", name: "Eclesiastes", abbr: "Ec", chapters: 12, testament: "AT", apiName: "Ecclesiastes" },
  { id: "ct", name: "Cânticos", abbr: "Ct", chapters: 8, testament: "AT", apiName: "Song of Solomon" },
  { id: "is", name: "Isaías", abbr: "Is", chapters: 66, testament: "AT", apiName: "Isaiah" },
  { id: "jr", name: "Jeremias", abbr: "Jr", chapters: 52, testament: "AT", apiName: "Jeremiah" },
  { id: "lm", name: "Lamentações", abbr: "Lm", chapters: 5, testament: "AT", apiName: "Lamentations" },
  { id: "ez", name: "Ezequiel", abbr: "Ez", chapters: 48, testament: "AT", apiName: "Ezekiel" },
  { id: "dn", name: "Daniel", abbr: "Dn", chapters: 12, testament: "AT", apiName: "Daniel" },
  { id: "os", name: "Oséias", abbr: "Os", chapters: 14, testament: "AT", apiName: "Hosea" },
  { id: "jl", name: "Joel", abbr: "Jl", chapters: 3, testament: "AT", apiName: "Joel" },
  { id: "am", name: "Amós", abbr: "Am", chapters: 9, testament: "AT", apiName: "Amos" },
  { id: "ob", name: "Obadias", abbr: "Ob", chapters: 1, testament: "AT", apiName: "Obadiah" },
  { id: "jn", name: "Jonas", abbr: "Jn", chapters: 4, testament: "AT", apiName: "Jonah" },
  { id: "mq", name: "Miquéias", abbr: "Mq", chapters: 7, testament: "AT", apiName: "Micah" },
  { id: "na", name: "Naum", abbr: "Na", chapters: 3, testament: "AT", apiName: "Nahum" },
  { id: "hc", name: "Habacuque", abbr: "Hc", chapters: 3, testament: "AT", apiName: "Habakkuk" },
  { id: "sf", name: "Sofonias", abbr: "Sf", chapters: 3, testament: "AT", apiName: "Zephaniah" },
  { id: "ag", name: "Ageu", abbr: "Ag", chapters: 2, testament: "AT", apiName: "Haggai" },
  { id: "zc", name: "Zacarias", abbr: "Zc", chapters: 14, testament: "AT", apiName: "Zechariah" },
  { id: "ml", name: "Malaquias", abbr: "Ml", chapters: 4, testament: "AT", apiName: "Malachi" },
  // Novo Testamento
  { id: "mt", name: "Mateus", abbr: "Mt", chapters: 28, testament: "NT", apiName: "Matthew" },
  { id: "mc", name: "Marcos", abbr: "Mc", chapters: 16, testament: "NT", apiName: "Mark" },
  { id: "lc", name: "Lucas", abbr: "Lc", chapters: 24, testament: "NT", apiName: "Luke" },
  { id: "joo", name: "João", abbr: "Jo", chapters: 21, testament: "NT", apiName: "John" },
  { id: "at", name: "Atos", abbr: "At", chapters: 28, testament: "NT", apiName: "Acts" },
  { id: "rm", name: "Romanos", abbr: "Rm", chapters: 16, testament: "NT", apiName: "Romans" },
  { id: "1co", name: "1 Coríntios", abbr: "1Co", chapters: 16, testament: "NT", apiName: "1 Corinthians" },
  { id: "2co", name: "2 Coríntios", abbr: "2Co", chapters: 13, testament: "NT", apiName: "2 Corinthians" },
  { id: "gl", name: "Gálatas", abbr: "Gl", chapters: 6, testament: "NT", apiName: "Galatians" },
  { id: "ef", name: "Efésios", abbr: "Ef", chapters: 6, testament: "NT", apiName: "Ephesians" },
  { id: "fp", name: "Filipenses", abbr: "Fp", chapters: 4, testament: "NT", apiName: "Philippians" },
  { id: "cl", name: "Colossenses", abbr: "Cl", chapters: 4, testament: "NT", apiName: "Colossians" },
  { id: "1ts", name: "1 Tessalonicenses", abbr: "1Ts", chapters: 5, testament: "NT", apiName: "1 Thessalonians" },
  { id: "2ts", name: "2 Tessalonicenses", abbr: "2Ts", chapters: 3, testament: "NT", apiName: "2 Thessalonians" },
  { id: "1tm", name: "1 Timóteo", abbr: "1Tm", chapters: 6, testament: "NT", apiName: "1 Timothy" },
  { id: "2tm", name: "2 Timóteo", abbr: "2Tm", chapters: 4, testament: "NT", apiName: "2 Timothy" },
  { id: "tt", name: "Tito", abbr: "Tt", chapters: 3, testament: "NT", apiName: "Titus" },
  { id: "fm", name: "Filemom", abbr: "Fm", chapters: 1, testament: "NT", apiName: "Philemon" },
  { id: "hb", name: "Hebreus", abbr: "Hb", chapters: 13, testament: "NT", apiName: "Hebrews" },
  { id: "tg", name: "Tiago", abbr: "Tg", chapters: 5, testament: "NT", apiName: "James" },
  { id: "1pe", name: "1 Pedro", abbr: "1Pe", chapters: 5, testament: "NT", apiName: "1 Peter" },
  { id: "2pe", name: "2 Pedro", abbr: "2Pe", chapters: 3, testament: "NT", apiName: "2 Peter" },
  { id: "1jo", name: "1 João", abbr: "1Jo", chapters: 5, testament: "NT", apiName: "1 John" },
  { id: "2jo", name: "2 João", abbr: "2Jo", chapters: 1, testament: "NT", apiName: "2 John" },
  { id: "3jo", name: "3 João", abbr: "3Jo", chapters: 1, testament: "NT", apiName: "3 John" },
  { id: "jd", name: "Judas", abbr: "Jd", chapters: 1, testament: "NT", apiName: "Jude" },
  { id: "ap", name: "Apocalipse", abbr: "Ap", chapters: 22, testament: "NT", apiName: "Revelation" },
];
