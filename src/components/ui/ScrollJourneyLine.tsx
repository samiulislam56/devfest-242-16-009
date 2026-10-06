import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface ScrollJourneyLineProps {
  lang: Language;
}

export const ScrollJourneyLine: React.FC<ScrollJourneyLineProps> = ({ lang }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(100);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength?.() || 100;
      setPathLength(length);
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;
          const progress = totalHeight > 0 ? Math.min(Math.max(currentScroll / totalHeight, 0), 1) : 0;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkpoints = [
    { percent: 0.0, labelEn: 'Start', labelBn: 'শুরু' },
    { percent: 0.25, labelEn: 'Upload Files', labelBn: 'ফাইল আপলোড' },
    { percent: 0.5, labelEn: '1-to-1 Matching', labelBn: 'ম্যাচিং' },
    { percent: 0.75, labelEn: 'Compliance Check', labelBn: 'যাচাই' },
    { percent: 1.0, labelEn: 'Package Ready', labelBn: 'প্যাকেজ প্রস্তুত' },
  ];

  const strokeDashoffset = pathLength - scrollProgress * pathLength;
  const displayPercent = Math.round(scrollProgress * 100);

  return (
    <div
      className="sticky top-[53px] z-20 w-full bg-surface/90 backdrop-blur-md border-b border-border shadow-xs transition-colors py-2 px-4 lg:px-8 select-none"
      role="progressbar"
      aria-label="Workflow scroll progress journey"
      aria-valuenow={displayPercent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
          <div className="flex items-center gap-1.5 text-accent">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[10px]">
              {lang === 'bn' ? 'কাজের জার্নি ও স্ক্রল অগ্রগতি' : 'Workflow Journey Connector'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              {displayPercent}%
            </span>
          </div>
        </div>

        {/* Dynamic SVG Journey Line Container */}
        <div className="relative w-full h-11 flex flex-col justify-center">
          <svg
            className="w-full h-6 overflow-visible"
            viewBox="0 0 1000 24"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track Guide Path */}
            <path
              d="M 10 12 C 250 4, 350 20, 500 12 C 650 4, 750 20, 990 12"
              stroke="var(--color-border)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Animated Dynamic Foreground Journey Line */}
            <path
              ref={pathRef}
              d="M 10 12 C 250 4, 350 20, 500 12 C 650 4, 750 20, 990 12"
              stroke="url(#journeyGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={pathLength}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 0.08s ease-out',
                filter: scrollProgress > 0.02 ? 'url(#glow)' : undefined,
              }}
            />

            {/* Checkpoint Nodes along the path */}
            {checkpoints.map((cp, idx) => {
              const xPos = 10 + cp.percent * 980;
              const yPos = 12 + Math.sin(cp.percent * Math.PI * 2) * 4;
              const isPassed = scrollProgress >= cp.percent - 0.02;

              return (
                <g key={idx}>
                  {/* Outer Pulsing Halo when active */}
                  {isPassed && (
                    <circle
                      cx={xPos}
                      cy={yPos}
                      r="9"
                      fill="#3b82f6"
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r={isPassed ? '6.5' : '4.5'}
                    fill={isPassed ? '#10b981' : 'var(--color-surface)'}
                    stroke={isPassed ? '#10b981' : 'var(--color-border)'}
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.25s ease' }}
                  />

                  {/* Inner center dot */}
                  {isPassed && (
                    <circle cx={xPos} cy={yPos} r="2" fill="#ffffff" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Text Labels below milestones */}
          <div className="w-full flex justify-between pointer-events-none mt-1 px-1">
            {checkpoints.map((cp, idx) => {
              const isPassed = scrollProgress >= cp.percent - 0.02;
              return (
                <div
                  key={idx}
                  className={`text-[10px] font-medium transition-colors ${
                    isPassed ? 'text-text-primary font-bold' : 'text-text-secondary/70'
                  }`}
                >
                  {lang === 'bn' ? cp.labelBn : cp.labelEn}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
