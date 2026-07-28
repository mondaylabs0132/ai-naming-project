import HeroSection from "@/components/home/hero-section";
import NameCarousel from "@/components/home/name-carousel";
import MoodSection from "@/components/home/mood-section";
import FilterSection from "@/components/home/filter-section";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <NameCarousel />
      <MoodSection />
      <FilterSection />
      <Footer />
    </main>
  );
}
