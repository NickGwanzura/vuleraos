import type { Metadata } from "next";
import { CurrencyExposureReport } from "./client";

export const metadata: Metadata = { title: "Currency Exposure" };

export default function CurrencyExposurePage() {
  return <CurrencyExposureReport />;
}
