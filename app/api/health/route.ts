import { connection } from "next/server";
import { providerStatus } from "@/lib/llm";

// Smoke check after deploy: the app is up and which AI providers are configured.
// Only true/false, never a key.
export async function GET() {
  await connection(); // read env at request time, not at build time
  return Response.json({ ok: true, providers: providerStatus() });
}
