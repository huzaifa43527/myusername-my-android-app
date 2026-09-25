import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  inverted?: boolean;
}

export const SmartTripLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  inverted = false,
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base' },
    md: { icon: 36, text: 'text-lg' },
    lg: { icon: 48, text: 'text-2xl' },
    xl: { icon: 64, text: 'text-3xl' },
  };

  const dim = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SmartTrip Icon: Location Pin + Road + Forward Navigation Arrow */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900 p-1.5 shadow-md shadow-blue-900/20"
        style={{ width: dim.icon, height: dim.icon }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Pin Body */}
          <path
            d="M24 4C14.0589 4 6 12.0589 6 22C6 32.5 20.5 43.5 22.8 45.1C23.5 45.6 24.5 45.6 25.2 45.1C27.5 43.5 42 32.5 42 22C42 12.0589 33.9411 4 24 4Z"
            fill="url(#pinGradient)"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Perspective Road tapering up into distance */}
          <path
            d="M17 32L21.5 19H26.5L31 32H17Z"
            fill="#0F172A"
            opacity="0.85"
          />

          {/* Road center dash marker */}
          <line
            x1="24"
            y1="23"
            x2="24"
            y2="28"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Dynamic Forward Movement Arrow emerging through pin */}
          <path
            d="M24 10L30 19H26V25H22V19H18L24 10Z"
            fill="url(#arrowGradient)"
            className="filter drop-shadow-sm"
          />

          {/* Pulse beacon dot */}
          <circle cx="24" cy="9" r="1.5" fill="#38BDF8" />

          <defs>
            <linearGradient id="pinGradient" x1="6" y1="4" x2="42" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E3A8A" />
              <stop offset="0.6" stopColor="#0F172A" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="arrowGradient" x1="24" y1="10" x2="24" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-bold tracking-tight ${dim.text} ${inverted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            <span>Smart</span>
            <span className="text-cyan-500">Trip</span>
          </div>
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400 mt-0.5">
            Drive · Track · Manage
          </span>
        </div>
      )}
    </div>
  );
};
