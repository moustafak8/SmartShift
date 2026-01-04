import { motion } from "motion/react";
import { useInView } from "../../hooks/types/useInView";
import { Container, Button, Heading } from "../ui";

export function FinalCTASection() {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      className="py-20 md:py-16 bg-gradient-to-b from-white to-blue-50/30"
    >
      <Container className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Heading level="h2" size="xl" className="mb-5">
            Ready to Transform Your Scheduling?
          </Heading>

          <p className="text-[16px] max-w-[600px] mx-auto mb-10 text-[#6B7280]">
            Join 200+ facilities across the MENA region. Start your free 14-day
            trial today.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-5">
            <Button size="md" variant="primary">
              Start Free Trial
            </Button>
            <Button size="md" variant="secondary">
              Book a Demo
            </Button>
          </div>

          <p className="text-[12px] text-[#6B7280]">
            No credit card required. Full access to all features.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
