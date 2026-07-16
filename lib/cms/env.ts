export function hasPayloadDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}
