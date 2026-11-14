"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Landing } from "@/components/landing";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { getSampleState } from "@/lib/sample";
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
        save(getSampleState(today));
        router.push("/plans");
      }}
      onStart={() => {
        if (!state) save(emptyState());
        router.push("/plans");
      }}
    />
  );
}
