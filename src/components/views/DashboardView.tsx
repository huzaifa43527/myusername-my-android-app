import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import {
  getTimeOfDayGreeting,
  formatDurationHuman,
  generateSmartInsights,
  getMaintenanceStatus,
} from '../../utils/helpers';
import { TripCategory } from '../../types';
import {
  Play,
  Fuel,
  Compass,
  Car,
  TrendingUp,
  MapPin,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldAlert,
  Radio,
  Plus,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    activeVehicle,
    trips,
    fuelLogs,
    maintenanceItems,
    startTrip,
    setActiveTab,
    setShowAddFuelModal,
    setShowAddVehicleModal,
    setSelectedTripForDetails,
    settings,
  } = useTrip();

  const [selectedCategory, setSelectedCategory] = useState<TripCategory>('Commute');
  const [showStartOptions, setShowStartOptions] = useState(false);

  const greeting = getTimeOfDayGreeting();

  // Calculate Today's Activity
  const now = new Date();
  const isSameDay = (timestamp: number) => {
    const d = new Date(timestamp);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const todaysTrips = trips.filter((t) => isSameDay(t.startTime));
  const todaysDistance = todaysTrips.reduce((acc, t) => acc + t.distanceKm, 0);
  const todaysDuration = todaysTrips.reduce((acc, t) => acc + t.durationSeconds, 0);

  // Recent trips (last 3)
  const recentTrips = trips.slice(0, 3);

  // Smart Insights
  const insights = generateSmartInsights(trips, settings.currency);

  // Active Vehicle Maintenance check
  const activeMaint = maintenanceItems.filter((m) => m.vehicleId === activeVehicle.id);
  const nextDueMaint = activeMaint.sort((a, b) => a.nextServiceKm - b.nextServiceKm)[0];
  const maintStatus = nextDueMaint ? getMaintenanceStatus(nextDueMaint, activeVehicle) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* 1. Top Section Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Ready for your next trip?
          </p>
        </div>

        {/* Vehicle chip indicator */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {activeVehicle.name}
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {activeVehicle.odometerKm.toLocaleString()} {settings.unitDistance}
          </span>
        </div>
      </div>

      {/* 2. Prominent Primary Action: START TRIP */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-800 rounded-3xl blur-md opacity-35 group-hover:opacity-60 transition duration-300" />
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl overflow-hidden border border-blue-800/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[11px] font-bold tracking-widest uppercase text-cyan-400">
                Automatic GPS Tracking
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Begin Live Navigation & Trip Record
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                Glanceable speed, distance, route recording, and vehicle stats saved automatically.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => startTrip(activeVehicle.id, selectedCategory, false)}
                className="min-h-[58px] px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Play size={24} className="fill-slate-950" />
                <span>START TRIP</span>
              </button>

              <button
                onClick={() => startTrip(activeVehicle.id, selectedCategory, true)}
                className="min-h-[46px] sm:min-h-[58px] px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-cyan-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-white/15 active:scale-98 transition-all cursor-pointer"
                title="Launch with realistic driving simulation (ideal for desktop testing)"
              >
                <Radio size={16} />
                <span>Simulate Drive</span>
              </button>
            </div>
          </div>

          {/* Quick Category Pill Selector */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Trip Type:</span>
            {(['Commute', 'Business', 'Leisure', 'Road Trip', 'Errand'] as TripCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Grid (Spec #29) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => startTrip(activeVehicle.id, selectedCategory, false)}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-cyan-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Play size={20} className="fill-current" />
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-white block">Start Trip</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Live navigation</span>
        </button>

        <button
          onClick={() => setShowAddFuelModal(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-cyan-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Fuel size={20} />
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-white block">Add Fuel</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Log refuel entry</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-cyan-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Compass size={20} />
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-white block">View Trips</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">History & routes</span>
        </button>

        <button
          onClick={() => setShowAddVehicleModal(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-cyan-500/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Car size={20} />
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-white block">Add Vehicle</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Manage garage</span>
        </button>
      </div>

      {/* 4. Today's Activity Section (Spec #7) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Today's Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {todaysTrips.length} {todaysTrips.length === 1 ? 'Trip' : 'Trips'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              {todaysTrips.length}
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">
              Trips
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
              {todaysDistance.toFixed(1)}
              <span className="text-xs font-medium ml-0.5">{settings.unitDistance}</span>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">
              Distance
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatDurationHuman(todaysDuration)}
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">
              Time
            </span>
          </div>
        </div>
      </div>

      {/* 5. Recent Trips (Spec #7) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Recent Trips
          </h3>
          <button
            onClick={() => setActiveTab('trips')}
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTrips.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Compass className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Trips Recorded Yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Tap START TRIP above to track your first journey with live distance and route.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => setSelectedTripForDetails(trip)}
                className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {trip.startLocationName} → {trip.endLocationName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{trip.distanceKm.toFixed(1)} {settings.unitDistance}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDurationHuman(trip.durationSeconds)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{trip.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {Math.round(trip.avgSpeedKmh)} {settings.unitDistance === 'mi' ? 'mph' : 'km/h'}
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Smart Insights & Maintenance Status (Spec #17 & #18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Smart Insights */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-cyan-600 dark:text-cyan-400">
              <Sparkles size={18} />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Smart Insights
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {insights.slice(0, 3).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setActiveTab('more')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between"
          >
            <span>View Detailed Analytics</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Vehicle Health & Maintenance Preview */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Car size={18} className="text-blue-600 dark:text-cyan-400" />
                <span>Vehicle Status</span>
              </div>
              <span className="text-xs text-slate-500">{activeVehicle.fuelType}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Current Odometer</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeVehicle.odometerKm.toLocaleString()} {settings.unitDistance}
                </span>
              </div>

              {nextDueMaint && maintStatus && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {nextDueMaint.title}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        maintStatus.status === 'overdue'
                          ? 'text-rose-500'
                          : maintStatus.status === 'due'
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {maintStatus.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Next service at {nextDueMaint.nextServiceKm.toLocaleString()} {settings.unitDistance}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('vehicle')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between"
          >
            <span>Garage & Maintenance Schedule</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
