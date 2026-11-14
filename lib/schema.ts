import { z } from "zod";
import { DISPUTE_ISSUES, LENDERS } from "./types";

/** $10M. Anything bigger is a typo; saving it would make the stored data fail this schema and be dropped. */
export const MAX_CENTS = 1_000_000_000;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const cents = z.number().int().min(0).max(MAX_CENTS);

export const MoneySchema = z.object({
  balance: z.number().int().min(-MAX_CENTS).max(MAX_CENTS),
  paycheck: cents,
  frequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly"]),
  nextPayday: isoDate,
  rent: cents,
  rentDay: z.number().int().min(1).max(31),
  weeklySpend: cents,
  balanceOn: isoDate.optional(),
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
  refundStage: z.enum(["store_refunded"]).optional(),
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

export const DISPUTE_DETAILS_MAX = 600;

/** What /api/dispute accepts. Longer details are refused earlier with "too_large". */
export const DisputeRequestSchema = z.object({
  lender: z.enum(LENDERS),
  // A long store name is cut, not refused: the letter still gets written.
  merchant: z.string().max(1_000).transform((v) => v.trim().slice(0, 80)),
  installment: cents.min(1).max(10_000_000),
  // 0: the plan is paid off, but the lender still charged (double charge, charged after cancel).
  paymentsLeft: z.number().int().min(0).max(12),
  nextDue: isoDate,
  issue: z.enum(DISPUTE_ISSUES),
  // The UI may send null for "not given"; treat it like a missing field.
  returnedOn: isoDate.nullish().transform((v) => v ?? undefined),
  details: z.string().max(DISPUTE_DETAILS_MAX).nullish().transform((v) => v ?? undefined),
  today: isoDate,
});

/** What the AI must return when it drafts a dispute letter. */
export const DisputeLetterSchema = z.object({
  subject: z.string().min(5).max(140),
  body: z.string().min(80).max(3_000),
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
