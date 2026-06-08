const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(', ')}. Verifique seu arquivo .env.local.`
    );
  }
}
