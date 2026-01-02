import { AlertTriangle, Clock, TrendingDown, ChartBar } from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "../../hooks/useInView";
import { Container, SectionHeader, IconText, Heading } from "../ui";

const problems = [
  {
    icon: AlertTriangle,
    title: "High Burnout Rates",
    description:
      "Irregular shifts and poor work-life balance lead to 40% staff turnover annually",
  },
  {
    icon: Clock,
    title: "Manual Scheduling Inefficiency",
    description:
      "Managers spend 8+ hours weekly on scheduling, often missing compliance rules",
  },
  {
    icon: TrendingDown,
    title: "Lack of Visibility",
    description:
      "No real-time data on staff wellness, leading to scheduling that worsens fatigue",
  },
  {
    icon: ChartBar,
    title: "Reduced Service Quality",
    description:
      "Fatigued staff make more errors, reducing patient safety and customer satisfaction",
  },
];

export function ProblemSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-16 bg-white">
      <Container>
        <div className="grid lg:grid-cols-[40%_60%] gap-12">
          <div>
            <SectionHeader
              title="The Challenge Healthcare & Hospitality Face"
              centered={false}
            />

            <div className="space-y-6">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <IconText
                    icon={problem.icon}
                    iconSize="sm"
                    iconColor="error"
                    layout="horizontal"
                  >
                    <Heading level="h3" size="sm" className="mb-1">
                      {problem.title}
                    </Heading>
                    <p className="text-[14px] leading-[1.6] text-[#6B7280]">
                      {problem.description}
                    </p>
                  </IconText>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-12 md:p-8">
            <Heading level="h3" size="md" className="mb-6">
              Why This Matters
            </Heading>

            <blockquote className="border-l-4 border-[#2563EB] pl-5 mb-8">
              <p className="text-[16px] italic leading-[1.6] text-[#1F2937]">
                "We were losing nurses due to burnout from poor scheduling. We
                needed a solution that understood both operational needs and
                human factors."
              </p>
              <footer className="text-[14px] mt-2 text-[#6B7280]">
                — Hospital Manager, Dubai
              </footer>
            </blockquote>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-black text-[28px] font-bold">40%</div>
                <div className="text-[#6B7280] text-[12px]">
                  Average annual staff turnover in healthcare
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-black text-[28px] font-bold">65%</div>
                <div className="text-[#6B7280] text-[12px]">
                  Nurses report burnout from shift scheduling
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-black text-[28px] font-bold">8+ hrs</div>
                <div className="text-[#6B7280] text-[12px]">
                  Manager time spent weekly on scheduling
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
