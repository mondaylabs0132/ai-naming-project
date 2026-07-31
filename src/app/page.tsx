import HeroSection from "@/components/home/hero-section";
import NameCarousel from "@/components/home/name-carousel";
import MoodSection from "@/components/home/mood-section";
import FilterSection from "@/components/home/filter-section";
import Footer from "@/components/layout/footer";

import { checkFreeUsage } from "@/lib/free-usage/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Home() {
  // 무료 제한 조회 실패 시에는 사용자 차단보다 통과를 우선함
  let canUseFreeTrial = true;

  try {
    const usage = await checkFreeUsage(createAdminClient());
    canUseFreeTrial = usage.ok;
  } catch (error) {
    console.error("[home] 무료 사용 제한 확인 실패:", error);
  }

  return (
    <main>
      <HeroSection canUseFreeTrial={canUseFreeTrial} />
      <NameCarousel />
      <MoodSection />
      <FilterSection />
      <Footer />
    </main>
  );
}
