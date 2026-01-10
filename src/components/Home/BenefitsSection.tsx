import {
  Smile,
  Clock,
  Target,
  Shield,
  ChartBar,
  Handshake,
} from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "../../hooks/useInView";
import { Container, SectionHeader, IconText, Heading } from "../ui";

const benefits = [
  {
    icon: Smile,
    title: "Reduced Burnout & Turnover",
    description:
      "Fair scheduling and wellness monitoring reduce burnout by an average of 35%. Keep your best people.",
    metric: "35% reduction in reported burnout",
    subtext: "Based on 6-month pilot data",
  },
  {
    icon: Clock,
    title: "8+ Hours Saved Weekly",
    description:
      "Automate schedule generation and shift validation. Spend your time on strategy, not spreadsheets.",
    metric: "8.5 hours saved per manager/week",
    subtext: "Average across pilot facilities",
  },
  {
    icon: Target,
    title: "Optimal Shift Coverage",
    description:
      "Smarter scheduling respects preferences while maintaining high coverage. No more understaffing.",
    metric: "94% coverage achieved",
    subtext: "vs. 82% manual scheduling average",
  },
  {
    icon: Shield,
    title: "Ensure Labor Law Compliance",
    description:
      "Built-in compliance checks. Automatic adherence to max hours, rest periods, and local regulations.",
    metric: "100% compliance tracked",
    subtext: "Automatic violation detection",
  },
  {
    icon: ChartBar,
    title: "Data-Driven Insights",
    description:
      "Real-time dashboards and AI-generated reports. Make decisions based on data, not gut feeling.",
    metric: "Weekly AI insights",
    subtext: "Actionable recommendations automatically",
  },
  {
    icon: Handshake,
    title: "Empower Your Workforce",
    description:
      "Employees control their preferences. Swap shifts autonomously. Transparent wellness tracking builds trust.",
    metric: "Improved employee satisfaction",
    subtext: "Greater autonomy and transparency",
  },
];

export function BenefitsSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-16 bg-white">
      <Container>
        <SectionHeader title="Benefits Your Team Will Feel Immediately" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-blue-50 rounded-xl p-10 hover:translate-y-[-4px] hover:shadow-lg transition-all border-b-4 border-transparent hover:border-[#2563EB]"
            >
              <IconText
                icon={benefit.icon}
                iconSize="lg"
                layout="vertical"
                contentClassName="space-y-3"
                className="mb-4"
              >
                <Heading level="h3" size="md">
                  {benefit.title}
                </Heading>

                <p className="text-[#6B7280] text-[14px] leading-[1.6]">
                  {benefit.description}
                </p>
              </IconText>

              <div className="mt-6 pt-4 border-t border-[#2563EB]/20">
                <div className="text-[#2563EB] text-[16px] font-bold mb-1">
                  {benefit.metric}
                </div>
                <div className="text-[#6B7280] text-[12px]">
                  {benefit.subtext}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
