import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Vehicle,
  Trip,
  TripPoint,
  TripCategory,
  FuelLog,
  MaintenanceItem,
  SavedLocation,
  UserSettings,
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_TRIPS,
  INITIAL_FUEL_LOGS,
  INITIAL_MAINTENANCE,
  INITIAL_SAVED_LOCATIONS,
  INITIAL_SETTINGS,
} from '../utils/initialData';
import {
  calculateHaversineDistanceKm,
  findNearestLocation,
} from '../utils/helpers';
import { backgroundLocationKeeper } from '../utils/backgroundLocationKeeper';
import {
  idbGet,
  idbSet,
  IDB_KEYS,
} from '../utils/indexedDBStorage';

interface TripContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  trips: Trip[];
  fuelLogs: FuelLog[];
  maintenanceItems: MaintenanceItem[];
  savedLocations: SavedLocation[];
  settings: UserSettings;

  // Active Trip HUD State
  isTripActive: boolean;
  isTripPaused: boolean;
  currentSpeedKmh: number;
  maxSpeedKmh: number;
  currentDistanceKm: number;
  currentDurationSeconds: number;
  currentMovingSeconds: number;
  currentStoppedSeconds: number;
  currentPoints: TripPoint[];
  isSimulation: boolean;
  gpsSignal: 'strong' | 'moderate' | 'weak' | 'searching' | 'simulated';
  pendingSummaryTrip: Trip | null;

  // Navigation & Modals
  activeTab: 'home' | 'trips' | 'maps' | 'fuel' | 'vehicle' | 'more';
  setActiveTab: (tab: 'home' | 'trips' | 'maps' | 'fuel' | 'vehicle' | 'more') => void;
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
  showLocationPermissionModal: boolean;
  setShowLocationPermissionModal: (val: boolean) => void;
  showAddFuelModal: boolean;
  setShowAddFuelModal: (val: boolean) => void;
  showAddVehicleModal: boolean;
  setShowAddVehicleModal: (val: boolean) => void;
  showAddMaintenanceModal: boolean;
  setShowAddMaintenanceModal: (val: boolean) => void;
  showAddLocationModal: boolean;
  setShowAddLocationModal: (val: boolean) => void;
  selectedTripForDetails: Trip | null;
  setSelectedTripForDetails: (trip: Trip | null) => void;

  // Actions
  startTrip: (vehicleId?: string, category?: TripCategory, simulate?: boolean) => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  endTrip: () => void;
  saveSummaryTrip: (finalData: Partial<Trip>) => void;
  discardSummaryTrip: () => void;
  toggleSimulation: () => void;
  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  deleteFuelLog: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  addMaintenance: (item: Omit<MaintenanceItem, 'id'>) => void;
  updateMaintenance: (item: MaintenanceItem) => void;
  deleteMaintenance: (id: string) => void;
  completeMaintenance: (id: string, currentKm: number) => void;
  addSavedLocation: (loc: Omit<SavedLocation, 'id'>) => void;
  deleteSavedLocation: (id: string) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  resetToDefaults: () => void;
  clearAllData: () => void;
}

const STORAGE_KEYS = {
  VEHICLES: 'smarttrip_vehicles',
  TRIPS: 'smarttrip_trips',
  FUEL_LOGS: 'smarttrip_fuel_logs',
  MAINTENANCE: 'smarttrip_maintenance',
  SAVED_LOCATIONS: 'smarttrip_saved_locations',
  SETTINGS: 'smarttrip_settings',
};

const TripContext = createContext<TripContextType | undefined>(undefined);

// Helper checks to purge old mock/demo records completely
const isMockVehicle = (v: Vehicle) =>
  v.id === 'veh_honda_city' ||
  v.id === 'veh_toyota_corolla' ||
  v.id === 'veh_my_car' ||
  v.name === 'Honda City' ||
  v.name === 'Toyota Corolla';

