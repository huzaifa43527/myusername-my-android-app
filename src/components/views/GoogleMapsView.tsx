import React, { useState, useEffect } from 'react';
import { useTrip } from '../../context/TripContext';
import {
  MapPin,
  Search,
  Fuel,
  Wrench,
  Navigation,
  Compass,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  LocateFixed,
  Route,
  BookmarkPlus,
  Check,
} from 'lucide-react';

interface GroundingChunk {
  web?: { uri?: string; title?: string };
  maps?: { uri?: string; title?: string };
}

export const GoogleMapsView: React.FC = () => {
  const { addSavedLocation, settings } = useTrip();

  // Mode: 'places' | 'route'
  const [mode, setMode] = useState<'places' | 'route'>('places');

  // Places Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('gas stations');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [userCity, setUserCity] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Route Planning State
  const [routeOrigin, setRouteOrigin] = useState<string>('');
  const [routeDestination, setRouteDestination] = useState<string>('');

  // Results State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');
  const [groundingMetadata, setGroundingMetadata] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedSuccessKey, setSavedSuccessKey] = useState<string>('');

  // Auto-detect coordinates on mount if available
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback to manual city/location search
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleAcquireLocation = () => {
    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setErrorMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage('Unable to retrieve GPS coordinates. Please type your city or area below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchPlaces = async (searchTopic?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setResultText('');
    setGroundingMetadata(null);

    const queryToUse = searchTopic || customQuery || selectedCategory;

    try {
      const res = await fetch('/api/maps/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToUse,
          category: selectedCategory,
          lat: gpsCoords?.lat,
          lng: gpsCoords?.lng,
          city: userCity.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultText(data.text);
        setGroundingMetadata(data.groundingMetadata);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve Google Maps data.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while contacting Google Maps service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeOrigin.trim() || !routeDestination.trim()) {
      setErrorMessage('Please enter both origin and destination.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setResultText('');
    setGroundingMetadata(null);

    try {
      const res = await fetch('/api/maps/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: routeOrigin.trim(),
          destination: routeDestination.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultText(data.text);
        setGroundingMetadata(data.groundingMetadata);
      } else {
        setErrorMessage(data.error || 'Failed to calculate route.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while requesting route guidance.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset categories
  const categories = [
    { id: 'petrol pumps and fuel stations', label: 'Fuel & Petrol', icon: Fuel },
    { id: 'car and motorcycle mechanics repair workshops', label: 'Mechanics', icon: Wrench },
    { id: 'tyre shop puncture repair and air station', label: 'Tire / Puncture', icon: Compass },
    { id: 'electric vehicle charging station', label: 'EV Charging', icon: Sparkles },
    { id: 'car wash and detailing service', label: 'Car Wash', icon: Layers },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800/60">
              Google Maps Live Data
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Maps & Navigation Assistant
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Locate verified fuel stations, mechanics, EV chargers, and live route directions
          </p>
        </div>

        {/* Mode switcher: Places vs Route */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setMode('places')}
            className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'places'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nearby Places
          </button>
          <button
            onClick={() => setMode('route')}
            className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'route'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Route Guidance
          </button>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        {mode === 'places' ? (
          <>
            {/* Quick Category Chips */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                What are you looking for?
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        handleSearchPlaces(cat.id);
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs">
                        <Icon size={16} className={isSelected ? 'text-cyan-500' : 'text-slate-500'} />
                      </div>
                      <span className="text-xs font-bold leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Search & Location Filter */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-7 relative">
                <input
                  type="text"
                  placeholder="e.g. Shell petrol pump, Honda workshop, 24/7 puncture repair..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()}
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-500 transition-colors"
                />
                <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="sm:col-span-3 relative">
                <input
                  type="text"
                  placeholder="City / Area (e.g. Karachi, Lahore)"
                  value={userCity}
                  onChange={(e) => setUserCity(e.target.value)}
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-500 transition-colors"
                />
                <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="sm:col-span-2">
                <button
                  onClick={() => handleSearchPlaces()}
                  disabled={isLoading}
                  className="w-full min-h-[46px] rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* GPS Coords Badge & Refresh GPS Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <LocateFixed size={14} className={gpsCoords ? 'text-emerald-500' : 'text-slate-400'} />
                <span>
                  {gpsCoords
                    ? `Device GPS Active (${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)})`
                    : 'GPS location not locked'}
                </span>
              </div>
              <button
                onClick={handleAcquireLocation}
                disabled={isLocating}
                className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
              >
                {isLocating && <Loader2 size={12} className="animate-spin" />}
                <span>{isLocating ? 'Detecting GPS...' : 'Use My Current GPS Position'}</span>
              </button>
            </div>
          </>
        ) : (
          /* Route Mode */
          <form onSubmit={handlePlanRoute} className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Google Maps Route Guidance & Travel Time
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Starting Point (Origin)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Current location, Clifton, DHA, Gulshan..."
                    value={routeOrigin}
                    onChange={(e) => setRouteOrigin(e.target.value)}
                    className="w-full min-h-[46px] pl-9 pr-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                  <MapPin size={16} className="absolute left-3 top-3.5 text-cyan-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Destination
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Airport, Hyderabad Highway, Saddar..."
                    value={routeDestination}
                    onChange={(e) => setRouteDestination(e.target.value)}
                    className="w-full min-h-[46px] pl-9 pr-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                  <Navigation size={16} className="absolute left-3 top-3.5 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto min-h-[46px] px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
                <span>Calculate Best Route & ETA</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <Loader2 size={36} className="animate-spin text-cyan-500 mx-auto" />
          <p className="font-bold text-base text-slate-900 dark:text-white">
            Grounding with Google Maps...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Retrieving verified locations, operating hours, and live directions from Google Maps data.
          </p>
        </div>
      )}

      {/* Results Container */}
      {!isLoading && resultText && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Google Maps Verified Results
              </h2>
            </div>

            {/* Direct Google Maps External Link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                customQuery || selectedCategory || 'petrol pumps'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span>View Map on Google</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Formatted Text Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-200">
            {resultText}
          </div>

          {/* Google Maps Grounding Sources / Citations */}
          {groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Google Maps Sources & Places:
              </span>
              <div className="flex flex-wrap gap-2">
                {groundingMetadata.groundingChunks.map((chunk: GroundingChunk, idx: number) => {
                  const uri = chunk.maps?.uri || chunk.web?.uri;
                  const title = chunk.maps?.title || chunk.web?.title || `Place ${idx + 1}`;
                  if (!uri) return null;

                  return (
                    <a
                      key={idx}
                      href={uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-300 text-xs font-medium hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors"
                    >
                      <MapPin size={12} className="text-cyan-500" />
                      <span className="truncate max-w-[200px]">{title}</span>
                      <ExternalLink size={11} className="opacity-70" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
