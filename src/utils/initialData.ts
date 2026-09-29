import { Vehicle, Trip, FuelLog, MaintenanceItem, SavedLocation, UserSettings } from '../types';

export const INITIAL_VEHICLES: Vehicle[] = [];

export const SAMPLE_ROUTE_HOME_TO_OFFICE: Trip['points'] = [];

export const INITIAL_TRIPS: Trip[] = [];

export const INITIAL_FUEL_LOGS: FuelLog[] = [];

export const INITIAL_MAINTENANCE: MaintenanceItem[] = [];

export const INITIAL_SAVED_LOCATIONS: SavedLocation[] = [];

export const INITIAL_SETTINGS: UserSettings = {
  theme: 'system',
  unitDistance: 'km',
  unitFuel: 'L',
  currency: 'Rs.',
  safetyMode: true,
  highAccuracyGps: true,
  completedOnboarding: true,
  hasAskedLocationPermission: false,
};
