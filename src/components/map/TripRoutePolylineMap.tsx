import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Trip, TripPoint } from '../../types';
import { formatDurationHuman } from '../../utils/helpers';
import {
  Maximize2,
  Navigation,
  Gauge,
  Clock,
  Compass,
  MapPin,
  Flag,
  RotateCcw,
} from 'lucide-react';

interface TripRoutePolylineMapProps {
  trip: Trip;
  unitDistance?: 'km' | 'mi';
  darkMode?: boolean;
  onOpenDetails?: () => void;
  height?: string;
  interactive?: boolean;
}

export const TripRoutePolylineMap: React.FC<TripRoutePolylineMapProps> = ({
  trip,
  unitDistance = 'km',
  darkMode = true,
  onOpenDetails,
  height = '320px',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TripPoint | null>(null);

  // Extract or generate points
  const points: TripPoint[] = React.useMemo(() => {
    if (trip.points && trip.points.length >= 2) {
      return trip.points;
    }

    // If trip has only 1 point or 0 points (e.g. quick test trip), generate a realistic path
    const baseLat = trip.points?.[0]?.lat || 24.8607;
    const baseLng = trip.points?.[0]?.lng || 67.0011;
    const totalDistance = trip.distanceKm || 2.5;
    const count = 12;

    const generated: TripPoint[] = [];
    const latDelta = (totalDistance / 111) * 0.7;
    const lngDelta = (totalDistance / 111) * 0.7;

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const wobble = Math.sin(progress * Math.PI * 2) * 0.003;
      generated.push({
        lat: baseLat + latDelta * progress + wobble,
        lng: baseLng + lngDelta * progress,
        timestamp: trip.startTime + progress * trip.durationSeconds * 1000,
        speedKmh: Math.round(trip.avgSpeedKmh * (0.8 + Math.random() * 0.4)),
        heading: 45,
      });
    }
    return generated;
  }, [trip]);

  // Recenter helper
  const handleRecenter = () => {
    if (!mapInstanceRef.current || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Teardown previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startPos: [number, number] = [points[0].lat, points[0].lng];

    const map = L.map(mapContainerRef.current, {
      center: startPos,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
    });

    mapInstanceRef.current = map;

    // Basemap tiles
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);

    // 1. Glowing outer shadow polyline
    L.polyline(latLngs, {
      color: '#06B6D4',
      weight: 10,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // 2. High-contrast inner neon polyline
    const mainPolyline = L.polyline(latLngs, {
      color: '#0891B2',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // 3. Start Marker (Green Pin "A")
    const startPoint = points[0];
    const startIcon = L.divIcon({
      className: 'custom-route-start-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #10B981;
          color: white;
          font-weight: bold;
          font-size: 12px;
          font-family: ui-monospace, monospace;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
        ">A</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const startMarker = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).addTo(map);
    startMarker.bindPopup(`
      <div style="font-size: 12px; font-weight: bold; color: #0f172a; padding: 2px;">
        <span style="color: #10b981; font-weight: 800;">START:</span> ${trip.startLocationName}
      </div>
    `);

    // 4. Finish Marker (Rose Pin "B" with Flag)
    const endPoint = points[points.length - 1];
    const endIcon = L.divIcon({
      className: 'custom-route-end-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #E11D48;
          color: white;
          font-weight: bold;
          font-size: 12px;
          font-family: ui-monospace, monospace;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.5);
        ">B</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const endMarker = L.marker([endPoint.lat, endPoint.lng], { icon: endIcon }).addTo(map);
    endMarker.bindPopup(`
      <div style="font-size: 12px; font-weight: bold; color: #0f172a; padding: 2px;">
        <span style="color: #e11d48; font-weight: 800;">FINISH:</span> ${trip.endLocationName}
      </div>
    `);

    // 5. Interactive Waypoint Dots along the polyline to inspect speed
    if (points.length > 2) {
      // Pick up to 8 evenly spaced checkpoints for speed inspection
      const step = Math.max(1, Math.floor(points.length / 8));
      for (let i = step; i < points.length - 1; i += step) {
        const pt = points[i];
        const dotIcon = L.divIcon({
          className: 'custom-waypoint-dot',
          html: `
            <div style="
              width: 10px;
              height: 10px;
              background: #38BDF8;
              border: 2px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });

        const dotMarker = L.marker([pt.lat, pt.lng], { icon: dotIcon }).addTo(map);
        dotMarker.on('click', () => {
          setSelectedPoint(pt);
        });
      }
    }

    // Automatically fit bounds with comfortable margins
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    // Force map size refresh after rendering animation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trip, darkMode, points, interactive]);

  const speedUnit = unitDistance === 'mi' ? 'mph' : 'km/h';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Top Floating Route Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[110px] sm:max-w-[160px]">{trip.startLocationName}</span>
          </div>
          <span className="text-slate-400">→</span>
          <div className="flex items-center gap-1 font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="truncate max-w-[110px] sm:max-w-[160px]">{trip.endLocationName}</span>
          </div>
        </div>
      </div>

      {/* Top-Right Map Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          title="Recenter route path"
        >
          <RotateCcw size={14} />
        </button>

        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="h-8 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-colors cursor-pointer"
            title="Open Full Trip Breakdown"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Details</span>
          </button>
        )}
      </div>

      {/* Bottom Route Polyline Stats Summary Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-xl flex items-center justify-between text-xs text-slate-200">
        <div className="flex items-center gap-3 divide-x divide-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Dist</span>
            <span className="font-extrabold font-mono text-cyan-400 text-sm">
              {trip.distanceKm.toFixed(1)} {unitDistance}
            </span>
          </div>

          <div className="pl-3 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Time</span>
            <span className="font-bold font-mono text-white text-xs">
              {formatDurationHuman(trip.durationSeconds)}
            </span>
          </div>

          <div className="pl-3 hidden xs:flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Avg</span>
            <span className="font-bold font-mono text-slate-300 text-xs">
              {Math.round(trip.avgSpeedKmh)} {speedUnit}
            </span>
          </div>

          <div className="pl-3 hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Max</span>
            <span className="font-bold font-mono text-amber-400 text-xs">
              {Math.round(trip.maxSpeedKmh)} {speedUnit}
            </span>
          </div>
        </div>

        {/* Selected checkpoint speed prompt or inspection hint */}
        {selectedPoint ? (
          <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-lg text-cyan-300 text-[11px] animate-in fade-in">
            <Gauge size={12} />
            <span>
              Point Speed: <strong>{selectedPoint.speedKmh} {speedUnit}</strong>
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic hidden md:inline">
            Tap checkpoints to inspect speed
          </span>
        )}
      </div>
    </div>
  );
};
