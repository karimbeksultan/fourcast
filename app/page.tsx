"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Landing } from "@/components/landing";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { getConceptSample, saveRefunds } from "@/lib/concept";
import { emptyState } from "@/lib/storage";

export default function WelcomePage() {
  const router = useRouter();
  const [state, save] = useAppState();
  const today = useToday();
  const due = useQueryParam("due");

  // Calendar reminders link to /?due=YYYY-MM-DD; the check-in lives on /plans.
  useEffect(() => {
    if (due) router.replace(`/plans?due=${encodeURIComponent(due)}`);
  }, [due, router]);

  return (
    <Landing
      hasData={Boolean(state)}
      onSample={() => {
        if (!today) return;
        saveRefunds({ "sample-nordstrom": { stage: "store_refunded", storeRefundedOn: today } });
        save(getConceptSample(today));
        router.push("/tonight");
      }}
      onStart={() => {
        if (!state) save(emptyState());
        router.push("/plans");
      }}
    />
  );
}
