import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import { getMaintenanceStatus } from '../../utils/helpers';
import {
  Car,
  Plus,
  Wrench,
  Fuel,
  Compass,
  CheckCircle,
  AlertTriangle,
  Clock,
  Check,
  Star,
  Trash2,
} from 'lucide-react';

export const VehicleView: React.FC = () => {
  const {
    vehicles,
    activeVehicle,
    setDefaultVehicle,
    deleteVehicle,
    trips,
    fuelLogs,
    maintenanceItems,
    completeMaintenance,
    deleteMaintenance,
    setShowAddVehicleModal,
    setShowAddMaintenanceModal,
    settings,
  } = useTrip();

  const [activeTab, setActiveTab] = useState<'garage' | 'maintenance'>('garage');

  // Active vehicle stats
  const activeVehicleTrips = trips.filter((t) => t.vehicleId === activeVehicle.id);
  const activeVehicleFuel = fuelLogs.filter((f) => f.vehicleId === activeVehicle.id);
  const activeMaint = maintenanceItems.filter((m) => m.vehicleId === activeVehicle.id);

  const lastFuel = activeVehicleFuel[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Header & Quick Switch Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Vehicle & Garage
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Manage your vehicles, health status and scheduled servicing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'garage' ? (
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-2xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-900/20 active:scale-98 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Vehicle</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddMaintenanceModal(true)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-950/20 active:scale-98 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Service Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Controls for Garage vs Maintenance */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('garage')}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition-all ${
            activeTab === 'garage'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          My Vehicles ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition-all ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Maintenance Schedule ({activeMaint.length})
        </button>
      </div>

      {/* Tab 1: Garage View (Vehicle Cards as per Spec #15) */}
      {activeTab === 'garage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => {
              const isSelected = v.id === activeVehicle.id;
              const vTrips = trips.filter((t) => t.vehicleId === v.id);
              const vFuel = fuelLogs.filter((f) => f.vehicleId === v.id);
              const vMaint = maintenanceItems.filter((m) => m.vehicleId === v.id);
              const nextMaint = vMaint.sort((a, b) => a.nextServiceKm - b.nextServiceKm)[0];
              const nextMaintEval = nextMaint ? getMaintenanceStatus(nextMaint, v) : null;

              return (
                <div
                  key={v.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                    isSelected
                      ? 'border-cyan-500 shadow-md ring-1 ring-cyan-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center border border-blue-100 dark:border-slate-700/60">
                        <Car size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {v.name}
                          </h3>
                          {v.isDefault && (
                            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        {/* Unboxed metadata */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="capitalize">{v.fuelType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {v.odometerKm.toLocaleString()} {settings.unitDistance}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{v.licensePlate}</span>
                        </div>
                      </div>
                    </div>

                    {!v.isDefault && (
                      <button
                        onClick={() => deleteVehicle(v.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* 4 Card Stats (Spec #15: Last fuel entry, Estimated average, Next maintenance, Total trips) */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Total Trips</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono">
                        {vTrips.length} journeys
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Estimated Average</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono">
                        14.8 {settings.unitDistance}/{settings.unitFuel}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Last Fuel Entry</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono">
                        {vFuel[0] ? `${vFuel[0].quantityL} ${settings.unitFuel}` : 'None logged'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Next Maintenance</span>
                      <span
                        className={`font-bold font-mono ${
                          nextMaintEval?.status === 'overdue'
                            ? 'text-rose-500'
                            : nextMaintEval?.status === 'due'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {nextMaint ? `${nextMaint.nextServiceKm.toLocaleString()} ${settings.unitDistance}` : 'Up to date'}
                      </span>
                    </div>
                  </div>

                  {/* Set default / select button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {isSelected ? 'Active for tracking' : 'Switch active vehicle'}
                    </span>
                    {!isSelected && (
                      <button
                        onClick={() => setDefaultVehicle(v.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-800 dark:text-white transition-colors"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Maintenance Screen (Cards as per Spec #18: Engine Oil, Brake Service, Tyres, Battery, etc.) */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Wrench size={16} className="text-blue-600 dark:text-cyan-400" />
              <span>
                Tracking maintenance for <strong>{activeVehicle.name}</strong> ({activeVehicle.odometerKm.toLocaleString()} {settings.unitDistance})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeMaint.map((item) => {
              const evalRes = getMaintenanceStatus(item, activeVehicle);

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Status indicator */}
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                          evalRes.status === 'overdue'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                            : evalRes.status === 'due'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        }`}
                      >
                        {evalRes.status === 'overdue'
                          ? 'Overdue'
                          : evalRes.status === 'due'
                          ? 'Due Soon'
                          : 'Good Condition'}
                      </span>
                    </div>

                    {/* Mileage breakdown: Last Service vs Next Service */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Last Service</span>
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                          {item.lastServiceKm.toLocaleString()} {settings.unitDistance}
                        </span>
                        <div className="text-[10px] text-slate-400">{item.lastServiceDate}</div>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Next Service</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {item.nextServiceKm.toLocaleString()} {settings.unitDistance}
                        </span>
                        <div
                          className={`text-[10px] font-semibold ${
                            evalRes.status === 'overdue'
                              ? 'text-rose-500'
                              : evalRes.status === 'due'
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {evalRes.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Mark as done / Delete */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => completeMaintenance(item.id, activeVehicle.odometerKm)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold transition-colors"
                    >
                      <Check size={14} />
                      <span>Mark Serviced Today</span>
                    </button>

                    <button
                      onClick={() => deleteMaintenance(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove reminder"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
