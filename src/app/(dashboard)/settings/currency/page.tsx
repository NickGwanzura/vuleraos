import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { CurrencySettings } from "./client";

export default async function CurrencySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rates, currencies] = await Promise.all([
    prisma.exchangeRate.findMany({
      where: { tenantId: user.tenantId },
      include: {
        fromCurrency: { select: { code: true } },
        toCurrency: { select: { code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { effectiveDate: "desc" },
      take: 90,
    }),
    prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    }),
  ]);

  const serializedRates = rates.map((r) => ({
    id: r.id,
    rate: Number(r.rate),
    parallelMarketRate: r.parallelMarketRate ? Number(r.parallelMarketRate) : null,
    effectiveDate: r.effectiveDate.toISOString(),
    isManualOverride: r.isManualOverride,
    notes: r.notes,
    fromCurrency: r.fromCurrency,
    toCurrency: r.toCurrency,
    createdBy: r.createdBy,
  }));

  return <CurrencySettings rates={serializedRates} currencies={currencies} />;
}
