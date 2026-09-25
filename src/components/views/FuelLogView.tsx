import React from 'react';
import { useTrip } from '../../context/TripContext';
import {
  Fuel,
  Plus,
  TrendingDown,
  Calendar,
  Gauge,
  Trash2,
  Car,
  ChevronRight,
} from 'lucide-react';

export const FuelLogView: React.FC = () => {
  const {
    fuelLogs,
    deleteFuelLog,
    activeVehicle,
    setShowAddFuelModal,
    settings,
  } = useTrip();

  // Filter logs for active vehicle
  const vehicleLogs = fuelLogs.filter((l) => l.vehicleId === activeVehicle.id);

  // Calculate statistics
  const totalSpent = vehicleLogs.reduce((acc, l) => acc + l.totalAmount, 0);
  const totalVolume = vehicleLogs.reduce((acc, l) => acc + l.quantityL, 0);
  const avgPrice = totalVolume > 0 ? Math.round(totalSpent / totalVolume) : 0;

  // Calculate fuel economy between consecutive logs
  // distance delta / fuel quantity
  let estimatedEconomy = 14.6; // realistic baseline for Honda City 1.5
  if (vehicleLogs.length >= 2) {
    const sorted = [...vehicleLogs].sort((a, b) => b.odometerKm - a.odometerKm);
    const distDelta = sorted[0].odometerKm - sorted[1].odometerKm;
    if (distDelta > 0 && sorted[0].quantityL > 0) {
      estimatedEconomy = Math.round((distDelta / sorted[0].quantityL) * 10) / 10;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fuel Log
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Track fuel expenses, refills and fuel economy for {activeVehicle.name}
          </p>
        </div>

        <button
          onClick={() => setShowAddFuelModal(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-950/20 active:scale-98 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Add Fuel</span>
        </button>
      </div>

      {/* Fuel Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Spent
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {settings.currency} {totalSpent.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Across {vehicleLogs.length} refuels
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Estimated Average
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
            {estimatedEconomy}{' '}
            <span className="text-sm font-semibold text-slate-400">
              {settings.unitDistance}/{settings.unitFuel}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Optimal city & highway blend
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Avg Fuel Price
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
            {settings.currency} {avgPrice}
            <span className="text-sm font-semibold text-slate-400">
              /{settings.unitFuel}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Total volume: {totalVolume.toFixed(1)} {settings.unitFuel}
          </span>
        </div>
      </div>

      {/* Fuel Entries List or Friendly Empty State */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Recent Refuel Records
        </h2>

        {vehicleLogs.length === 0 ? (
          <div className="py-16 text-center space-y-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Fuel size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No Fuel Records
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add a fuel entry whenever you refuel your vehicle.
              </p>
            </div>
            <button
              onClick={() => setShowAddFuelModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md active:scale-98 transition-all"
            >
              <Plus size={18} />
              <span>ADD FUEL</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {vehicleLogs.map((log) => {
              const formattedDate = new Date(log.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                      <Fuel size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">
                          {log.quantityL.toFixed(1)} {settings.unitFuel}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          @ {settings.currency} {log.pricePerUnit}/{settings.unitFuel}
                        </span>
                      </div>

                      {/* Clean metadata without pill badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{formattedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {log.odometerKm.toLocaleString()} {settings.unitDistance}
                        </span>
                        {log.fuelStation && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{log.fuelStation}</span>
                          </>
                        )}
                        {log.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="italic text-slate-400">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side Total & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {settings.currency} {log.totalAmount.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400">Total Refuel</span>
                    </div>

                    <button
                      onClick={() => deleteFuelLog(log.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete refuel log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
