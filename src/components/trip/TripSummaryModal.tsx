import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useTrip } from '../../context/TripContext';
import { TripMap } from '../map/TripMap';
import { formatDurationHuman } from '../../utils/helpers';
import { TripCategory } from '../../types';
import {
  CheckCircle2,
  Clock,
  Gauge,
  Zap,
  MapPin,
  Car,
  Tag,
  FileText,
  Save,
  Trash2,
} from 'lucide-react';

export const TripSummaryModal: React.FC = () => {
  const {
    pendingSummaryTrip,
    saveSummaryTrip,
    discardSummaryTrip,
    vehicles,
    savedLocations,
    settings,
  } = useTrip();

  const [routeStart, setRouteStart] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TripCategory>('Commute');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (pendingSummaryTrip) {
      setRouteStart(pendingSummaryTrip.startLocationName || 'Home');
      setRouteEnd(pendingSummaryTrip.endLocationName || 'Office');
      setSelectedVehicleId(pendingSummaryTrip.vehicleId);
      setSelectedCategory(pendingSummaryTrip.category || 'Commute');
      setNotes(pendingSummaryTrip.notes || '');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#10B981', '#1E3A8A'],
        });
      } catch (e) {
        // Fallback silently if canvas unavailable
      }
    }
  }, [pendingSummaryTrip]);

  if (!pendingSummaryTrip) return null;

  const categories: TripCategory[] = ['Commute', 'Business', 'Leisure', 'Road Trip', 'Errand'];

  const handleSave = () => {
    saveSummaryTrip({
      startLocationName: routeStart.trim() || 'Origin',
      endLocationName: routeEnd.trim() || 'Destination',
      vehicleId: selectedVehicleId,
      category: selectedCategory,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-900 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2 text-emerald-400 border border-white/10">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Trip Completed</h2>
          <p className="text-xs text-slate-300 mt-0.5">Your journey details have been recorded</p>

          {/* Primary Top Metrics: Distance & Total Duration */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
            <div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-white">
                {pendingSummaryTrip.distanceKm.toFixed(1)}
                <span className="text-base font-medium text-cyan-300 ml-1">
                  {settings.unitDistance}
                </span>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-300">
                Total Distance
              </span>
            </div>
            <div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-white">
                {formatDurationHuman(pendingSummaryTrip.durationSeconds)}
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-300">
                Trip Duration
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="p-6 space-y-5">
          {/* Secondary stats grid: Avg Speed, Max Speed, Moving Time, Stopped Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Avg Speed</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {Math.round(pendingSummaryTrip.avgSpeedKmh)} {settings.unitDistance === 'mi' ? 'mph' : 'km/h'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Max Speed</span>
              <span className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                {Math.round(pendingSummaryTrip.maxSpeedKmh)} {settings.unitDistance === 'mi' ? 'mph' : 'km/h'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Moving Time</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatDurationHuman(pendingSummaryTrip.movingTimeSeconds)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Stopped Time</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatDurationHuman(pendingSummaryTrip.stoppedTimeSeconds)}
              </span>
            </div>
          </div>

          {/* Route Map Preview */}
          {pendingSummaryTrip.points && pendingSummaryTrip.points.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-36">
              <TripMap
                points={pendingSummaryTrip.points}
                interactive={false}
                darkMode={settings.theme === 'dark'}
                height="100%"
              />
            </div>
          )}

          {/* Route naming & Favorite Locations selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Route Details
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="text-[10px] text-slate-400 font-medium ml-1">From</span>
                <input
                  type="text"
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                  placeholder="Starting point"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="relative">
                <span className="text-[10px] text-slate-400 font-medium ml-1">To</span>
                <input
                  type="text"
                  value={routeEnd}
                  onChange={(e) => setRouteEnd(e.target.value)}
                  placeholder="Destination"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Quick tags from saved locations */}
            {savedLocations.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-xs text-slate-400">Quick set:</span>
                {savedLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      if (!routeStart || routeStart === 'Home') setRouteEnd(loc.name);
                      else setRouteEnd(loc.name);
                    }}
                    className="px-2 py-0.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Trip Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TripCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Trip Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Trip Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visited family, Office meeting, Long-distance travel"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Action Buttons: SAVE TRIP & Discard */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleSave}
              className="w-full sm:flex-1 min-h-[52px] rounded-2xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              <span>SAVE TRIP</span>
            </button>

            <button
              onClick={discardSummaryTrip}
              className="w-full sm:w-auto px-4 min-h-[52px] rounded-2xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 size={16} />
              <span>Discard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
