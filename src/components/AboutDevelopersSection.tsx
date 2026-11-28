import React from 'react';
import { ArrowUpRight, Instagram } from 'lucide-react';

interface FounderProfile {
  id: string;
  name: string;
  designation: string;
  identity: string;
  bio: string;
  responsibilities: string[];
  instagram?: {
    handle: string;
    url: string;
  };
}

const FOUNDER_PROFILES: readonly FounderProfile[] = [
  {
    id: 'aditya',
    name: 'Aditya',
    designation: 'Founder',
    identity: 'AI Developer, Product Architect, Creator',
    bio: "Aditya is an AI enthusiast, developer, and creator working at the intersection of artificial intelligence, software engineering, and creative technology. He leads VIZRA's product vision, architecture, AI development, and overall engineering direction.",
    responsibilities: [
      'Product vision and strategy',
      'AI architecture and Omnia development',
      'Frontend and backend engineering',
      'Product design and interface direction',
      'AI research and integration',
      'Technical development and experimentation',
    ],
  },
  {
    id: 'anish',
    name: 'Anish',
    designation: 'Co-Founder',
    identity: 'Development Collaborator',
    bio: "Anish is the Co-Founder of VIZRA and contributes to the platform's development through technical collaboration, identifying and reporting bugs, testing features, and helping develop and improve the overall product.",
    responsibilities: [
      'Identifying and reporting bugs',
      'Feature testing and quality improvement',
      'Development collaboration',
      'Helping implement and improve platform features',
      'Technical feedback and troubleshooting',
    ],
    instagram: {
      handle: '@_anish._exe',
      url: 'https://www.instagram.com/__anish._exe?bqrl=MWl5MnIyd3YxbmRzaQ==',
    },
  },
];

export const AboutDevelopersSection: React.FC = () => {
  return (
    <section
      id="developers"
      aria-labelledby="about-developers-heading"
      className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-neutral-200 dark:border-white/[0.06]"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
        <div className="max-w-2xl space-y-3">
          <div className="typo-eyebrow">About the Developers</div>
          <h2
            id="about-developers-heading"
            className="typo-section-title text-neutral-950 dark:text-white [text-wrap:balance]"
          >
            The People Behind VIZRA
          </h2>
          <p className="typo-body text-neutral-600 dark:text-neutral-400">
            Building a shared vision through technology and innovation.
          </p>
        </div>

        <p className="font-display text-sm sm:text-base font-medium tracking-tight text-neutral-800 dark:text-neutral-200 lg:text-right shrink-0">
          <span className="text-[#EB3B2D]">Two Minds.</span> One Vision. Building VIZRA.
        </p>
      </div>

      {/* Equal-Prominence Founder Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {FOUNDER_PROFILES.map((founder, index) => (
          <article
            key={founder.id}
            className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/[0.08] hover:border-[#EB3B2D]/45 p-7 sm:p-8 lg:p-9 transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <div className="space-y-6">
              {/* Top Editorial Index & Designation Metadata (Unboxed) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono">
                  <span className="text-[#EB3B2D] font-semibold tabular-nums">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-[#EB3B2D] font-semibold tracking-wide">
                    {founder.designation}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-neutral-400 dark:text-neutral-600"
                  >
                    ·
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {founder.identity}
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white group-hover:text-[#EB3B2D] transition-colors duration-200">
                  {founder.name}
                </h3>
              </div>

              {/* Bio */}
              <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-[60ch]">
                {founder.bio}
              </p>

              {/* Responsibilities */}
              <div className="pt-5 border-t border-neutral-200 dark:border-white/[0.06] space-y-3.5">
                <h4 className="text-xs font-mono tracking-wider text-neutral-500 dark:text-neutral-400">
                  Core Responsibilities
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  {founder.responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3 leading-snug">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-px w-2.5 shrink-0 bg-[#EB3B2D]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Verified Social Link Row (Only rendered when verified) */}
            {founder.instagram && (
              <div className="mt-8 pt-5 border-t border-neutral-200 dark:border-white/[0.06]">
                <a
                  href={founder.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${founder.name} on Instagram (${founder.instagram.handle})`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-[#EB3B2D] dark:hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB3B2D] rounded-sm py-1"
                >
                  <Instagram
                    size={15}
                    aria-hidden="true"
                    className="text-[#EB3B2D] shrink-0"
                  />
                  <span>Instagram</span>
                  <span
                    aria-hidden="true"
                    className="text-neutral-400 dark:text-neutral-600"
                  >
                    ·
                  </span>
                  <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                    {founder.instagram.handle}
                  </span>
                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                    className="text-neutral-400 dark:text-neutral-500 shrink-0"
                  />
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
