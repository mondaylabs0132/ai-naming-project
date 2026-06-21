import HeroSection from "@/components/home/hero-section";
import NameCarousel from "@/components/home/name-carousel";
import MoodSection from "@/components/home/mood-section";
import FilterSection from "@/components/home/filter-section";

export default function Home() {
  return (
    <main className="pb-16">
      <HeroSection />
      <NameCarousel />
      <MoodSection />
      <FilterSection />
    </main>
  );
}
