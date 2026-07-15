"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

const ZIMBABWEAN_BANKS = [
  "CBZ Bank",
  "Stanbic Bank",
  "Nedbank Zimbabwe",
  "FBC Bank",
  "Zanaco",
  "ZABG",
  "NBS Bank",
  "Ecobank Zimbabwe",
  "Standard Chartered Zimbabwe",
  "First Capital Bank",
  "African Century Bank",
  "POSB",
  "Metbank",
  "CABS",
  "Agribank",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    defaultCurrency: "USD",
    bankName: "",
    bankAccount: "",
    bpNumber: "",
  });

  useEffect(() => {
    if (session?.user?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [session, router]);

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultCurrency: form.defaultCurrency,
          bankName: form.bankName,
          bpNumber: form.bpNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to complete setup");
        return;
      }

      await updateSession();
      toast.success("Setup complete! Welcome to VuleraOS.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSkip() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: true }),
      });

      if (!res.ok) throw new Error();

      await updateSession();
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to VuleraOS</CardTitle>
          <CardDescription>
            Let&apos;s get your business set up. This will only take a minute.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleComplete}>
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div
                className={`h-2 w-8 rounded-full ${
                  step >= 1 ? "bg-primary" : "bg-muted"
                }`}
              />
              <div
                className={`h-2 w-8 rounded-full ${
                  step >= 2 ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">Currency Setup</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your default currency. You can always add more and
                    manage exchange rates later.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select
                    value={form.defaultCurrency}
                    onValueChange={(value) =>
                      setForm({ ...form, defaultCurrency: value ?? "USD" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($) — US Dollar</SelectItem>
                      <SelectItem value="ZWG">
                        ZWG (ZiG) — Zimbabwe Gold
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Both USD and ZWG will be available for transactions. This
                    sets the default display currency.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bpNumber">BP / VAT Registration Number</Label>
                  <Input
                    id="bpNumber"
                    placeholder="e.g. BP1234567"
                    value={form.bpNumber}
                    onChange={(e) =>
                      setForm({ ...form, bpNumber: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for ZIMRA-compliant invoicing. You can set this
                    later in Settings.
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Next: Bank Details
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    Bank Account (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your business bank account for payment reconciliation.
                    You can skip this and set it up later.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank</Label>
                  <Select
                    value={form.bankName}
                    onValueChange={(value) =>
                      setForm({ ...form, bankName: value ?? "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZIMBABWEAN_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input
                    id="bankAccount"
                    placeholder="e.g. 1234567890"
                    value={form.bankAccount}
                    onChange={(e) =>
                      setForm({ ...form, bankAccount: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Setting up..." : "Complete Setup"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </form>
        <div className="px-6 pb-6 text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground underline"
            disabled={isLoading}
          >
            Skip setup for now
          </button>
        </div>
      </Card>
    </div>
  );
}
