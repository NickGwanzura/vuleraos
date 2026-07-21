"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Boxes,
  FileText,
  Landmark,
  Receipt,
  ShoppingCart,
  Smartphone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useScrollAnimate } from "@/hooks/use-scroll-animate";

const modules = [
  {
    icon: Receipt,
    title: "Sales & Invoicing",
    description:
      "Raise fiscalised invoices, track payment status, and get paid via cash, bank, or EcoCash — all reconciled automatically.",
  },
  {
    icon: ShoppingCart,
    title: "Buying & Purchase Orders",
    description:
      "Manage suppliers and purchase orders from request to receipt, with landed costs rolled straight into stock valuation.",
  },
  {
    icon: Boxes,
    title: "Stock Management",
    description:
      "Real-time stock levels, FIFO and weighted-average costing, and low-stock alerts across every warehouse and category.",
  },
  {
    icon: Users,
    title: "HR & Payroll",
    description:
      "Employee records, payroll runs, and statutory processing — built around Zimbabwean payroll requirements.",
  },
  {
    icon: Landmark,
    title: "Accounting & Reconciliation",
    description:
      "Payments, aging reports, and bank reconciliation in one place, with an audit trail on every transaction.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description:
      "VAT returns and inflation-adjusted financials generated on demand, so ZIMRA filings stop being a monthly scramble.",
  },
];

const zimFeatures = [
  {
    icon: Banknote,
    title: "Multi-currency, natively",
    description:
      "Trade in USD and ZWG side by side, with official and parallel-market exchange rates tracked on every transaction.",
  },
  {
    icon: BadgeCheck,
    title: "ZIMRA fiscalisation",
    description:
      "Fiscal device integration built in, so every invoice is compliant the moment it's issued.",
  },
  {
    icon: Smartphone,
    title: "Mobile money ready",
    description:
      "Accept and reconcile EcoCash payments alongside cash and bank transfers, without a separate system.",
  },
  {
    icon: FileText,
    title: "Inflation-adjusted reporting",
    description:
      "Financial reports that account for currency volatility, so your numbers still mean something at month-end.",
  },
];

const steps = [
  {
    step: "1",
    title: "Register your business",
    description:
      "Set up your tenant with your BP number, business type, and default currency in under a minute.",
  },
  {
    step: "2",
    title: "Configure stock & currencies",
    description:
      "Add your items, categories, and exchange rates — or import them — so pricing is accurate from day one.",
  },
  {
    step: "3",
    title: "Start invoicing",
    description:
      "Issue fiscalised invoices, receive payments, and let reports, reconciliation, and payroll run themselves.",
  },
];

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimate();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimate();

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const heroRef = useScrollAnimate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">
                V
              </span>
            </div>
            <span className="text-base font-semibold">VuleraOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button nativeButton={false} render={<Link href="/register" />}>
              Register your business
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section
          ref={heroRef.ref}
          className="relative mx-auto max-w-6xl overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-24"
        >
          {/* Background radials */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[400px] w-[600px] rounded-full bg-primary/5 blur-3xl sm:h-[500px] sm:w-[800px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-20 -z-10 mx-auto h-[200px] w-[300px] rounded-full bg-primary/3 blur-2xl"
          />

          <div
            className={`transition-all duration-1000 ease-out ${
              heroRef.isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Unlock your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                business potential
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
              VuleraOS is a modern ERP built for Zimbabwean businesses — sales,
              stock, HR, and accounting in one system, with multi-currency,
              ZIMRA compliance, and mobile money built in from the start.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="shadow-lg shadow-primary/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Register your business
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
                Try the demo
              </Button>
            </div>
          </div>
        </section>

        {/* ─── MODULES ─── */}
        <section className="border-t bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <AnimatedSection>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Everything your business runs on, in one place
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Stop stitching together spreadsheets and disconnected apps.
                  VuleraOS covers the full operating loop of a growing business.
                </p>
              </div>
            </AnimatedSection>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod, i) => (
                <AnimatedCard key={mod.title} delay={i * 100}>
                  <Card className="group/card cursor-default border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                    <CardHeader>
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover/card:scale-110 group-hover/card:bg-primary/15">
                        <mod.icon className="size-4.5 text-primary transition-all duration-300 group-hover/card:scale-110" />
                      </div>
                      <CardTitle className="text-base">{mod.title}</CardTitle>
                      <CardDescription>{mod.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ZIMBABWE FEATURES ─── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <AnimatedSection>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Built for how business actually works here
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Not a foreign ERP with local workarounds bolted on —
                  Zimbabwe&apos;s currency, tax, and payment landscape are the
                  starting point, not an afterthought.
                </p>
              </div>
            </AnimatedSection>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {zimFeatures.map((feature, i) => (
                <AnimatedCard key={feature.title} delay={i * 100}>
                  <div className="group/feature flex gap-4 rounded-xl border border-transparent p-4 transition-all duration-300 hover:border-border/60 hover:bg-muted/30 hover:shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 shadow-sm transition-all duration-300 group-hover/feature:bg-primary/15 group-hover/feature:shadow-md">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <div className="border-l-2 border-transparent pl-4 transition-all duration-300 group-hover/feature:border-primary/40">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="border-t bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <AnimatedSection>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Up and running in three steps
                </h2>
              </div>
            </AnimatedSection>
            <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
              {/* Connecting line (hidden on mobile) */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-6 hidden h-px w-[calc(100%-3rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent sm:block"
              />
              {steps.map((s, i) => (
                <AnimatedCard key={s.step} delay={i * 150}>
                  <div className="relative text-center sm:text-left">
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:scale-110 sm:mx-0">
                      {s.step}
                    </div>
                    <h3 className="mt-4 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="relative py-16 sm:py-24">
          {/* Background gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] to-transparent"
          />
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <AnimatedSection>
              <h2 className="text-3xl font-bold tracking-tight">
                See it running with real data
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Explore a fully seeded demo business — invoices, stock, payroll,
                and reports already in place — no signup required.
              </p>
            </AnimatedSection>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Try the demo
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/register" />}>
                Register your business
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 bg-gradient-to-b from-transparent to-muted/20 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <span className="text-xs font-bold text-primary-foreground">
                V
              </span>
            </div>
            <span>VuleraOS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} VuleraOS. Built for Zimbabwe.</p>
        </div>
      </footer>
    </div>
  );
}
