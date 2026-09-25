import React from 'react';
import { useTrip } from '../../context/TripContext';
import { LayoutDashboard, Compass, Fuel, Car, MoreHorizontal } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isTripActive } = useTrip();

  // If active trip is in progress and user is driving, active trip HUD takes center stage,
  // but bottom nav remains visible or accessible so user can navigate if stopped.
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: LayoutDashboard },
    { id: 'trips' as const, label: 'Trips', icon: Compass },
    { id: 'fuel' as const, label: 'Fuel', icon: Fuel },
    { id: 'vehicle' as const, label: 'Vehicle', icon: Car },
    { id: 'more' as const, label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 select-none relative transition-colors ${
                isActive
                  ? 'text-cyan-500 dark:text-cyan-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Active top subtle bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
              )}
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'} />
                {tab.id === 'trips' && isTripActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-1 truncate max-w-full px-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
