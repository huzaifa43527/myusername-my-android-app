import React, { useState, useEffect } from 'react';
import { useTrip } from '../../context/TripContext';
import { X, Fuel, Calculator, Check, AlertCircle } from 'lucide-react';

interface AddFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFuelModal: React.FC<AddFuelModalProps> = ({ isOpen, onClose }) => {
  const { activeVehicle, addFuelLog, settings } = useTrip();

  const [quantity, setQuantity] = useState<string>('12.0');
  const [pricePerUnit, setPricePerUnit] = useState<string>('322');
  const [odometer, setOdometer] = useState<string>(activeVehicle.odometerKm.toString());
  const [fuelStation, setFuelStation] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFullTank, setIsFullTank] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setOdometer(activeVehicle.odometerKm.toString());
      setError('');
    }
  }, [isOpen, activeVehicle]);

  if (!isOpen) return null;

  const numQuantity = parseFloat(quantity) || 0;
  const numPrice = parseFloat(pricePerUnit) || 0;
  const calculatedTotal = Math.round(numQuantity * numPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numQuantity <= 0) {
      setError('Please enter a valid fuel quantity');
      return;
    }
    if (numPrice <= 0) {
      setError('Please enter a valid price per unit');
      return;
    }
    const numOdo = parseInt(odometer, 10);
    if (isNaN(numOdo) || numOdo <= 0) {
      setError('Please enter a valid odometer reading');
      return;
    }

    addFuelLog({
      vehicleId: activeVehicle.id,
      date,
      quantityL: numQuantity,
      pricePerUnit: numPrice,
      totalAmount: calculatedTotal,
      odometerKm: numOdo,
      fuelStation: fuelStation.trim() || undefined,
      fullTank: isFullTank,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Fuel size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Fuel
              </h3>
              <p className="text-xs text-slate-500">{activeVehicle.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Spec #14 clean form with automatic calculation) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fuel Quantity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Fuel Quantity ({settings.unitFuel})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="12.0"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {settings.unitFuel}
              </span>
            </div>
          </div>

          {/* Price per Litre */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Price per {settings.unitFuel === 'gal' ? 'Gallon' : 'Litre'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {settings.currency}
              </span>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="322"
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Total Amount Automatically Calculated Card (Spec #14) */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Calculator size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Total Amount
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              {settings.currency} {calculatedTotal.toLocaleString()}
            </div>
          </div>

          {/* Odometer */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Odometer Reading
            </label>
            <div className="relative">
              <input
                type="number"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="152430"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {settings.unitDistance}
              </span>
            </div>
          </div>

          {/* Fuel Station (Optional) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Fuel Station <span className="text-slate-400 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={fuelStation}
              onChange={(e) => setFuelStation(e.target.value)}
              placeholder="e.g. Shell Expressway, Total Parco"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Full Tank Toggle */}
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isFullTank}
              onChange={(e) => setIsFullTank(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Full tank refuel (used for mileage calculation)
            </span>
          </label>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Check size={20} />
              <span>SAVE FUEL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
