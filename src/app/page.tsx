import HeroSection from "@/components/home/hero-section";
import NameCarousel from "@/components/home/name-carousel";
import MoodSection from "@/components/home/mood-section";
import FilterSection from "@/components/home/filter-section";
import Footer from "@/components/layout/footer";

// 무료 제한은 랜딩에서 판정하지 않는다. 설문을 채우기도 전에 "횟수를 다 썼다"고
// 막으면 유료 전환 경로까지 함께 닫힌다. 판정은 실제 비용이 드는 지점
// (무료 AI 생성 직전, /naming/generating)에서만 하고, 거기서 결제로 안내한다.
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
