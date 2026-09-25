import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TripPoint } from '../../types';
import { Navigation, LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';

interface TripMapProps {
  points: TripPoint[];
  currentPoint?: TripPoint | null;
  interactive?: boolean;
  className?: string;
  isLive?: boolean;
  showHeading?: boolean;
  height?: string;
  darkMode?: boolean;
}

export const TripMap: React.FC<TripMapProps> = ({
  points,
  currentPoint,
  interactive = true,
  className = '',
  isLive = false,
  showHeading = true,
  height = '100%',
  darkMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const isFollowingRef = useRef<boolean>(true);

  // Fallback coords if no points yet (e.g. city center)
  const defaultCoords: [number, number] = [24.8607, 67.0011];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startPos = currentPoint
      ? [currentPoint.lat, currentPoint.lng] as [number, number]
      : points.length > 0
      ? [points[0].lat, points[0].lng] as [number, number]
      : defaultCoords;

    const map = L.map(mapContainerRef.current, {
      center: startPos,
      zoom: isLive ? 16 : 14,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
    });

    mapInstanceRef.current = map;

    // Add CartoDB tiles (Positron for light, DarkMatter for dark)
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    });
    tileLayer.addTo(map);

    // Initial polyline
    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    const polyline = L.polyline(latLngs, {
      color: '#06B6D4',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    polylineRef.current = polyline;

    // Start Marker (Green dot)
    if (points.length > 0) {
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            background: #10B981;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      startMarkerRef.current = L.marker([points[0].lat, points[0].lng], {
        icon: startIcon,
      }).addTo(map);
    }

    // Vehicle Marker (Arrow indicator with Cyan pulse)
    const activePoint = currentPoint || (points.length > 0 ? points[points.length - 1] : null);
    if (activePoint) {
      const heading = activePoint.heading || 0;
      const vehicleIcon = L.divIcon({
        className: 'custom-car-marker',
        html: `
          <div style="
            width: 38px;
            height: 38px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: rgba(6, 182, 212, 0.25);
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #0284C7;
              border: 3px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
              transform: rotate(${heading}deg);
              transition: transform 0.3s ease;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      carMarkerRef.current = L.marker([activePoint.lat, activePoint.lng], {
        icon: vehicleIcon,
      }).addTo(map);
    }

    // Fit bounds if preview mode and multiple points
    if (!isLive && points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [darkMode]);

  // Update points & car marker in real-time
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
    }

    const activePoint = currentPoint || (points.length > 0 ? points[points.length - 1] : null);
    if (activePoint) {
      const latLng: [number, number] = [activePoint.lat, activePoint.lng];

      if (carMarkerRef.current) {
        carMarkerRef.current.setLatLng(latLng);

        // Update rotation
        const heading = activePoint.heading || 0;
        const iconEl = carMarkerRef.current.getElement()?.querySelector('div > div:nth-child(2)') as HTMLElement;
        if (iconEl) {
          iconEl.style.transform = `rotate(${heading}deg)`;
        }
      }

      if (isLive && isFollowingRef.current) {
        map.panTo(latLng, { animate: true, duration: 0.5 });
      }
    }
  }, [points, currentPoint, isLive]);

  const handleRecenter = () => {
    isFollowingRef.current = true;
    const map = mapInstanceRef.current;
    const activePoint = currentPoint || (points.length > 0 ? points[points.length - 1] : null);
    if (map && activePoint) {
      map.setView([activePoint.lat, activePoint.lng], 16, { animate: true });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-slate-900 ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      {interactive && (
        <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-2">
          {isLive && (
            <button
              onClick={handleRecenter}
              title="Recenter on vehicle"
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              <LocateFixed size={18} className="text-cyan-500" />
            </button>
          )}
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
