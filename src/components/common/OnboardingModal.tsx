import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import { SmartTripLogo } from './SmartTripLogo';
import { Compass, Fuel, BarChart3, ChevronRight, Check } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding, updateSettings } = useTrip();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showOnboarding) return null;

  const steps = [
    {
      icon: Compass,
      title: 'Track Every Journey',
      subtitle: 'Record your distance, time and route automatically.',
      color: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-950/60',
    },
    {
      icon: Fuel,
      title: 'Manage Your Fuel',
      subtitle: 'Add fuel manually whenever you refuel with automatic cost calculations.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      icon: BarChart3,
      title: 'Understand Your Travel',
      subtitle: 'View your trips, expenses, maintenance schedule, and vehicle statistics.',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
    },
  ];

  const handleFinish = () => {
    updateSettings({ completedOnboarding: true });
    setShowOnboarding(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const stepData = steps[currentStep];
  const StepIcon = stepData.icon;

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between min-h-[420px]">
        {/* Top brand */}
        <div className="flex justify-between items-center">
          <SmartTripLogo size="sm" />
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Skip
          </button>
        </div>

        {/* Center Illustration / Icon */}
        <div className="my-6">
          <div className={`w-20 h-20 rounded-3xl ${stepData.bg} ${stepData.color} flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/10`}>
            <StepIcon size={40} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {stepData.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-2">
            {stepData.subtitle}
          </p>
        </div>

        {/* Step dots & CTA Button */}
        <div>
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-cyan-500'
                    : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full min-h-[50px] rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