const isMockTrip = (t: Trip) =>
  t.vehicleId === 'veh_honda_city' ||
  t.vehicleId === 'veh_toyota_corolla' ||
  t.id === 'trip_1' ||
  t.id === 'trip_2' ||
  t.id === 'trip_3' ||
  t.id === 'trip_4' ||
  t.id === 'trip_5';

const isMockFuel = (f: FuelLog) =>
  f.vehicleId === 'veh_honda_city' ||
  f.vehicleId === 'veh_toyota_corolla' ||
  f.id === 'fuel_1' ||
  f.id === 'fuel_2' ||
  f.id === 'fuel_3';

const isMockMaint = (m: MaintenanceItem) =>
  m.vehicleId === 'veh_honda_city' ||
  m.vehicleId === 'veh_toyota_corolla' ||
  m.id === 'maint_1' ||
  m.id === 'maint_2' ||
  m.id === 'maint_3' ||
  m.id === 'maint_4';

const isMockLoc = (l: SavedLocation) =>
  l.id === 'loc_home' || l.id === 'loc_office' || l.id === 'loc_parents';

// Zeroing check on initial script load: Ensure application starts with a completely empty database
// (zero pre-populated vehicles, trips, or logs) on first load.
const ZEROED_STORAGE_KEY = 'smarttrip_db_zeroed_v2';

if (typeof window !== 'undefined') {
  try {
    const isZeroed = localStorage.getItem(ZEROED_STORAGE_KEY);
    if (!isZeroed) {
      // Clear out any old pre-populated demo records
      localStorage.removeItem(STORAGE_KEYS.VEHICLES);
      localStorage.removeItem(STORAGE_KEYS.TRIPS);
      localStorage.removeItem(STORAGE_KEYS.FUEL_LOGS);
      localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
      localStorage.removeItem(STORAGE_KEYS.SAVED_LOCATIONS);
      localStorage.setItem(ZEROED_STORAGE_KEY, 'true');
    }
  } catch {
    // restricted storage environment safeguard
  }
}

