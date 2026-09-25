import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import { TripMap } from '../map/TripMap';
import { formatDigitalTimer } from '../../utils/helpers';
import {
  Pause,
  Play,
  Square,
  Radio,
  AlertTriangle,
  Compass,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export const ActiveTripHUD: React.FC = () => {
  const {
    activeVehicle,
    isTripActive,
    isTripPaused,
    currentSpeedKmh,
    currentDistanceKm,
    currentDurationSeconds,
    currentPoints,
    isSimulation,
    gpsSignal,
    pauseTrip,
    resumeTrip,
    endTrip,
    toggleSimulation,
    settings,
  } = useTrip();

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showMapExpanded, setShowMapExpanded] = useState(false);

  if (!isTripActive) return null;

  const currentPoint = currentPoints.length > 0 ? currentPoints[currentPoints.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden pb-safe">
      {/* Top Bar: Vehicle, GPS Status, Safety Notice */}
      <div className="px-4 pt-3 pb-2 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            {activeVehicle.name}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {activeVehicle.licensePlate}
          </span>
        </div>

        {/* GPS Quality badge */}
        <div className="flex items-center gap-2">
          {isSimulation ? (
            <button
              onClick={toggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              title="Click to switch between Simulator and real GPS"
            >
              <Radio size={13} className="animate-pulse" />
              <span>Simulated Drive</span>
            </button>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                gpsSignal === 'strong'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : gpsSignal === 'moderate'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <Compass size={13} />
              <span>
                {gpsSignal === 'strong'
                  ? 'GPS High Accuracy'
                  : gpsSignal === 'moderate'
                  ? 'GPS Standard'
                  : 'Searching GPS...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Banner (encourages eyes on the road) */}
      {settings.safetyMode && (
        <div className="mx-4 my-1 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center gap-2 text-slate-300 text-xs text-center">
          <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
          <span>Drive safely · Avoid interacting with your phone while driving</span>
        </div>
      )}

      {/* Weak GPS warning */}
      {gpsSignal === 'weak' && !isSimulation && (
        <div className="mx-4 mt-1 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <span>GPS signal is weak. Please ensure a clearer view of the sky.</span>
          <button
            onClick={toggleSimulation}
            className="ml-auto underline font-medium text-cyan-300 shrink-0"
          >
            Use Simulator
          </button>
        </div>
      )}

      {/* Main Glanceable HUD: Big Speedometer, Distance, Trip Time */}
      <div className="flex-1 flex flex-col justify-center px-4 max-w-md mx-auto w-full">
        {/* Speed Section: Prominent, Big, Highly Readable */}
        <div className="text-center my-3 relative">
          <div className="flex items-baseline justify-center">
            <span className="font-extrabold text-7xl sm:text-8xl tracking-tight text-white font-mono tabular-nums leading-none">
              {currentSpeedKmh}
            </span>
            <span className="text-xl sm:text-2xl font-semibold text-cyan-400 ml-2">
              {settings.unitDistance === 'mi' ? 'mph' : 'km/h'}
            </span>
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-1">
            Current Speed
          </p>

          {isTripPaused && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
              <Pause size={12} />
              <span>TRIP PAUSED</span>
            </div>
          )}
        </div>

        {/* 2-Column Metrics: Distance & Trip Time */}
        <div className="grid grid-cols-2 gap-3 my-3">
          {/* Distance */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
            <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white tracking-tight">
              {currentDistanceKm.toFixed(1)}
              <span className="text-sm font-semibold text-slate-400 ml-1">
                {settings.unitDistance}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mt-1">
              Distance
            </span>
          </div>

          {/* Trip Time */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
            <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white tracking-tight">
              {formatDigitalTimer(currentDurationSeconds)}
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mt-1">
              Trip Time
            </span>
          </div>
        </div>

        {/* Live Route Map (Compact preview underneath as per spec #8) */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner my-2 flex-1 min-h-[160px] max-h-[260px]">
          <TripMap
            points={currentPoints}
            currentPoint={currentPoint}
            isLive={true}
            interactive={true}
            darkMode={true}
            height="100%"
          />
          <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Live Route</span>
          </div>
        </div>
      </div>

      {/* Bottom Large Touch Controls (Spec #8 & #10: PAUSE / RESUME, END TRIP) */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800/80 max-w-md mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {/* Pause / Resume Button */}
          {isTripPaused ? (
            <button
              onClick={resumeTrip}
              className="min-h-[56px] px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-900/30 active:scale-[0.98] transition-all"
            >
              <Play size={22} className="fill-white" />
              <span>RESUME</span>
            </button>
          ) : (
            <button
              onClick={pauseTrip}
              className="min-h-[56px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-base flex items-center justify-center gap-2.5 border border-slate-700 active:scale-[0.98] transition-all"
            >
              <Pause size={22} />
              <span>PAUSE</span>
            </button>
          )}

          {/* End Trip Button */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="min-h-[56px] px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-rose-950/40 active:scale-[0.98] transition-all"
          >
            <Square size={20} className="fill-white" />
            <span>END TRIP</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal to avoid accidental ending */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Square size={26} className="fill-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">End This Trip?</h3>
            <p className="text-sm text-slate-300 mb-6">
              You will finish tracking your journey of{' '}
              <strong className="text-white font-mono">{currentDistanceKm.toFixed(1)} km</strong>{' '}
              and view your complete trip summary.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  endTrip();
                }}
                className="w-full min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-md active:scale-98 transition-all"
              >
                Yes, End Trip
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="w-full min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center active:scale-98 transition-all"
              >
                Continue Traveling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
