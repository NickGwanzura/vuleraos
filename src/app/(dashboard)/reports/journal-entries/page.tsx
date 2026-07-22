import type { Metadata } from "next";
import { JournalEntriesList } from "./client";

export const metadata: Metadata = { title: "Journal Entries" };

export default function JournalEntriesPage() {
  return <JournalEntriesList />;
}
