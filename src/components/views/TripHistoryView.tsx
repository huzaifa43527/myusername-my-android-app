import React, { useState, useRef, useEffect } from 'react';
import { useTrip } from '../../context/TripContext';
import { formatDurationHuman } from '../../utils/helpers';
import { exportTripsToCSV, exportTripsToPDF } from '../../utils/exportTrips';
import { TripRoutePolylineMap } from '../map/TripRoutePolylineMap';
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
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  CheckCircle2,
  Map as MapIcon,
  Eye,
  Info,
} from 'lucide-react';

export const TripHistoryView: React.FC = () => {
  const {
    trips,
    vehicles,
    startTrip,
    activeVehicle,
    setShowAddVehicleModal,
    setSelectedTripForDetails,
    settings,
  } = useTrip();

  const [selectedFilterVehicle, setSelectedFilterVehicle] = useState<string>('all');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(() => {
    // Default to the first trip if available so the user immediately sees route polyline
    return trips.length > 0 ? trips[0].id : null;
  });

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const tripsToExport = exportScope === 'all' ? trips : filteredTrips;

  const handleExportCSV = () => {
    if (tripsToExport.length === 0) return;
    exportTripsToCSV(tripsToExport, vehicles, settings.unitDistance);
    setShowExportMenu(false);
    setExportFeedback(`Exported ${tripsToExport.length} trips as CSV`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  const handleExportPDF = () => {
    if (tripsToExport.length === 0) return;
    exportTripsToPDF(tripsToExport, vehicles, settings.unitDistance);
    setShowExportMenu(false);
    setExportFeedback(`Exported ${tripsToExport.length} trips as PDF`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

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
      {/* Header & Quick stats & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trip History
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Review recorded travel logs, routes, and export data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {filteredTrips.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
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

          {/* Export Dropdown Menu */}
          {trips.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-semibold text-xs hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors shadow-xs cursor-pointer"
                title="Export trip data to CSV or PDF"
              >
                <Download size={14} className="stroke-[2.2]" />
                <span>Export</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-30 space-y-1">
                  {/* Export Scope Selector (if filtered) */}
                  {filteredTrips.length !== trips.length && (
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Export Scope:
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setExportScope('filtered')}
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-colors cursor-pointer ${
                            exportScope === 'filtered'
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          Visible ({filteredTrips.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportScope('all')}
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-colors cursor-pointer ${
                            exportScope === 'all'
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          All Trips ({trips.length})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CSV Export Option */}
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Export as CSV (.csv)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Excel, Google Sheets & Tax mileage deductions
                      </div>
                    </div>
                  </button>

                  {/* PDF Export Option */}
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Export as PDF (.pdf)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Clean printable travel report with summary KPIs
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Success Feedback Toast */}
      {exportFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{exportFeedback}</span>
        </div>
      )}

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
            onClick={() => {
              if (activeVehicle) {
                startTrip(activeVehicle.id, 'Commute', false);
              } else {
                setShowAddVehicleModal(true);
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md active:scale-98 transition-all cursor-pointer"
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
                  const isExpanded = expandedTripId === trip.id;

                  return (
                    <div
                      key={trip.id}
                      className={`rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'border-cyan-500/80 shadow-xl shadow-cyan-950/20 ring-2 ring-cyan-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-md'
                      }`}
                    >
                      {/* Trip Card Header (Click to toggle route map) */}
                      <div
                        onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                        className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                              isExpanded
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/30'
                                : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/60 dark:to-slate-800 text-blue-700 dark:text-cyan-400 border-blue-100 dark:border-slate-700/60'
                            }`}
                          >
                            <MapPin size={20} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                {trip.startLocationName} → {trip.endLocationName}
                              </h3>
                              {isExpanded && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                                  <MapIcon size={10} />
                                  Route Map
                                </span>
                              )}
                            </div>

                            {/* Metadata cleanly separated with dots */}
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

                          <div className="flex items-center gap-2">
                            <ChevronRight
                              size={18}
                              className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90 text-cyan-500' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Route Polyline Visualization Section */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span>Highlighted Route Polyline Path</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {(trip.points && trip.points.length > 0) ? `${trip.points.length} GPS Fixes` : 'Route Preview'}
                              </span>
                            </div>

                            <TripRoutePolylineMap
                              trip={trip}
                              unitDistance={settings.unitDistance}
                              darkMode={settings.theme === 'dark'}
                              height="280px"
                              onOpenDetails={() => setSelectedTripForDetails(trip)}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setSelectedTripForDetails(trip)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Info size={13} />
                              <span>Full Breakdown & Elevation</span>
                            </button>

                            <button
                              onClick={() => setExpandedTripId(null)}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline font-medium cursor-pointer"
                            >
                              Collapse Map
                            </button>
                          </div>
                        </div>
                      )}
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
