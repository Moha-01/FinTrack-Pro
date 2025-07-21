
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  selector: string;
  title: string;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

interface AppTourProps {
  onComplete: () => void;
}

export function AppTour({ onComplete }: AppTourProps) {
  const { t } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [isClient, setIsClient] = useState(false);

  const tourSteps: TourStep[] = useMemo(() => [
    {
      selector: '#tour-step-1-profile',
      title: t('tour.step1.title'),
      content: t('tour.step1.content'),
      side: 'bottom',
    },
    {
      selector: '#tour-step-2-navigation',
      title: t('tour.step2.title'),
      content: t('tour.step2.content'),
      side: 'right',
    },
    {
      selector: '#tour-step-3-summary',
      title: t('tour.step3.title'),
      content: t('tour.step3.content'),
      side: 'bottom',
    },
    {
      selector: '#tour-step-4-add-transaction',
      title: t('tour.step4.title'),
      content: t('tour.step4.content'),
      side: 'top',
    },
  ], [t]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const findElement = () => {
      const element = document.querySelector(tourSteps[currentStep].selector);
      if (element) {
        setTargetElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        // If element not found, try again after a short delay for elements that render conditionally
        setTimeout(findElement, 100);
      }
    };
    
    findElement();
  }, [currentStep, tourSteps, isClient]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  if (!targetElement || !isClient) {
    return null;
  }
  
  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0" />
      <Popover open={true}>
        <PopoverTrigger asChild>
           <div
            className="fixed z-50 rounded-md"
            style={{
              top: `${targetElement.getBoundingClientRect().top}px`,
              left: `${targetElement.getBoundingClientRect().left}px`,
              width: `${targetElement.getBoundingClientRect().width}px`,
              height: `${targetElement.getBoundingClientRect().height}px`,
            }}
          />
        </PopoverTrigger>
        <PopoverContent 
          side={currentTourStep.side} 
          className="z-50 w-80"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{currentTourStep.title}</h3>
            <p className="text-sm text-muted-foreground">{currentTourStep.content}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{currentStep + 1} / {tourSteps.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onComplete}>{t('tour.skip')}</Button>
                {currentStep > 0 && <Button variant="outline" size="sm" onClick={handlePrev}><ArrowLeft className="h-4 w-4 mr-1"/>{t('tour.previous')}</Button>}
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tourSteps.length - 1 ? t('tour.done') : t('tour.next')}
                  <ArrowRight className="h-4 w-4 ml-1"/>
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
