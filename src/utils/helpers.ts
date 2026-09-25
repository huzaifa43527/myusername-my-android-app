import { SavedLocation, Vehicle, MaintenanceItem, Trip } from '../types';

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest saved location within radius threshold (default 350 meters)
 */
export function findNearestLocation(
  lat: number,
  lng: number,
  locations: SavedLocation[],
  thresholdKm = 0.35
): SavedLocation | null {
  let closest: SavedLocation | null = null;
  let minDistance = Infinity;

  for (const loc of locations) {
    const dist = calculateHaversineDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance && dist <= thresholdKm) {
      minDistance = dist;
      closest = loc;
    }
  }

  return closest;
}

/**
 * Human-friendly duration formatter (e.g. "1h 42m", "38m", "42s", or "01:24:18")
 */
export function formatDurationHuman(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Glanceable digital clock timer formatter for active HUD (e.g. "42:18" or "01:14:09")
 */
export function formatDigitalTimer(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Evaluates the maintenance status based on vehicle current odometer
 */
export function getMaintenanceStatus(item: MaintenanceItem, vehicle: Vehicle): {
  status: 'good' | 'upcoming' | 'due' | 'overdue';
  remainingKm: number;
  label: string;
} {
  const remainingKm = item.nextServiceKm - vehicle.odometerKm;

  if (remainingKm < 0) {
    return {
      status: 'overdue',
      remainingKm,
      label: `Overdue by ${Math.abs(remainingKm).toLocaleString()} km`,
    };
  } else if (remainingKm <= 500) {
    return {
      status: 'due',
      remainingKm,
      label: `Due soon (${remainingKm.toLocaleString()} km left)`,
    };
  } else if (remainingKm <= 2000) {
    return {
      status: 'upcoming',
      remainingKm,
      label: `Upcoming in ${remainingKm.toLocaleString()} km`,
    };
  }
  return {
    status: 'good',
    remainingKm,
    label: `Good condition (${remainingKm.toLocaleString()} km left)`,
  };
}

/**
 * Generates factual Smart Insights from actual recorded trips and fuel data
 */
export function generateSmartInsights(trips: Trip[], currency = 'Rs.'): string[] {
  const insights: string[] = [];
  if (trips.length === 0) {
    return ['Start your first trip to begin unlocking personalized travel insights.'];
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTrips = trips.filter((t) => {
    const d = new Date(t.startTime);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalDistance = thisMonthTrips.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalDuration = thisMonthTrips.reduce((acc, t) => acc + t.durationSeconds, 0);

  if (thisMonthTrips.length > 0) {
    insights.push(`Your total recorded distance this month is ${totalDistance.toFixed(1)} km across ${thisMonthTrips.length} trips.`);
    const avgDistance = totalDistance / thisMonthTrips.length;
    insights.push(`Your average trip distance this month is ${avgDistance.toFixed(1)} km.`);
    const avgDuration = totalDuration / thisMonthTrips.length;
    insights.push(`Average travel time per trip is ${formatDurationHuman(avgDuration)}.`);
  } else {
    insights.push(`You have recorded ${trips.length} total lifetime trips.`);
  }

  // Find most frequent route
  const routeCounts: Record<string, number> = {};
  trips.forEach((t) => {
    const key = `${t.startLocationName} → ${t.endLocationName}`;
    routeCounts[key] = (routeCounts[key] || 0) + 1;
  });

  let topRoute = '';
  let topCount = 0;
  for (const [route, count] of Object.entries(routeCounts)) {
    if (count > topCount) {
      topCount = count;
      topRoute = route;
    }
  }

  if (topRoute && topCount > 1) {
    insights.push(`Your most frequent route is ${topRoute}, recorded ${topCount} times.`);
  }

  // Speed observation
  const maxSpeedRecord = Math.max(...trips.map((t) => t.maxSpeedKmh), 0);
  if (maxSpeedRecord > 0) {
    insights.push(`Peak maximum speed recorded across your journeys is ${Math.round(maxSpeedRecord)} km/h.`);
  }

  return insights;
}

/**
 * Calculates current time of day greeting
 */
export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
