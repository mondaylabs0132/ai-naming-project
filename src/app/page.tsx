import TopNav from "@/components/top-nav";
import BottomNav from "@/components/bottom-nav";
import HeroSection from "@/components/funnel/hero-section";
import NameCarousel from "@/components/funnel/name-carousel";
import MoodSection from "@/components/funnel/mood-section";
import FilterSection from "@/components/funnel/filter-section";

export default function Home() {
  return (
    <main className="pb-16">
      <TopNav />
      <HeroSection />
      <NameCarousel />
      <MoodSection />
      <FilterSection />
      <BottomNav />
    </main>
  );
}
