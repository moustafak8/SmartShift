import { BrainCog, HeartPulse, Shuffle } from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "../../hooks/useInView";
import { Container, Card, SectionHeader, IconText, Heading } from "../ui";

const pillars = [
  {
    icon: BrainCog,
    title: "AI-Driven Scheduling",
    description: [
      "Optimizes for coverage AND wellness simultaneously",
      "Respects employee preferences and labor laws",
      "Generates schedules in minutes vs. hours",
      "Auto-blocks unfair assignments",
    ],
    features: ["Smart constraints", "Fatigue-aware assignment"],
  },
  {
    icon: HeartPulse,
    title: "Wellness Intelligence",
    description: [
      "AI parses free-form wellness entries into structured data",
      "Tracks sleep, stress, nutrition, and fatigue in real-time",
      "Flags high-risk employees before burnout hits",
      "Sentiment analysis reveals team morale trends",
    ],
    features: ["RAG-powered wellness journal", "Real-time risk scoring"],
  },
  {
    icon: Shuffle,
    title: "Smart Shift Swaps",
    description: [
      "Employees request swaps, AI validates instantly",
      "Checks fatigue impact, staffing, and compliance automatically",
      "Removes manager approval bottleneck",
      "Prevents unsafe scheduling decisions",
    ],
    features: ["Autonomous validation", "Smart matching algorithms"],
  },
];

export function SolutionSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} id="solutions" className="py-20 md:py-16 bg-gray-50">
      <Container>
        <SectionHeader
          title="How SmartShift Solves It"
          description="Three powerful pillars working together"
        />
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="elevated">
                <IconText
                  icon={pillar.icon}
                  iconSize="lg"
                  layout="vertical"
                  contentClassName="space-y-4"
                  className="mb-6"
                >
                  <Heading level="h3" size="md">
                    {pillar.title}
                  </Heading>
                </IconText>

                <ul className="space-y-2 mb-6">
                  {pillar.description.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-[14px] leading-[1.6] text-[#6B7280]"
                    >
                      <span className="text-[#2563EB] mt-1.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-[#E5E7EB]">
                  <p className="text-[#1F2937] text-[12px] font-semibold mb-2">
                    Key Features:
                  </p>
                  <ul className="space-y-1">
                    {pillar.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2 text-[#6B7280] text-[12px]"
                      >
                        <span className="text-[#2563EB]">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
