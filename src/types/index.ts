export type VehicleType = 'petrol' | 'diesel' | 'hybrid' | 'electric';

export interface Vehicle {
  id: string;
  name: string; // e.g. "Honda City"
  make: string;
  model: string;
  year: number;
  fuelType: VehicleType;
  odometerKm: number;
  licensePlate: string;
  isDefault: boolean;
  fuelCapacityL: number;
  tankLevelPercent?: number; // 0-100%
  color?: string;
}

export interface TripPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speedKmh: number;
  heading?: number;
  altitude?: number;
}

export type TripCategory = 'Commute' | 'Business' | 'Leisure' | 'Road Trip' | 'Errand';

export interface Trip {
  id: string;
  vehicleId: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  durationSeconds: number;
  movingTimeSeconds: number;
  stoppedTimeSeconds: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  startLocationName: string;
  endLocationName: string;
  category: TripCategory;
  notes?: string;
  points: TripPoint[];
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  quantityL: number;
  pricePerUnit: number;
  totalAmount: number;
  odometerKm: number;
  fuelStation?: string;
  fullTank: boolean;
  notes?: string;
}

export type MaintenanceCategory = 'oil' | 'brakes' | 'tyres' | 'battery' | 'filter' | 'ac' | 'transmission' | 'other';
export type MaintenanceStatus = 'good' | 'upcoming' | 'due' | 'overdue';

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  title: string;
  category: MaintenanceCategory;
  lastServiceKm: number;
  nextServiceKm: number;
  lastServiceDate: string;
  nextServiceDate?: string;
  notes?: string;
  estimatedCost?: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  category: 'home' | 'work' | 'gym' | 'education' | 'family' | 'other';
  lat: number;
  lng: number;
  address?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  unitDistance: 'km' | 'mi';
  unitFuel: 'L' | 'gal';
  currency: string;
  safetyMode: boolean; // Reminds user not to interact while vehicle is moving
  highAccuracyGps: boolean;
  completedOnboarding: boolean;
  hasAskedLocationPermission: boolean;
}
