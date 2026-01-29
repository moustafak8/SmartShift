import { Mail, MapPin, Linkedin, Twitter } from "lucide-react";
import { Container, Heading, IconText } from "../ui";
import logo2 from "../../assets/logo2.png";

export function Footer() {
  return (
    <footer id="footer" className="text-white bg-[#1F2937]">
      <Container className="py-12 md:py-10">
        <div className="grid md:grid-cols-2 gap-12 mb-8">
          <div>
            <div className="flex items-center mb-5 -ml-1">
              <img
                src={logo2}
                alt="SmartShift logo"
                className="h-15 w-15 object-contain"
                draggable={false}
              />
              <span className="-ml-2 text-white text-[20px] font-bold">
                SmartShift
              </span>
            </div>
            <p className="text-[14px] leading-[1.6] mb-6 text-[#D1D5DB]">
              Employee wellness and shift scheduling for healthcare and
              hospitality. Empowering teams with intelligent scheduling and
              wellness tracking.
            </p>
            <div className="flex gap-4 mb-6">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#2563EB] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#2563EB] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="md:pl-12">
            <Heading level="h4" size="sm" className="text-white mb-6">
              Get in Touch
            </Heading>
            <div className="space-y-4">
              <IconText
                icon={Mail}
                iconSize="sm"
                layout="horizontal"
                iconClassName="mt-0.5"
              >
                <p className="text-[14px] text-[#D1D5DB]">Email us at</p>
                <a
                  href="mailto:contact@smartshift.com"
                  className="text-white text-[14px] hover:text-[#2563EB] transition-colors"
                >
                  contact@smartshift.com
                </a>
              </IconText>
              <IconText
                icon={MapPin}
                iconSize="sm"
                layout="horizontal"
                iconClassName="mt-0.5"
              >
                <p className="text-[14px] text-[#D1D5DB]">Location</p>
                <p className="text-white text-[14px]">Beirut, Lebanon</p>
              </IconText>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 border-t border-[rgba(255,255,255,0.1)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-[#D1D5DB]">
            © 2026 SmartShift. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
