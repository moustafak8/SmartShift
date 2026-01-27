import { Calendar, BookOpen, Shuffle, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "../../hooks/useInView";
import { Container, SectionHeader, IconText, Heading } from "../ui";
import pic2 from "../../assets/Swap.jpg";
const features = [
  {
    icon: Calendar,
    title: "AI-Powered Schedule Generation",
    description:
      "Generate optimal schedules in minutes, not hours. Our AI considers employee preferences, fatigue levels, availability, and labor law compliance to create balanced, fair schedules.",
    bullets: [
      "Automated schedule generation with one click",
      "Considers employee preferences and availability",
      "Fatigue-aware scheduling prevents burnout",
      "Ensures compliance with labor regulations",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    imagePosition: "left",
  },
  {
    icon: BookOpen,
    title: "RAG-Powered Wellness Journal",
    description:
      "Employees write free-form entries. AI instantly parses sleep, stress, nutrition, and flags critical issues. Manager queries return insights in natural language.",
    bullets: [
      "Free-form text entry (no complex forms)",
      "AI extracts 8+ data points automatically",
      'Natural language queries: "Who got <4h sleep?"',
      "Sentiment analysis tracks team morale",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    imagePosition: "right",
  },
  {
    icon: Shuffle,
    title: "Intelligent Shift Swap System",
    description:
      "Employees request swaps. AI validates 4 constraints instantly: availability, fatigue impact, staffing, labor law compliance. Auto-approves safe swaps.",
    bullets: [
      "Autonomous validation (minutes not hours)",
      "Fatigue-aware (blocks unsafe assignments)",
      "Smart matching suggests optimal partners",
      "Manager override available when needed",
    ],
    imageUrl: pic2,
    imagePosition: "left",
  },
  {
    icon: BarChart3,
    title: "Real-time Schedule Analytics",
    description:
      "Monitor schedule performance with comprehensive analytics. Track coverage, employee satisfaction, and identify optimization opportunities with data-driven insights.",
    bullets: [
      "Real-time schedule coverage monitoring",
      "Employee satisfaction and engagement metrics",
      "Identify scheduling conflicts and gaps",
      "Data-driven optimization recommendations",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    imagePosition: "right",
  },
];

export function FeaturesSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section ref={ref} id="features" className="py-20 md:py-16 bg-gray-50">
      <Container>
        <SectionHeader title="Packed with Powerful Features" />

        {/* Features List */}
        <div className="space-y-20 md:space-y-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${feature.imagePosition === "right" ? "lg:flex-row-reverse" : ""
                }`}
            >
              <div
                className={`${feature.imagePosition === "right" ? "lg:order-2" : ""
                  }`}
              >
                <div className="overflow-hidden rounded-lg shadow-image hover:scale-[1.02] transition-transform duration-300">
                  <img
                    src={feature.imageUrl}
                    alt={feature.title}
                    loading="lazy"
                    className="w-full h-[350px] object-cover"
                  />
                </div>
              </div>

              <div
                className={`${feature.imagePosition === "right" ? "lg:order-1" : ""
                  }`}
              >
                <IconText
                  icon={feature.icon}
                  iconSize="md"
                  layout="vertical"
                  contentClassName="space-y-4"
                >
                  <Heading level="h3" size="md">
                    {feature.title}
                  </Heading>
                  <p className="text-[#6B7280] text-[14px] leading-[1.6]">
                    {feature.description}
                  </p>
                </IconText>

                <ul className="space-y-3 mt-6">
                  {feature.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-3 text-[#6B7280] text-[14px] leading-[1.6]"
                    >
                      <span className="text-[#2563EB] mt-1 flex-shrink-0">
                        •
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
