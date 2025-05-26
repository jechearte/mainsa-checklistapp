'use client';

import React from 'react';

interface Step {
  number: number;
  title: string;
}

interface ProgressStepsProps {
  currentStep: number;
  steps: Step[];
}

export default function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="w-full mb-8 py-4 px-6 bg-[#001A3D] rounded-lg border border-[#001A3D]">
      <div className="flex justify-between items-start">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center flex-shrink-0 w-max px-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 relative ${
                  isActive ? 'bg-white text-[#001A3D]' :
                  isCompleted ? 'bg-white text-[#001A3D]' : 'bg-white/50 text-[#001A3D]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-sm font-medium mt-2 text-center block w-full ${
                  isActive ? 'text-white' :
                  isCompleted ? 'text-white' : 'text-white/70'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
} 