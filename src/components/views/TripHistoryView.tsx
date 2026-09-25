import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import { formatDurationHuman } from '../../utils/helpers';
import { Trip, TripCategory } from '../../types';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Car,
  Filter,
  Search,
  ChevronRight,
  Play,
} from 'lucide-react';

export const TripHistoryView: React.FC = () => {
  const {
    trips,
    vehicles,
    startTrip,
    activeVehicle,
    setSelectedTripForDetails,
    settings,
  } = useTrip();

  const [selectedFilterVehicle, setSelectedFilterVehicle] = useState<string>('all');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    if (selectedFilterVehicle !== 'all' && trip.vehicleId !== selectedFilterVehicle) {
      return false;
    }
    if (selectedFilterCategory !== 'all' && trip.category !== selectedFilterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoute = `${trip.startLocationName} ${trip.endLocationName}`.toLowerCase().includes(q);
      const matchNotes = (trip.notes || '').toLowerCase().includes(q);
      if (!matchRoute && !matchNotes) return false;
    }
    return true;
  });

  // Group trips by date grouping: Today, Yesterday, This Week, Earlier
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 3600 * 1000;
  const thisWeekStart = todayStart - 6 * 24 * 3600 * 1000;

  const groupedTrips: { title: string; items: Trip[] }[] = [];
  const todayList: Trip[] = [];
  const yesterdayList: Trip[] = [];
  const thisWeekList: Trip[] = [];
  const earlierList: Trip[] = [];

  filteredTrips.forEach((trip) => {
    if (trip.startTime >= todayStart) {
      todayList.push(trip);
    } else if (trip.startTime >= yesterdayStart) {
      yesterdayList.push(trip);
    } else if (trip.startTime >= thisWeekStart) {
      thisWeekList.push(trip);
    } else {
      earlierList.push(trip);
    }
  });

  if (todayList.length > 0) groupedTrips.push({ title: 'Today', items: todayList });
  if (yesterdayList.length > 0) groupedTrips.push({ title: 'Yesterday', items: yesterdayList });
  if (thisWeekList.length > 0) groupedTrips.push({ title: 'This Week', items: thisWeekList });
  if (earlierList.length > 0) groupedTrips.push({ title: 'Past Trips', items: earlierList });

  const totalDistance = filteredTrips.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalDuration = filteredTrips.reduce((acc, t) => acc + t.durationSeconds, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trip History
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Review recorded travel logs, routes and speeds
          </p>
        </div>

        {filteredTrips.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs self-start sm:self-auto">
            <span>
              <strong className="font-mono text-slate-900 dark:text-white">{filteredTrips.length}</strong> Trips
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-mono text-cyan-600 dark:text-cyan-400">{totalDistance.toFixed(1)}</strong> {settings.unitDistance}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDurationHuman(totalDuration)}</span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search route or notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Vehicle Filter */}
          <select
            value={selectedFilterVehicle}
            onChange={(e) => setSelectedFilterVehicle(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedFilterCategory}
            onChange={(e) => setSelectedFilterCategory(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Categories</option>
            <option value="Commute">Commute</option>
            <option value="Business">Business</option>
            <option value="Leisure">Leisure</option>
            <option value="Road Trip">Road Trip</option>
            <option value="Errand">Errand</option>
          </select>
        </div>
      </div>

      {/* Trips List by Groups or Empty State */}
      {filteredTrips.length === 0 ? (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <Compass size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No Trips Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Start your first trip and your journey history will appear here.
            </p>
          </div>
          <button
            onClick={() => startTrip(activeVehicle.id, 'Commute', false)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md active:scale-98 transition-all"
          >
            <Play size={18} className="fill-slate-950" />
            <span>START TRIP</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTrips.map((group) => (
            <div key={group.title} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {group.title}
              </h2>

              <div className="space-y-2.5">
                {group.items.map((trip) => {
                  const veh = vehicles.find((v) => v.id === trip.vehicleId);
                  const tripDate = new Date(trip.startTime);
                  const formattedTime = tripDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTripForDetails(trip)}
                      className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/60 dark:to-slate-800 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100 dark:border-slate-700/60">
                          <MapPin size={20} />
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {trip.startLocationName} → {trip.endLocationName}
                          </h3>

                          {/* Metadata cleanly separated with dots, zero pill capsules */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {formattedTime}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{veh?.name || 'Vehicle'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{trip.category}</span>
                            {trip.notes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="italic text-slate-400 truncate max-w-[200px]">
                                  "{trip.notes}"
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side Key Distance & Duration Metrics */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                            {trip.distanceKm.toFixed(1)} {settings.unitDistance}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDurationHuman(trip.durationSeconds)} · Avg {Math.round(trip.avgSpeedKmh)} {settings.unitDistance === 'mi' ? 'mph' : 'km/h'}
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-slate-400 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
