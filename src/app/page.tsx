import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    if (!user.onboardingCompleted) {
      redirect("/onboarding");
    }
    redirect("/dashboard");
  }

  return <LandingPage />;
}
