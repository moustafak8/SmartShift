import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useInView } from "../../hooks/types/useInView";
import { Container, Button, SectionHeader, Heading } from "../ui";
import pic1 from "../../assets/Healthcare.jpeg";
import pic2 from "../../assets/Hotel.jpeg";
import pic3 from "../../assets/Restaurant.jpeg";

const useCases = {
  healthcare: {
    title: "For Healthcare Facilities",
    description:
      "Hospitals and clinics face critical staffing challenges. SmartShift reduces nurse burnout by 35% while maintaining patient safety.",
    challenge:
      "Irregular rotating shifts + 12-hour shifts + chronic understaffing = burnout crisis",
    solutions: [
      "Optimize schedules around fatigue, not just coverage",
      "Real-time wellness tracking flags at-risk nurses",
      "Reduce consecutive night shifts automatically",
      "Ensure compliance with healthcare labor laws",
    ],
    imageUrl: pic1,
  },
  hotels: {
    title: "For Hotel Operations",
    description:
      "Hotel managers juggle front desk, housekeeping, and F&B teams across shifts. SmartShift ensures 24/7 excellence without sacrificing staff well-being.",
    challenge:
      "Guest expectations 24/7 + high-touch service = demanding schedules and low retention",
    solutions: [
      "Balance service quality with fair scheduling",
      "Cross-department scheduling optimization",
      "Track team morale through wellness entries",
      "Reduce 6-month staff turnover (industry avg: 45%)",
    ],
    imageUrl: pic2,
  },
  restaurants: {
    title: "For Restaurants & Chains",
    description:
      "Restaurant managers struggle with split shifts, call-outs, and stressed staff. SmartShift creates stable schedules that reduce no-shows and stress.",
    challenge:
      "Split shifts + unpredictable volume + high turnover = unsustainable operations",
    solutions: [
      "Intelligent scheduling around predicted demand",
      "Autonomy for staff (swap shifts freely)",
      "Reduce call-outs with fair, predictable schedules",
      "Track team stress and address burnout early",
    ],
    imageUrl: pic3,
  },
};

export function UseCaseSection() {
  const [activeTab, setActiveTab] =
    useState<keyof typeof useCases>("healthcare");
  const { ref } = useInView({ threshold: 0.1 });

  const tabs = [
    { key: "healthcare" as const, label: "Healthcare" },
    { key: "hotels" as const, label: "Hotels" },
    { key: "restaurants" as const, label: "Restaurants" },
  ];

  return (
    <section ref={ref} id="healthcare" className="py-20 md:py-16 bg-gray-50">
      <Container>
        <SectionHeader
          title="Built for Your Industry"
          description="Whether you run a hospital, hotel, or restaurant, SmartShift adapts to your needs"
        />

        <div className="flex justify-center mb-12 border-b border-[#E5E7EB]">
          <div className="flex gap-2 md:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-[14px] font-bold transition-all ${
                  activeTab === tab.key
                    ? "text-black border-b-[3px] border-[#2563EB]"
                    : "text-[#6B7280] hover:bg-blue-50/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <img
                src={useCases[activeTab].imageUrl}
                alt={useCases[activeTab].title}
                className="w-full h-[300px] object-cover rounded-lg shadow-image"
              />
            </div>

            <div>
              <Heading level="h3" size="lg" className="mb-4">
                {useCases[activeTab].title}
              </Heading>

              <p className="text-[#6B7280] text-[14px] leading-[1.6] mb-6">
                {useCases[activeTab].description}
              </p>

              <div className="bg-[#F3F4F6] border-l-4 border-[#2563EB] p-5 mb-6">
                <p className="text-[#1F2937] text-[14px] font-semibold mb-1">
                  The Challenge
                </p>
                <p className="text-[#6B7280] text-[14px]">
                  {useCases[activeTab].challenge}
                </p>
              </div>

              <div>
                <p className="text-[#1F2937] text-[14px] font-semibold mb-3">
                  SmartShift Solution
                </p>
                <ul className="space-y-2">
                  {useCases[activeTab].solutions.map((solution) => (
                    <li
                      key={solution}
                      className="flex gap-3 text-[#6B7280] text-[14px] leading-[1.6]"
                    >
                      <span className="text-[#2563EB] mt-1 flex-shrink-0">
                        •
                      </span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button size="sm" className="mt-8">
                Register For a {tabs.find((t) => t.key === activeTab)?.label}{" "}
                Demo
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}
