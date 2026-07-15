"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

const BUSINESS_TYPES = [
  { value: "SOLE_TRADER", label: "Sole Trader" },
  { value: "PBC", label: "Private Business Corporation (PBC)" },
  { value: "PRIVATE_LIMITED", label: "Private Limited Company" },
  { value: "PUBLIC_LIMITED", label: "Public Limited Company" },
  { value: "PARTNERSHIP", label: "Partnership" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    tenantName: "",
    businessType: "",
    bpNumber: "",
  });

  function updateField(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
          tenantName: form.tenantName,
          businessType: form.businessType || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Business registered successfully! Please sign in.");
      router.push("/login");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                V
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl">Register Your Business</CardTitle>
          <CardDescription>
            Set up your VuleraOS account in minutes
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Business Name</Label>
                  <Input
                    id="tenantName"
                    placeholder="e.g. Mbare Traders (Pvt) Ltd"
                    required
                    value={form.tenantName}
                    onChange={(e) => updateField("tenantName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={form.businessType}
                    onValueChange={(value) => updateField("businessType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((bt) => (
                        <SelectItem key={bt.value} value={bt.value}>
                          {bt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bpNumber">BP Number (optional)</Label>
                  <Input
                    id="bpNumber"
                    placeholder="e.g. BP1234567"
                    value={form.bpNumber}
                    onChange={(e) => updateField("bpNumber", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your VAT registration / Business Partner number for ZIMRA
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (!form.tenantName) {
                      toast.error("Business name is required");
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Next: Admin Account
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Tafadzwa Moyo"
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@business.co.zw"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
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
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          {step === 1 && (
            <CardFooter>
              <p className="text-sm text-muted-foreground text-center w-full">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
