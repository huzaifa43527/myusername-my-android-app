import React from 'react';
import { useTrip } from '../../context/TripContext';
import { TripMap } from '../map/TripMap';
import { formatDurationHuman } from '../../utils/helpers';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Gauge,
  Car,
  Trash2,
  Share2,
} from 'lucide-react';

export const TripDetailsModal: React.FC = () => {
  const {
    selectedTripForDetails,
    setSelectedTripForDetails,
    vehicles,
    settings,
  } = useTrip();

  if (!selectedTripForDetails) return null;

  const trip = selectedTripForDetails;
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);

  const formattedDate = new Date(trip.startTime).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(trip.startTime).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {trip.startLocationName} → {trip.endLocationName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formattedDate}</span>
              <span aria-hidden="true">·</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          <button
            onClick={() => setSelectedTripForDetails(null)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Route Map Preview */}
        <div className="h-48 w-full border-b border-slate-200 dark:border-slate-800 bg-slate-950">
          <TripMap
            points={trip.points || []}
            interactive={true}
            darkMode={settings.theme === 'dark'}
            height="100%"
          />
        </div>

        {/* Content & Metrics */}
        <div className="p-5 space-y-4">
          {/* Main 2-Column Primary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                {trip.distanceKm.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                Distance ({settings.unitDistance})
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatDurationHuman(trip.durationSeconds)}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                Duration
              </span>
            </div>
          </div>

          {/* Detailed 4-Column Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">Avg Speed</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {Math.round(trip.avgSpeedKmh)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">Max Speed</span>
              <span className="text-sm font-bold font-mono text-cyan-500">
                {Math.round(trip.maxSpeedKmh)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">Moving</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {formatDurationHuman(trip.movingTimeSeconds)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">Stopped</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {formatDurationHuman(trip.stoppedTimeSeconds)}
              </span>
            </div>
          </div>

          {/* Vehicle & Category Info */}
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Car size={15} className="text-cyan-500" />
              <span>{vehicle?.name || 'Vehicle'} ({vehicle?.licensePlate || ''})</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {trip.category}
            </span>
          </div>

          {/* Trip Notes */}
          {trip.notes && (
            <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 text-xs">
              <span className="font-bold text-cyan-900 dark:text-cyan-300 block mb-1">
                Trip Notes
              </span>
              <p className="text-slate-700 dark:text-slate-300">{trip.notes}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setSelectedTripForDetails(null)}
              className="w-full min-h-[46px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-sm transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
