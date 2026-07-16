export function GET() {
  return Response.json({
    cms: {
      databaseConfigured: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      provider: "payload-postgres"
    },
    ok: true,
    service: "arteffect",
    timestamp: new Date().toISOString()
  });
}
