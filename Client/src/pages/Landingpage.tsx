import { Navigation } from "../components/Home/Navigation";
import { HeroSection } from "../components/Home/HeroSection";
import { ProblemSection } from "../components/Home/ProblemSection";
import { SolutionSection } from "../components/Home/SolutionSection";
import { HowItWorksSection } from "../components/Home/HowItWorksSection";
import { FeaturesSection } from "../components/Home/FeaturesSection";
import { BenefitsSection } from "../components/Home/BenefitsSection";
import { UseCaseSection } from "../components/Home/UseCaseSection";
import { Footer } from "../components/Home/Footer";
export default function Landingpage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCaseSection />
      <BenefitsSection />
      <Footer />
    </div>
  );
}
