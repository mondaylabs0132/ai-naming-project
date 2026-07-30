import HeroSection from "@/components/home/hero-section";
import NameCarousel from "@/components/home/name-carousel";
import MoodSection from "@/components/home/mood-section";
import FilterSection from "@/components/home/filter-section";
import Footer from "@/components/layout/footer";

import { checkFreeUsage } from "@/lib/free-usage/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Home() {
  const usage = await checkFreeUsage(createAdminClient());

  return (
    <main>
      <HeroSection canUseFreeTrial={usage.ok} />
      <NameCarousel />
      <MoodSection />
      <FilterSection />
      <Footer />
    </main>
  );
}
