import type { Metadata } from "next";
import { JournalEntryDetail } from "./client";

export const metadata: Metadata = { title: "Journal Entry" };

export default async function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JournalEntryDetail id={id} />;
}
