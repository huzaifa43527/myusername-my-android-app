import React from 'react';
import { useTrip } from '../../context/TripContext';
import { MapPin, ShieldCheck, ChevronRight } from 'lucide-react';

export const LocationPermissionModal: React.FC = () => {
  const {
    showLocationPermissionModal,
    setShowLocationPermissionModal,
    updateSettings,
    startTrip,
    activeVehicle,
  } = useTrip();

  if (!showLocationPermissionModal) return null;

  const handleContinue = () => {
    updateSettings({ hasAskedLocationPermission: true });
    setShowLocationPermissionModal(false);

    // Prompt system geolocation permission
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permission granted, start real GPS trip
          startTrip(activeVehicle.id, 'Commute', false);
        },
        () => {
          // If denied, fallback smoothly to simulation
          startTrip(activeVehicle.id, 'Commute', true);
        },
        { enableHighAccuracy: true }
      );
    } else {
      startTrip(activeVehicle.id, 'Commute', true);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-100 dark:border-cyan-900/40">
          <MapPin size={32} />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Location Access
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          SmartTrip uses your location while a trip is active to calculate distance, speed, and route.
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Used strictly on your device for trip recording</span>
        </div>

        <button
          onClick={handleContinue}
          className="w-full min-h-[50px] rounded-2xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-98 transition-all cursor-pointer"
        >
          <span>Continue</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
