import { todayISO } from "@/lib/dates";
import { LlmError, providers } from "@/lib/llm";
import { readPlan } from "@/lib/read-plan";
import type { ReadPlanError, ReadPlanRequest } from "@/lib/types";

// ~1.5 MB of JPEG after shrinkImage; anything bigger is refused, nothing is stored.
const MAX_IMAGE_CHARS = 2_000_000;
const MAX_TEXT_CHARS = 10_000;

// The AI budget is 10 s, stretched to 40 s on the last-resort model (lib/llm.ts); give the function room
// so Vercel never cuts it off first and the UI always gets our JSON error, not a platform 504.
export const maxDuration = 60;

const fail = (code: ReadPlanError, error: string, status: number) => Response.json({ error, code }, { status });

export async function POST(request: Request) {
  let body: ReadPlanRequest;
  try {
    const raw: unknown = await request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("not an object");
    body = raw as ReadPlanRequest;
  } catch {
    return fail("unreadable", "Send JSON: { text } or { imageBase64 }.", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  if (!text && !imageBase64) return fail("unreadable", "Paste the confirmation text or add a screenshot.", 400);
  if (imageBase64.length > MAX_IMAGE_CHARS || text.length > MAX_TEXT_CHARS) {
    return fail("too_large", "That file is too big. Try a smaller screenshot.", 413);
  }
  if (providers().length === 0) {
    return fail("no_keys", "AI reading is off. Enter the plan manually.", 503);
  }

  const today = typeof body.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : todayISO();

  try {
    const plan = await readPlan({ text: text || undefined, imageBase64: imageBase64 || undefined }, today);
    return Response.json({ plan });
  } catch (err) {
    if (err instanceof LlmError && err.code === "timeout") {
      return fail("timeout", "Reading took too long. Enter the plan manually.", 504);
    }
    if (err instanceof LlmError && err.code === "no_keys") {
      return fail("no_keys", "AI reading is off. Enter the plan manually.", 503);
    }
    return fail("unreadable", "We couldn't read a pay-later plan there. Enter it manually.", 422);
  }
}
