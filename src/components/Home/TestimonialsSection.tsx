import { Star } from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "../../hooks/types/useInView";
import { Container, SectionHeader } from "../ui";

const testimonials = [
  {
    rating: 5,
    quote:
      "SmartShift transformed how we schedule shifts. We went from 8 hours of manual work per week to just clicking 'Generate.' Our nurses are happier too.",
    author: "Fatima Al-Mansoori",
    title: "Nurse Manager, Al Noor Hospital, Abu Dhabi",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop",
  },
  {
    rating: 5,
    quote:
      "We reduced our monthly turnover by 25% in just 6 months. Employees love the fairness and control SmartShift gives them. Worth every penny.",
    author: "Hassan Al-Balushi",
    title: "Operations Manager, Sheraton Dubai",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
  },
  {
    rating: 5,
    quote:
      "The wellness journal feature is incredible. We catch burnout risks before they become critical. Compliance reporting is also a breeze.",
    author: "Dr. Sarah Williams",
    title: "Chief of Staff, St. Joseph's Hospital, Beirut",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop",
  },
  {
    rating: 5,
    quote:
      "As a restaurant group running 8 locations, SmartShift is our competitive advantage. Staff retention improved, customer satisfaction too.",
    author: "Ahmed Khalil",
    title: "Regional Manager, Al-Reef Restaurant Group",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
  },
];

export function TestimonialsSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-16 bg-gray-50">
      <Container>
        <SectionHeader title="Trusted by Leading Healthcare & Hospitality Teams" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg p-8 shadow-card border-t-4 border-[#2563EB]"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]"
                  />
                ))}
              </div>
              <p className="text-[14px] italic leading-[1.6] mb-5 text-[#1F2937]">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-[14px] font-bold text-black">
                    {testimonial.author}
                  </div>
                  <div className="text-[12px] text-[#6B7280]">
                    {testimonial.title}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
