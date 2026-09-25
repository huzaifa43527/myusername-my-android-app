import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import {
  generateSmartInsights,
  formatDurationHuman,
} from '../../utils/helpers';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  FileJson,
} from 'lucide-react';

export const MoreView: React.FC = () => {
  const {
    trips,
    fuelLogs,
    vehicles,
    activeVehicle,
    savedLocations,
    deleteSavedLocation,
    setShowAddLocationModal,
    settings,
    updateSettings,
    exportData,
    importData,
    resetToDefaults,
  } = useTrip();

  const [activeSection, setActiveSection] = useState<'stats' | 'places' | 'settings'>('stats');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string>('');

  // Statistics calculations
  const totalLifetimeDistance = trips.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalLifetimeDuration = trips.reduce((acc, t) => acc + t.durationSeconds, 0);
  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + f.totalAmount, 0);

  // Group trips by day for simple responsive chart (last 7 days)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: daysOfWeek[d.getDay()],
      distance: 0,
      tripsCount: 0,
    };
  });

  trips.forEach((t) => {
    const tDate = new Date(t.startTime).toISOString().split('T')[0];
    const match = last7Days.find((d) => d.dateStr === tDate);
    if (match) {
      match.distance += t.distanceKm;
      match.tripsCount += 1;
    }
  });

  const maxDailyDist = Math.max(...last7Days.map((d) => d.distance), 40);

  // Smart Insights list
  const insights = generateSmartInsights(trips, settings.currency);

  const handleDownloadBackup = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smarttrip-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMessage('Backup downloaded successfully!');
    setTimeout(() => setBackupSuccessMessage(''), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importData(content);
        if (ok) {
          setBackupSuccessMessage('Data successfully restored from backup!');
        } else {
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
    setTimeout(() => setBackupSuccessMessage(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics & Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
          Travel statistics, favorite places, and offline data backups
        </p>
      </div>

      {/* Segmented Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveSection('stats')}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition-all ${
            activeSection === 'stats'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveSection('places')}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition-all ${
            activeSection === 'places'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Saved Places ({savedLocations.length})
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition-all ${
            activeSection === 'settings'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Preferences
        </button>
      </div>

      {/* SECTION 1: STATISTICS DASHBOARD (Spec #16 & #17) */}
      {activeSection === 'stats' && (
        <div className="space-y-6">
          {/* Top 4 Metric Cards (Spec #16: September 1,245 km, 32 Trips, 29h Driving Time, Rs. 31,500 Fuel Cost) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Distance
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                {totalLifetimeDistance.toFixed(1)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">{settings.unitDistance}</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Trips
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {trips.length}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Recorded</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Driving Time
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatDurationHuman(totalLifetimeDuration)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">On the road</span>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Fuel Cost
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalFuelCost.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">{settings.currency} total</span>
            </div>
          </div>

          {/* Minimal, readable Distance Chart (Spec #16) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Distance Traveled (Last 7 Days)
                </h3>
                <p className="text-xs text-slate-500">Daily kilometers recorded</p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                Peak: {Math.round(maxDailyDist)} {settings.unitDistance}
              </span>
            </div>

            {/* Custom Clean SVG Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
              {last7Days.map((d) => {
                const heightPercent = maxDailyDist > 0 ? (d.distance / maxDailyDist) * 100 : 0;
                const cappedHeight = Math.max(heightPercent, 6);

                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.distance > 0 ? `${d.distance.toFixed(1)}` : '0'}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl h-32 flex items-end p-1">
                      <div
                        style={{ height: `${cappedHeight}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          d.distance > 0
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-sm shadow-cyan-500/20'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {d.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Insights (Spec #17) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <Sparkles size={20} />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Smart Travel Observations
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculated purely from your real journey records
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {insights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5"
                >
                  <span className="text-cyan-500 font-bold text-base leading-none">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FAVORITE LOCATIONS (Spec #28) */}
      {activeSection === 'places' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Saved Locations
              </h3>
              <p className="text-xs text-slate-500">
                Frequent destinations automatically label your trip history
              </p>
            </div>
            <button
              onClick={() => setShowAddLocationModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedLocations.map((loc) => (
              <div
                key={loc.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {loc.name}
                    </h4>
                    <span className="text-xs text-slate-400 capitalize block">
                      {loc.address || `${loc.category} location`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteSavedLocation(loc.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Remove saved location"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: PREFERENCES & OFFLINE DATA BACKUP (Spec #3, #30, #31) */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          {/* Notification banner */}
          {backupSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{backupSuccessMessage}</span>
            </div>
          )}

          {/* Theme Mode (Spec #3: Light, Dark, System Default) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Color Theme & Appearance
            </h3>
            <p className="text-xs text-slate-500">
              Optimized for daytime travel and low-glare night driving
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[
                { id: 'light' as const, label: 'Light Mode', icon: Sun },
                { id: 'dark' as const, label: 'Dark Mode', icon: Moon },
                { id: 'system' as const, label: 'System Default', icon: Laptop },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = settings.theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => updateSettings({ theme: item.id })}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Units & Currency */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Units & Regional Formatting
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Distance Unit
                </label>
                <select
                  value={settings.unitDistance}
                  onChange={(e) => updateSettings({ unitDistance: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="mi">Miles (mi)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Fuel Volume
                </label>
                <select
                  value={settings.unitFuel}
                  onChange={(e) => updateSettings({ unitFuel: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="L">Litres (L)</option>
                  <option value="gal">Gallons (gal)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Currency Symbol
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Rs.">Rs. (PKR / INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
            </div>

            {/* Safety Driving Reminder Toggle */}
            <div className="pt-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Safety Driving Reminder
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Encourages eyes on the road during active trips
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.safetyMode}
                  onChange={(e) => updateSettings({ safetyMode: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>

          {/* Offline Data Backup & Restore (Spec #30 & #31) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Offline Storage & Data Backup
              </h3>
              <p className="text-xs text-slate-500">
                Your data is stored securely in your browser. Export anytime to prevent loss.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDownloadBackup}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Export Backup (JSON)
                  </span>
                  <span className="text-[11px] text-slate-400">Save all trips, cars & logs</span>
                </div>
              </button>

              <label className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Restore from Backup
                  </span>
                  <span className="text-[11px] text-slate-400">Import saved JSON file</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to realistic demo data */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need to reload sample records?</span>
              <button
                onClick={() => {
                  if (confirm('Reset application to initial sample data?')) {
                    resetToDefaults();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw size={14} />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
