"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SessionPlan } from "@/lib/billing";

interface BillingSettingsCardProps {
  currentPlan: SessionPlan;
}

type BillingCycle = "monthly" | "yearly";

export function BillingSettingsCard({ currentPlan }: BillingSettingsCardProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        body: JSON.stringify({
          billingCycle,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as
        | {
            data: {
              url?: string;
            };
            success: true;
          }
        | {
            error: string;
            success: false;
          };

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data.url) {
        setError("Stripe checkout URL is missing from response.");
        return;
      }

      window.location.assign(result.data.url);
    } catch {
      setError("Could not start checkout. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManage() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const result = (await response.json()) as
        | {
            data: {
              url?: string;
            };
            success: true;
          }
        | {
            error: string;
            success: false;
          };

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.data.url) {
        setError("Stripe portal URL is missing from response.");
        return;
      }

      window.location.assign(result.data.url);
    } catch {
      setError("Could not open billing portal. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Current plan:{" "}
          <span className="font-medium text-foreground">
            {currentPlan === "pro" ? "Pro" : "Free"}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Billing cycle">
        <Button
          onClick={() => setBillingCycle("monthly")}
          size="sm"
          type="button"
          variant={billingCycle === "monthly" ? "default" : "outline"}
        >
          Monthly $8
        </Button>
        <Button
          onClick={() => setBillingCycle("yearly")}
          size="sm"
          type="button"
          variant={billingCycle === "yearly" ? "default" : "outline"}
        >
          Yearly $72
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {currentPlan === "pro" ? (
          <Button
            disabled={isLoading}
            onClick={handleManage}
            type="button"
            variant="outline"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Manage subscription
          </Button>
        ) : (
          <Button disabled={isLoading} onClick={handleUpgrade} type="button">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Upgrade to Pro
          </Button>
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
