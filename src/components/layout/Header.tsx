import React from 'react';
import { useTrip } from '../../context/TripContext';
import { SmartTripLogo } from '../common/SmartTripLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { Sun, Moon, Laptop, Navigation2, Car, Radio } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    vehicles,
    activeVehicle,
    setDefaultVehicle,
    settings,
    updateSettings,
    isTripActive,
    gpsSignal,
    isSimulation,
    toggleSimulation,
  } = useTrip();

  const cycleTheme = () => {
    if (settings.theme === 'system') updateSettings({ theme: 'light' });
    else if (settings.theme === 'light') updateSettings({ theme: 'dark' });
    else updateSettings({ theme: 'system' });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark / Logo */}
        <div className="flex items-center gap-3">
          <SmartTripLogo size="md" />
        </div>

        {/* Zone 2: Contextual Status / Active Vehicle */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Vehicle selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
            <Car size={15} className="text-cyan-500" />
            <select
              value={activeVehicle.id}
              onChange={(e) => setDefaultVehicle(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer font-medium text-slate-800 dark:text-slate-200 pr-1"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {v.name} ({v.licensePlate})
                </option>
              ))}
            </select>
          </div>

          {/* Active Trip Indicator if running */}
          {isTripActive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Trip Running</span>
            </div>
          )}
        </div>

        {/* Zone 3: Actions & Quick Toggles */}
        <div className="flex items-center gap-2">
          {/* PWA Direct In-App Install Button */}
          <PWAInstallButton />

          {/* If trip active: Simulation toggle button */}
          {isTripActive && (
            <button
              onClick={toggleSimulation}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSimulation
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Toggle Drive Simulator mode for desktop testing"
            >
              <Radio size={14} className={isSimulation ? 'animate-pulse text-cyan-500' : ''} />
              <span className="hidden xs:inline">{isSimulation ? 'Simulating' : 'Simulate'}</span>
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            aria-label="Toggle Theme"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Current theme: ${settings.theme}. Click to switch.`}
          >
            {settings.theme === 'light' && <Sun size={19} className="text-amber-500" />}
            {settings.theme === 'dark' && <Moon size={19} className="text-cyan-400" />}
            {settings.theme === 'system' && <Laptop size={19} className="text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
