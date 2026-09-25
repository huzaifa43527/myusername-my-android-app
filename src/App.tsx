/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TripProvider, useTrip } from './context/TripContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { TripHistoryView } from './components/views/TripHistoryView';
import { FuelLogView } from './components/views/FuelLogView';
import { VehicleView } from './components/views/VehicleView';
import { MoreView } from './components/views/MoreView';
import { ActiveTripHUD } from './components/trip/ActiveTripHUD';
import { TripSummaryModal } from './components/trip/TripSummaryModal';
import { TripDetailsModal } from './components/trip/TripDetailsModal';
import { AddFuelModal } from './components/fuel/AddFuelModal';
import { AddVehicleModal } from './components/vehicle/AddVehicleModal';
import { AddMaintenanceModal } from './components/vehicle/AddMaintenanceModal';
import { AddLocationModal } from './components/common/AddLocationModal';
import { OnboardingModal } from './components/common/OnboardingModal';
import { LocationPermissionModal } from './components/common/LocationPermissionModal';

const AppContent: React.FC = () => {
  const {
    activeTab,
    showAddFuelModal,
    setShowAddFuelModal,
    showAddVehicleModal,
    setShowAddVehicleModal,
    showAddMaintenanceModal,
    setShowAddMaintenanceModal,
    showAddLocationModal,
    setShowAddLocationModal,
  } = useTrip();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Tab Views */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && <DashboardView />}
        {activeTab === 'trips' && <TripHistoryView />}
        {activeTab === 'fuel' && <FuelLogView />}
        {activeTab === 'vehicle' && <VehicleView />}
        {activeTab === 'more' && <MoreView />}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav />

      {/* Full-screen Driving Interface HUD */}
      <ActiveTripHUD />

      {/* Trip Completed Summary */}
      <TripSummaryModal />

      {/* Trip Details Modal */}
      <TripDetailsModal />

      {/* Modals & Forms */}
      <AddFuelModal
        isOpen={showAddFuelModal}
        onClose={() => setShowAddFuelModal(false)}
      />

      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
      />

      <AddMaintenanceModal
        isOpen={showAddMaintenanceModal}
        onClose={() => setShowAddMaintenanceModal(false)}
      />

      <AddLocationModal
        isOpen={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
      />

      {/* First-time Onboarding & Location Permission */}
      <OnboardingModal />
      <LocationPermissionModal />
    </div>
  );
};

export default function App() {
  return (
    <TripProvider>
      <AppContent />
    </TripProvider>
  );
}
