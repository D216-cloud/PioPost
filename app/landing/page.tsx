"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { RealtimeSection } from "@/components/landing/RealtimeSection";
import { CommentAutomationSection } from "@/components/landing/CommentAutomationSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProcessSection />
        <RealtimeSection />
        <CommentAutomationSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
