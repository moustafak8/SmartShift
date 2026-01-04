import { motion } from "motion/react";
import { useInView } from "../../hooks/types/useInView";
import { ArrowDown } from "lucide-react";
import { Container, SectionHeader, Heading } from "../ui";

const steps = [
  {
    number: 1,
    title: "Set Your Team & Preferences",
    description:
      "Upload employee profiles, availability, preferences, and shift templates",
  },
  {
    number: 2,
    title: "AI Generates Optimized Schedule",
    description:
      "Click 'Generate.' AI creates fair, balanced roster respecting wellness and coverage",
  },
  {
    number: 3,
    title: "Teams Submit & Track Wellness",
    description:
      "Employees share wellness entries. AI flags risks. Managers get instant alerts.",
  },
  {
    number: 4,
    title: "Respond & Optimize in Real-Time",
    description:
      "Approve swaps, adjust schedules, and intervene before burnout happens",
  },
];

export function HowItWorksSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-16 bg-white">
      <Container>
        <SectionHeader title="From Chaos to Control in 4 Steps" />

        <div className="max-w-[800px] mx-auto">
          {steps.map((step, index) => (
            <div key={step.number}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-white border-l-4 border-[#2563EB] rounded-lg p-8 mb-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold bg-[#2563EB]">
                    {step.number}
                  </div>

                  <div className="flex-1">
                    <Heading level="h3" size="sm" className="mb-2">
                      {step.title}
                    </Heading>
                    <p className="text-[14px] leading-[1.6] text-[#6B7280]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>

              {index < steps.length - 1 && (
                <div className="flex justify-center my-4">
                  <ArrowDown className="w-6 h-6 text-[#2563EB]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
