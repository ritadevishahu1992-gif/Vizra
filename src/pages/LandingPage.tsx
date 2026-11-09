import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { WhyVizraSection } from '../components/WhyVizraSection';
import { BrandStatement } from '../components/BrandStatement';
import { StudioEngines } from '../components/StudioEngines';
import { VizraComingSoon } from '../components/VizraComingSoon';
import { EarlyAccessForm } from '../components/EarlyAccessForm';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToAI = () => {
    navigate('/ai');
  };

  const handleNavigateToExplore = () => {
    navigate('/explore');
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter selection:bg-[#eb3b2d] selection:text-white relative overflow-x-hidden">
      {/* Top Fixed Navigation */}
      <Navbar onLaunchOmnia={handleNavigateToAI} />

      {/* Main Content Sections */}
      <main>
        {/* Section 1: Hero with Parallax & Omnia Preview */}
        <HeroSection onExplore={handleNavigateToExplore} onLaunchOmnia={handleNavigateToAI} />

        {/* Section 2: Why Vizra - Idea to Finish Pipeline */}
        <WhyVizraSection />

        {/* Section 3: Vizra Philosophy with Scroll-Driven Word Reveal */}
        <BrandStatement />

        {/* Section 4: Studio Engines & Creative Architecture */}
        <StudioEngines onLaunch={handleNavigateToAI} />

        {/* Section 5: Coming Soon & Future Features Roadmap */}
        <VizraComingSoon />

        {/* Section 6: Early Access & Private Beta */}
        <EarlyAccessForm />
      </main>

      {/* Quiet 3-Zone Footer */}
      <Footer />
    </div>
  );
};