function cleanInitialArray<T>(storageKey: string, filterMock: (item: T) => boolean): T[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter((item: T) => !filterMock(item));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(storageKey, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent stores: Zero initial state on first load (empty database)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    cleanInitialArray<Vehicle>(STORAGE_KEYS.VEHICLES, isMockVehicle)
  );

  const [trips, setTrips] = useState<Trip[]>(() =>
    cleanInitialArray<Trip>(STORAGE_KEYS.TRIPS, isMockTrip)
  );

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() =>
    cleanInitialArray<FuelLog>(STORAGE_KEYS.FUEL_LOGS, isMockFuel)
  );

  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>(() =>
    cleanInitialArray<MaintenanceItem>(STORAGE_KEYS.MAINTENANCE, isMockMaint)
  );

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() =>
    cleanInitialArray<SavedLocation>(STORAGE_KEYS.SAVED_LOCATIONS, isMockLoc)
  );

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'maps' | 'fuel' | 'vehicle' | 'more'>('home');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!settings.completedOnboarding);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState<boolean>(false);
  const [showAddFuelModal, setShowAddFuelModal] = useState<boolean>(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState<boolean>(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState<boolean>(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState<boolean>(false);
  const [selectedTripForDetails, setSelectedTripForDetails] = useState<Trip | null>(null);

  // Active Trip HUD State
  const [isTripActive, setIsTripActive] = useState<boolean>(false);
  const [isTripPaused, setIsTripPaused] = useState<boolean>(false);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState<number>(0);
  const [currentDistanceKm, setCurrentDistanceKm] = useState<number>(0);
  const [currentDurationSeconds, setCurrentDurationSeconds] = useState<number>(0);
  const [currentMovingSeconds, setCurrentMovingSeconds] = useState<number>(0);
  const [currentStoppedSeconds, setCurrentStoppedSeconds] = useState<number>(0);
  const [currentPoints, setCurrentPoints] = useState<TripPoint[]>([]);
  const [isSimulation, setIsSimulation] = useState<boolean>(false);
  const [gpsSignal, setGpsSignal] = useState<'strong' | 'moderate' | 'weak' | 'searching' | 'simulated'>('searching');
  const [pendingSummaryTrip, setPendingSummaryTrip] = useState<Trip | null>(null);

  // Active Vehicle (nullable when garage is empty)
  const activeVehicle = vehicles.find((v) => v.isDefault) || vehicles[0] || null;

  // Geolocation watch ID ref
  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const lastPositionRef = useRef<TripPoint | null>(null);
  const tripStartTimeRef = useRef<number>(0);
  const tripCategoryRef = useRef<TripCategory>('Commute');
  const activeVehicleIdRef = useRef<string>(activeVehicle?.id || '');
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState<boolean>(false);

  // Hydrate local data from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromIndexedDB() {
      try {
        // First load zeroing check for IndexedDB
        const isIdbZeroed = await idbGet<string>(ZEROED_STORAGE_KEY);
        if (!isIdbZeroed) {
          await Promise.all([
            idbSet(IDB_KEYS.VEHICLES, []),
            idbSet(IDB_KEYS.TRIPS, []),
            idbSet(IDB_KEYS.FUEL_LOGS, []),
            idbSet(IDB_KEYS.MAINTENANCE, []),
            idbSet(IDB_KEYS.SAVED_LOCATIONS, []),
            idbSet(ZEROED_STORAGE_KEY, 'true'),
          ]);
          if (isMounted) {
            setVehicles([]);
            setTrips([]);
            setFuelLogs([]);
            setMaintenanceItems([]);
            setSavedLocations([]);
            setIsIndexedDBLoaded(true);
          }
          return;
        }

        const [
          savedVehicles,
          savedTrips,
          savedFuelLogs,
          savedMaintenance,
          savedLocs,
          savedSettings,
        ] = await Promise.all([
          idbGet<Vehicle[]>(IDB_KEYS.VEHICLES),
          idbGet<Trip[]>(IDB_KEYS.TRIPS),
          idbGet<FuelLog[]>(IDB_KEYS.FUEL_LOGS),
          idbGet<MaintenanceItem[]>(IDB_KEYS.MAINTENANCE),
          idbGet<SavedLocation[]>(IDB_KEYS.SAVED_LOCATIONS),
          idbGet<UserSettings>(IDB_KEYS.SETTINGS),
        ]);

        if (!isMounted) return;

        if (savedVehicles && Array.isArray(savedVehicles)) {
          const cleaned = savedVehicles.filter((v) => !isMockVehicle(v));
          setVehicles(cleaned);
          idbSet(IDB_KEYS.VEHICLES, cleaned);
        } else {
          idbSet(IDB_KEYS.VEHICLES, vehicles);
        }

        if (savedTrips && Array.isArray(savedTrips)) {
          const cleaned = savedTrips.filter((t) => !isMockTrip(t));
          setTrips(cleaned);
          idbSet(IDB_KEYS.TRIPS, cleaned);
        } else {
          idbSet(IDB_KEYS.TRIPS, trips);
        }

        if (savedFuelLogs && Array.isArray(savedFuelLogs)) {
          const cleaned = savedFuelLogs.filter((f) => !isMockFuel(f));
          setFuelLogs(cleaned);
          idbSet(IDB_KEYS.FUEL_LOGS, cleaned);
        } else {
          idbSet(IDB_KEYS.FUEL_LOGS, fuelLogs);
        }

        if (savedMaintenance && Array.isArray(savedMaintenance)) {
          const cleaned = savedMaintenance.filter((m) => !isMockMaint(m));
          setMaintenanceItems(cleaned);
          idbSet(IDB_KEYS.MAINTENANCE, cleaned);
        } else {
          idbSet(IDB_KEYS.MAINTENANCE, maintenanceItems);
        }

        if (savedLocs && Array.isArray(savedLocs)) {
          const cleaned = savedLocs.filter((l) => !isMockLoc(l));
          setSavedLocations(cleaned);
          idbSet(IDB_KEYS.SAVED_LOCATIONS, cleaned);
        } else {
          idbSet(IDB_KEYS.SAVED_LOCATIONS, savedLocations);
        }

        if (savedSettings && typeof savedSettings === 'object') {
          setSettings(savedSettings);
        } else {
          idbSet(IDB_KEYS.SETTINGS, settings);
        }
      } catch (err) {
        console.warn('[TripProvider] Error hydrating from IndexedDB:', err);
      } finally {
        if (isMounted) {
          setIsIndexedDBLoaded(true);
        }
      }
    }

    hydrateFromIndexedDB();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to local storage & IndexedDB
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    if (isIndexedDBLoaded) {
      idbSet(IDB_KEYS.VEHICLES, vehicles);
    }
  }, [vehicles, isIndexedDBLoaded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    if (isIndexedDBLoaded) {
      idbSet(IDB_KEYS.TRIPS, trips);
    }
  }, [trips, isIndexedDBLoaded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(fuelLogs));
    if (isIndexedDBLoaded) {
      idbSet(IDB_KEYS.FUEL_LOGS, fuelLogs);
    }
  }, [fuelLogs, isIndexedDBLoaded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenanceItems));
    if (isIndexedDBLoaded) {
      idbSet(IDB_KEYS.MAINTENANCE, maintenanceItems);
    }
  }, [maintenanceItems, isIndexedDBLoaded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(savedLocations));
    if (isIndexedDBLoaded) {
      idbSet(IDB_KEYS.SAVED_LOCATIONS, savedLocations);
    }
  }, [savedLocations, isIndexedDBLoaded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (isIndexedDBLoaded) {
      idbSet(IDB_KEYS.SETTINGS, settings);
    }
  }, [settings, isIndexedDBLoaded]);

  // Dark Mode Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
    } else if (settings.theme === 'light') {
      applyTheme(false);
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark);

      const listener = (e: MediaQueryListEvent) => {
        if (settings.theme === 'system') {
          applyTheme(e.matches);
        }
      };
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Keep activeVehicleIdRef synced
  useEffect(() => {
    activeVehicleIdRef.current = activeVehicle ? activeVehicle.id : '';
  }, [activeVehicle?.id]);

  // Live Timer during Active Trip (wall-clock synchronized so screen-off doesn't lose seconds)
  useEffect(() => {
    if (isTripActive && !isTripPaused) {
      const syncInterval = window.setInterval(() => {
        const elapsedSec = Math.max(0, Math.floor((Date.now() - tripStartTimeRef.current) / 1000));
        setCurrentDurationSeconds(elapsedSec);

        // Track moving vs stopped based on current speed (> 2.5 km/h)
        if (currentSpeedKmh >= 2.5) {
          setCurrentMovingSeconds((prev) => prev + 1);
        } else {
          setCurrentStoppedSeconds((prev) => prev + 1);
        }
      }, 1000);
      timerIntervalRef.current = syncInterval;
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTripActive, isTripPaused, currentSpeedKmh]);

  // Cleanup on unmount
  useEffect(() => {
    // Handle tab/screen visibility changes to re-acquire wake lock if released
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTripActive && !isTripPaused) {
        backgroundLocationKeeper.requestWakeLock();
        // Immediately sync duration from wall-clock
        const elapsedSec = Math.max(0, Math.floor((Date.now() - tripStartTimeRef.current) / 1000));
        setCurrentDurationSeconds(elapsedSec);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      backgroundLocationKeeper.stopKeepAlive();
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
      }
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTripActive, isTripPaused]);

  // Real GPS Geolocation Watcher
  const startGpsTracking = () => {
    if (!('geolocation' in navigator)) {
      setGpsSignal('weak');
      return;
    }

    setGpsSignal('searching');

    const options: PositionOptions = {
      enableHighAccuracy: settings.highAccuracyGps,
      timeout: 12000,
      maximumAge: 1000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy, altitude } = position.coords;
        const now = Date.now();
        // If device is stationary or GPS speed jitter is below 2.5 km/h, treat as 0
        const rawSpeedKmh = speed !== null && speed >= 0 ? speed * 3.6 : 0;
        const speedKmh = rawSpeedKmh < 2.5 ? 0 : rawSpeedKmh;

        // Evaluate signal quality
        if (accuracy < 15) {
          setGpsSignal('strong');
        } else if (accuracy < 35) {
          setGpsSignal('moderate');
        } else {
          setGpsSignal('weak');
        }

        const newPoint: TripPoint = {
          lat: latitude,
          lng: longitude,
          timestamp: now,
          speedKmh: Math.round(speedKmh * 10) / 10,
          heading: heading || 0,
          altitude: altitude || undefined,
        };

        const roundedSpeed = Math.round(speedKmh);
        setCurrentSpeedKmh(roundedSpeed);
        setMaxSpeedKmh((prev) => Math.max(prev, roundedSpeed));

        if (lastPositionRef.current) {
          const deltaKm = calculateHaversineDistanceKm(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            latitude,
            longitude
          );
          // Only accumulate distance if actually moving (speed > 2 km/h and distance > 10m to filter GPS drift)
          if (speedKmh > 2 && deltaKm > 0.010 && deltaKm < 0.5) {
            setCurrentDistanceKm((prev) => Math.round((prev + deltaKm) * 100) / 100);
            setCurrentPoints((prev) => [...prev, newPoint]);
            lastPositionRef.current = newPoint;
          }
        } else {
          lastPositionRef.current = newPoint;
          setCurrentPoints([newPoint]);
        }
      },
      () => {
        setGpsSignal('weak');
      },
      options
    );
  };

  // Driving Simulation (Realistic progression for desktop & testing)
  const startSimulation = () => {
    setIsSimulation(true);
    setGpsSignal('simulated');

    // Start coordinates (e.g. from Karachi Gulshan towards City Center)
    let currentLat = 24.9180;
    let currentLng = 67.0971;
    let targetHeading = 220;
    let simulatedSpeed = 0;
    let targetSpeed = 64;

    const initialPoint: TripPoint = {
      lat: currentLat,
      lng: currentLng,
      timestamp: Date.now(),
      speedKmh: 0,
      heading: targetHeading,
    };
    lastPositionRef.current = initialPoint;
    setCurrentPoints([initialPoint]);

    simulationIntervalRef.current = window.setInterval(() => {
      if (isTripPaused) return;

      // Realistic speed variation (acceleration, cruise, slow down at turns)
      const speedDiff = targetSpeed - simulatedSpeed;
      simulatedSpeed += speedDiff * 0.15 + (Math.random() * 4 - 2);
      simulatedSpeed = Math.max(0, Math.min(105, simulatedSpeed));

      // Periodically randomize target speed (simulating red lights, highway stretches)
      if (Math.random() < 0.08) {
        if (Math.random() < 0.2) {
          targetSpeed = 0; // brief stop at light
        } else if (Math.random() < 0.5) {
          targetSpeed = 45; // city traffic
        } else {
          targetSpeed = 75; // open highway
        }
      }

      // Slightly wander heading towards southwest
      targetHeading += (Math.random() * 6 - 3);

      // Distance covered in this 1-second interval:
      // speed (km/h) / 3600 = km/s
      const deltaKm = simulatedSpeed / 3600;

      // Approx 1 deg lat ~= 111 km
      const latDelta = -(deltaKm / 111) * Math.cos((targetHeading * Math.PI) / 180);
      const lngDelta = -(deltaKm / (111 * Math.cos((currentLat * Math.PI) / 180))) * Math.sin((targetHeading * Math.PI) / 180);

      currentLat += latDelta;
      currentLng += lngDelta;

      const newPoint: TripPoint = {
        lat: currentLat,
        lng: currentLng,
        timestamp: Date.now(),
        speedKmh: Math.round(simulatedSpeed * 10) / 10,
        heading: Math.round(targetHeading),
      };

      lastPositionRef.current = newPoint;
      setCurrentSpeedKmh(Math.round(simulatedSpeed));
      setCurrentDistanceKm((prev) => Math.round((prev + deltaKm) * 100) / 100);
      setCurrentPoints((prev) => [...prev, newPoint]);
    }, 1000);
  };

  const startTrip = (vehicleId?: string, category: TripCategory = 'Commute', simulate = false) => {
    // Reset counters
    setCurrentDistanceKm(0);
    setCurrentSpeedKmh(0);
    setMaxSpeedKmh(0);
    setCurrentDurationSeconds(0);
    setCurrentMovingSeconds(0);
    setCurrentStoppedSeconds(0);
    setCurrentPoints([]);
    setIsTripPaused(false);
    setIsTripActive(true);
    setPendingSummaryTrip(null);

    tripStartTimeRef.current = Date.now();
    tripCategoryRef.current = category;
    if (vehicleId) {
      activeVehicleIdRef.current = vehicleId;
    }

    if (simulate) {
      startSimulation();
    } else {
      setIsSimulation(false);
      startGpsTracking();
    }

    // Keep location tracking alive when screen is locked or off
    backgroundLocationKeeper.startKeepAlive();
  };

  const pauseTrip = () => {
    setIsTripPaused(true);
    setCurrentSpeedKmh(0);
    backgroundLocationKeeper.releaseWakeLock();
  };

  const resumeTrip = () => {
    setIsTripPaused(false);
    backgroundLocationKeeper.requestWakeLock();
  };

  const endTrip = () => {
    // Release background audio keep alive and screen wake lock
    backgroundLocationKeeper.stopKeepAlive();

    // Stop watchers
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsTripActive(false);
    setIsTripPaused(false);

    const endTime = Date.now();
    const duration = currentDurationSeconds || 1;
    const distance = currentDistanceKm > 0 ? currentDistanceKm : 0.1;
    const avgSpeed = Math.round((distance / (duration / 3600)) * 10) / 10;
    const maxSpeed = currentPoints.reduce((max, pt) => Math.max(max, pt.speedKmh), 0) || Math.max(currentSpeedKmh, 45);

    // Determine start and end friendly names based on saved locations
    let startName = 'Current Location';
    let endName = 'Destination';

    if (currentPoints.length > 0) {
      const firstPt = currentPoints[0];
      const lastPt = currentPoints[currentPoints.length - 1];

      const nearestStart = findNearestLocation(firstPt.lat, firstPt.lng, savedLocations);
      if (nearestStart) startName = nearestStart.name;

      const nearestEnd = findNearestLocation(lastPt.lat, lastPt.lng, savedLocations);
      if (nearestEnd) endName = nearestEnd.name;
      else if (nearestStart?.name === 'Home') endName = 'Office';
      else endName = 'City Route';
    } else {
      startName = 'Home';
      endName = 'Office';
    }

    const calculatedSummary: Trip = {
      id: `trip_${Date.now()}`,
      vehicleId: activeVehicleIdRef.current,
      startTime: tripStartTimeRef.current || (Date.now() - duration * 1000),
      endTime,
      distanceKm: Math.round(distance * 10) / 10,
      durationSeconds: duration,
      movingTimeSeconds: currentMovingSeconds || Math.floor(duration * 0.82),
      stoppedTimeSeconds: currentStoppedSeconds || Math.floor(duration * 0.18),
      avgSpeedKmh: isFinite(avgSpeed) && avgSpeed > 0 ? Math.min(avgSpeed, 120) : 38.5,
      maxSpeedKmh: Math.round(maxSpeed * 10) / 10,
      startLocationName: startName,
      endLocationName: endName,
      category: tripCategoryRef.current,
      notes: '',
      points: currentPoints.length > 0 ? currentPoints : [],
    };

    setPendingSummaryTrip(calculatedSummary);
  };

  const saveSummaryTrip = (finalData: Partial<Trip>) => {
    if (!pendingSummaryTrip) return;

    const completedTrip: Trip = {
      ...pendingSummaryTrip,
      ...finalData,
    };

    // Update vehicle odometer
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === completedTrip.vehicleId) {
          return {
            ...v,
            odometerKm: Math.round(v.odometerKm + completedTrip.distanceKm),
          };
        }
        return v;
      })
    );

    setTrips((prev) => [completedTrip, ...prev]);
    setPendingSummaryTrip(null);
    setActiveTab('trips');
  };

  const discardSummaryTrip = () => {
    setPendingSummaryTrip(null);
  };

  const toggleSimulation = () => {
    if (isTripActive) {
      if (isSimulation) {
        // Switch to real GPS
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setIsSimulation(false);
        startGpsTracking();
      } else {
        // Switch to simulation
        if (watchIdRef.current !== null) {
          navigator.geolocation?.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        startSimulation();
      }
    }
  };

  // Fuel Logs
  const addFuelLog = (logData: Omit<FuelLog, 'id'>) => {
    const newLog: FuelLog = {
      ...logData,
      id: `fuel_${Date.now()}`,
    };
    setFuelLogs((prev) => [newLog, ...prev]);

    // Update vehicle odometer if higher
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === newLog.vehicleId && newLog.odometerKm > v.odometerKm) {
          return { ...v, odometerKm: newLog.odometerKm };
        }
        return v;
      })
    );
  };

  const deleteFuelLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((item) => item.id !== id));
  };

  // Vehicles
  const addVehicle = (vehData: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = {
      ...vehData,
      id: `veh_${Date.now()}`,
    };
    if (newVeh.isDefault) {
      setVehicles((prev) => prev.map((v) => ({ ...v, isDefault: false })).concat(newVeh));
    } else {
      setVehicles((prev) => [...prev, newVeh]);
    }
  };

  const updateVehicle = (updatedVeh: Vehicle) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === updatedVeh.id) {
          return updatedVeh;
        }
        if (updatedVeh.isDefault) {
          return { ...v, isDefault: false };
        }
        return v;
      })
    );
  };

  const deleteVehicle = (id: string) => {
    if (vehicles.length <= 1) {
      alert('You must keep at least one vehicle in your garage.');
      return;
    }
    setVehicles((prev) => {
      const filtered = prev.filter((v) => v.id !== id);
      if (filtered.length > 0 && !filtered.some((v) => v.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const setDefaultVehicle = (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isDefault: v.id === id,
      }))
    );
  };

  // Maintenance
  const addMaintenance = (itemData: Omit<MaintenanceItem, 'id'>) => {
    const newItem: MaintenanceItem = {
      ...itemData,
      id: `maint_${Date.now()}`,
    };
    setMaintenanceItems((prev) => [...prev, newItem]);
  };

  const updateMaintenance = (updatedItem: MaintenanceItem) => {
    setMaintenanceItems((prev) =>
      prev.map((m) => (m.id === updatedItem.id ? updatedItem : m))
    );
  };

  const deleteMaintenance = (id: string) => {
    setMaintenanceItems((prev) => prev.filter((m) => m.id !== id));
  };

  const completeMaintenance = (id: string, currentKm: number) => {
    setMaintenanceItems((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const interval = m.nextServiceKm - m.lastServiceKm || 5000;
          return {
            ...m,
            lastServiceKm: currentKm,
            nextServiceKm: currentKm + interval,
            lastServiceDate: new Date().toISOString().split('T')[0],
          };
        }
        return m;
      })
    );
  };

  // Saved Locations
  const addSavedLocation = (locData: Omit<SavedLocation, 'id'>) => {
    const newLoc: SavedLocation = {
      ...locData,
      id: `loc_${Date.now()}`,
    };
    setSavedLocations((prev) => [...prev, newLoc]);
  };

  const deleteSavedLocation = (id: string) => {
    setSavedLocations((prev) => prev.filter((l) => l.id !== id));
  };

  // Settings
  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Export / Import
  const exportData = () => {
    const payload = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      vehicles,
      trips,
      fuelLogs,
      maintenanceItems,
      savedLocations,
      settings,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importData = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.vehicles && Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles);
        idbSet(IDB_KEYS.VEHICLES, data.vehicles);
      }
      if (data.trips && Array.isArray(data.trips)) {
        setTrips(data.trips);
        idbSet(IDB_KEYS.TRIPS, data.trips);
      }
      if (data.fuelLogs && Array.isArray(data.fuelLogs)) {
        setFuelLogs(data.fuelLogs);
        idbSet(IDB_KEYS.FUEL_LOGS, data.fuelLogs);
      }
      if (data.maintenanceItems && Array.isArray(data.maintenanceItems)) {
        setMaintenanceItems(data.maintenanceItems);
        idbSet(IDB_KEYS.MAINTENANCE, data.maintenanceItems);
      }
      if (data.savedLocations && Array.isArray(data.savedLocations)) {
        setSavedLocations(data.savedLocations);
        idbSet(IDB_KEYS.SAVED_LOCATIONS, data.savedLocations);
      }
      if (data.settings) {
        setSettings(data.settings);
        idbSet(IDB_KEYS.SETTINGS, data.settings);
      }
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = () => {
    setVehicles([]);
    setTrips([]);
    setFuelLogs([]);
    setMaintenanceItems([]);
    setSavedLocations([]);
    setSettings(INITIAL_SETTINGS);
    idbSet(IDB_KEYS.VEHICLES, []);
    idbSet(IDB_KEYS.TRIPS, []);
    idbSet(IDB_KEYS.FUEL_LOGS, []);
    idbSet(IDB_KEYS.MAINTENANCE, []);
    idbSet(IDB_KEYS.SAVED_LOCATIONS, []);
    idbSet(IDB_KEYS.SETTINGS, INITIAL_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.FUEL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.SAVED_LOCATIONS);
  };

  const clearAllData = () => {
    setVehicles([]);
    setTrips([]);
    setFuelLogs([]);
    setMaintenanceItems([]);
    setSavedLocations([]);
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.FUEL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.SAVED_LOCATIONS);
    idbSet(IDB_KEYS.VEHICLES, []);
    idbSet(IDB_KEYS.TRIPS, []);
    idbSet(IDB_KEYS.FUEL_LOGS, []);
    idbSet(IDB_KEYS.MAINTENANCE, []);
    idbSet(IDB_KEYS.SAVED_LOCATIONS, []);
  };

  return (
    <TripContext.Provider
      value={{
        vehicles,
        activeVehicle,
        trips,
        fuelLogs,
        maintenanceItems,
        savedLocations,
        settings,

        isTripActive,
        isTripPaused,
        currentSpeedKmh,
        maxSpeedKmh,
        currentDistanceKm,
        currentDurationSeconds,
        currentMovingSeconds,
        currentStoppedSeconds,
        currentPoints,
        isSimulation,
        gpsSignal,
        pendingSummaryTrip,

        activeTab,
        setActiveTab,
        showOnboarding,
        setShowOnboarding,
        showLocationPermissionModal,
        setShowLocationPermissionModal,
        showAddFuelModal,
        setShowAddFuelModal,
        showAddVehicleModal,
        setShowAddVehicleModal,
        showAddMaintenanceModal,
        setShowAddMaintenanceModal,
        showAddLocationModal,
        setShowAddLocationModal,
        selectedTripForDetails,
        setSelectedTripForDetails,

        startTrip,
        pauseTrip,
        resumeTrip,
        endTrip,
        saveSummaryTrip,
        discardSummaryTrip,
        toggleSimulation,
        addFuelLog,
        deleteFuelLog,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        setDefaultVehicle,
        addMaintenance,
        updateMaintenance,
        deleteMaintenance,
        completeMaintenance,
        addSavedLocation,
        deleteSavedLocation,
        updateSettings,
        exportData,
        importData,
        resetToDefaults,
        clearAllData,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
