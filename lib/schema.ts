import { z } from "zod";
import { LENDERS } from "./types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const cents = z.number().int().min(0);

export const MoneySchema = z.object({
  balance: z.number().int(),
  paycheck: cents,
  frequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly"]),
  nextPayday: isoDate,
  rent: cents,
  rentDay: z.number().int().min(1).max(31),
  weeklySpend: cents,
});

export const PlanSchema = z.object({
  id: z.string().min(1),
  lender: z.enum(LENDERS),
  merchant: z.string(),
  installment: cents.min(1),
  paymentsLeft: z.number().int().min(1).max(12),
  nextDue: isoDate,
  intervalDays: z.number().int().min(1).max(31),
  status: z.enum(["active", "returned"]).optional(),
  returnedOn: isoDate.optional(),
});

export const PlusSchema = z.object({
  since: isoDate,
  trialEnds: isoDate,
  via: z.enum(["stripe_test", "demo"]),
});

export const AppStateSchema = z.object({
  version: z.literal(1),
  money: MoneySchema.nullable(),
  plans: z.array(PlanSchema),
  plus: PlusSchema.nullable(),
  sample: z.boolean(),
  // New fields are optional, so data saved before v2 still loads (schema version stays 1).
  limits: z.partialRecord(z.enum(LENDERS), cents).optional(),
});

/** What the AI must return when it reads a confirmation (dollars, not cents). */
export const PlanDraftSchema = z.object({
  lender: z.enum(LENDERS),
  merchant: z.string().max(80).default(""),
  installment: z.number().positive().max(100_000),
  paymentsLeft: z.number().int().min(1).max(12),
  nextDue: isoDate,
});
export type PlanDraft = z.infer<typeof PlanDraftSchema>;
