import jsPDF from 'jspdf';
import { Trip, Vehicle } from '../types';
import { formatDurationHuman } from './helpers';

/**
 * Format CSV field safely escaping quotes and commas
 */
function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports given trips to a CSV file (compatible with Excel, Google Sheets, IRS/tax tracking)
 */
export function exportTripsToCSV(
  trips: Trip[],
  vehicles: Vehicle[],
  unitDistance: 'km' | 'mi' = 'km'
): void {
  if (!trips.length) return;

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.name]));
  const distLabel = unitDistance === 'mi' ? 'Distance (mi)' : 'Distance (km)';
  const speedLabel = unitDistance === 'mi' ? 'mph' : 'km/h';

  const headers = [
    'Trip ID',
    'Date',
    'Start Time',
    'End Time',
    'Vehicle',
    'Category',
    'Start Location',
    'End Location',
    distLabel,
    'Duration (Minutes)',
    'Duration (Formatted)',
    'Moving Time',
    `Avg Speed (${speedLabel})`,
    `Max Speed (${speedLabel})`,
    'Notes',
  ];

  const rows = trips.map((trip) => {
    const startDate = new Date(trip.startTime);
    const endDate = new Date(trip.endTime);
    const vehicleName = vehicleMap.get(trip.vehicleId) || 'Unassigned';
    const durationMinutes = (trip.durationSeconds / 60).toFixed(1);
    const durationFormatted = formatDurationHuman(trip.durationSeconds);
    const movingTimeFormatted = formatDurationHuman(trip.movingTimeSeconds || trip.durationSeconds);

    return [
      escapeCsvField(trip.id),
      escapeCsvField(startDate.toLocaleDateString()),
      escapeCsvField(startDate.toLocaleTimeString()),
      escapeCsvField(endDate.toLocaleTimeString()),
      escapeCsvField(vehicleName),
      escapeCsvField(trip.category),
      escapeCsvField(trip.startLocationName),
      escapeCsvField(trip.endLocationName),
      escapeCsvField(trip.distanceKm.toFixed(2)),
      escapeCsvField(durationMinutes),
      escapeCsvField(durationFormatted),
      escapeCsvField(movingTimeFormatted),
      escapeCsvField(Math.round(trip.avgSpeedKmh)),
      escapeCsvField(Math.round(trip.maxSpeedKmh)),
      escapeCsvField(trip.notes || ''),
    ].join(',');
  });

  // Include UTF-8 BOM so Excel opens non-ASCII and special characters correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `smarttrip-history-${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports given trips to a formatted, clean PDF document using jsPDF
 */
export function exportTripsToPDF(
  trips: Trip[],
  vehicles: Vehicle[],
  unitDistance: 'km' | 'mi' = 'km'
): void {
  if (!trips.length) return;

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.name]));
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let currentY = margin;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Title & Branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SmartTrip · Mileage & Journey Report', margin, 42);

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated on ${todayStr} · Total Trips: ${trips.length}`, margin, 58);

  currentY = 95;

  // Summary KPI Cards in PDF
  const totalDistance = trips.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalDuration = trips.reduce((acc, t) => acc + t.durationSeconds, 0);
  const totalHours = (totalDuration / 3600).toFixed(1);

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 42, 6, 6, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DISTANCE', margin + 14, currentY + 16);
  doc.text('TOTAL DRIVING TIME', margin + 180, currentY + 16);
  doc.text('TRIP COUNT', margin + 350, currentY + 16);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalDistance.toFixed(1)} ${unitDistance}`, margin + 14, currentY + 34);
  doc.text(`${totalHours} hrs`, margin + 180, currentY + 34);
  doc.text(`${trips.length}`, margin + 350, currentY + 34);

  currentY += 58;

  // Table Headers
  const colX = {
    date: margin,
    route: margin + 65,
    vehicle: margin + 230,
    category: margin + 330,
    distance: margin + 415,
    duration: margin + 480,
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 10, pageWidth - margin * 2, 18, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('DATE', colX.date, y + 2);
    doc.text('ROUTE', colX.route, y + 2);
    doc.text('VEHICLE', colX.vehicle, y + 2);
    doc.text('TYPE', colX.category, y + 2);
    doc.text(`DIST (${unitDistance.toUpperCase()})`, colX.distance, y + 2);
    doc.text('TIME', colX.duration, y + 2);
  };

  drawTableHeader(currentY);
  currentY += 16;

  // Table Rows
  trips.forEach((trip, index) => {
    // Check if new page is needed
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin + 10;
      drawTableHeader(currentY);
      currentY += 16;
    }

    const tripDate = new Date(trip.startTime).toLocaleDateString(undefined, {
      month: 'numeric',
      day: 'numeric',
    });
    const vehicleName = vehicleMap.get(trip.vehicleId) || 'Car';
    const route = `${trip.startLocationName} → ${trip.endLocationName}`;
    const truncatedRoute = route.length > 36 ? route.substring(0, 34) + '...' : route;
    const truncatedVehicle = vehicleName.length > 18 ? vehicleName.substring(0, 16) + '..' : vehicleName;
    const durationStr = formatDurationHuman(trip.durationSeconds);

    // Alternate row styling
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY - 8, pageWidth - margin * 2, 16, 'F');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    doc.text(tripDate, colX.date, currentY + 3);
    doc.text(truncatedRoute, colX.route, currentY + 3);
    doc.text(truncatedVehicle, colX.vehicle, currentY + 3);
    doc.text(trip.category, colX.category, currentY + 3);

    doc.setFont('helvetica', 'bold');
    doc.text(trip.distanceKm.toFixed(1), colX.distance, currentY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(durationStr, colX.duration, currentY + 3);

    currentY += 17;
  });

  // Footer on final page
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'SmartTrip Vehicle & Navigation Log · Clean export verified',
    margin,
    pageHeight - 20
  );

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`smarttrip-mileage-report-${fileDate}.pdf`);
}
