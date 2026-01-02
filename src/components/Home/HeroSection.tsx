import { motion } from "motion/react";
import pic from "../../assets/Hero.jpg";
import { Container, Card, Button, Heading } from "../ui";

export function HeroSection() {
  return (
    <section className="pt-navbar min-h-screen flex items-center bg-white">
      <Container className="py-20 md:py-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <Heading level="h1" size="xl">
              Transform Your Shift Scheduling. Protect Your Team.
            </Heading>
            <p className="text-[18px] md:text-[16px] leading-[1.6] max-w-[500px] text-[#6B7280]">
              AI-powered scheduling and wellness management platform for
              healthcare and hospitality. Reduce burnout. Optimize coverage.
              Empower your team.
            </p>
            <div className="flex gap-5 flex-wrap">
              <Card variant="bordered" className="min-w-[140px]">
                <div className="text-[24px] font-bold text-[#2563EB]">94%</div>
                <div className="text-[12px] text-[#6B7280]">
                  Coverage achieved
                </div>
              </Card>
              <Card variant="bordered" className="min-w-[140px]">
                <div className="text-[24px] font-bold text-[#2563EB]">
                  42hrs
                </div>
                <div className="text-[12px] text-[#6B7280]">
                  Avg wellness score
                </div>
              </Card>
              <Card variant="bordered" className="min-w-[140px]">
                <div className="text-[24px] font-bold text-[#2563EB]">78%</div>
                <div className="text-[12px] text-[#6B7280]">
                  Preference match
                </div>
              </Card>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button size="md">Start Free Trial</Button>
            </div>

            <div className="pt-8">
              <p className="text-[12px] mb-3 text-[#6B7280]">
                Trusted by 200+ facilities in the MENA region
              </p>
              <div className="flex gap-6 items-center opacity-40">
                <div className="text-[14px] font-semibold text-[#6B7280]">
                  HOSPITAL A
                </div>
                <div className="text-[14px] font-semibold text-[#6B7280]">
                  HOTEL B
                </div>
                <div className="text-[14px] font-semibold text-[#6B7280]">
                  CLINIC C
                </div>
                <div className="text-[14px] font-semibold text-[#6B7280]">
                  GROUP D
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex justify-center items-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <img
                src={pic}
                alt="Healthcare team collaboration"
                className="w-[600px] h-[500px] object-cover rounded-2xl shadow-hero-image"
              />
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
