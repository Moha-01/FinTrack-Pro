
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  selector: string;
  titleKey: string;
  contentKey: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

interface AppTourProps {
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
    {
      selector: '#tour-step-1-profile',
      titleKey: 'tour.step1.title',
      contentKey: 'tour.step1.content',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: '#tour-step-2-navigation',
      titleKey: 'tour.step2.title',
      contentKey: 'tour.step2.content',
      side: 'right',
      align: 'start',
    },
    {
      selector: '#tour-step-3-summary',
      titleKey: 'tour.step3.title',
      contentKey: 'tour.step3.content',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: '#tour-step-4-add-transaction',
      titleKey: 'tour.step4.title',
      contentKey: 'tour.step4.content',
      side: 'top',
      align: 'end',
    },
];

export function AppTour({ onComplete }: AppTourProps) {
  const { t } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsClient(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    setPopoverOpen(false); // Close popover while searching
    if (targetElement) {
        (targetElement as HTMLElement).style.boxShadow = '';
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    const findElement = () => {
      const element = document.querySelector(tourSteps[currentStep].selector);
      if (element) {
        setTargetElement(element);
        (element as HTMLElement).style.boxShadow = '0 0 0 4px hsl(var(--primary))';
        (element as HTMLElement).style.borderRadius = 'var(--radius)';
        (element as HTMLElement).style.transition = 'box-shadow 0.3s';
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        // Give scroll a moment to finish before showing popover
        setTimeout(() => setPopoverOpen(true), 300);

      } else if (attempts < maxAttempts) {
        attempts++;
        timeoutRef.current = setTimeout(findElement, 100);
      } else {
        console.warn(`Tour step ${currentStep} element not found. Skipping.`);
        handleNext(); // Skip to next step if element not found
      }
    };
    
    findElement();

  }, [currentStep, isClient]);

  const cleanupHighlight = () => {
      if (targetElement) {
        (targetElement as HTMLElement).style.boxShadow = '';
      }
  }

  const handleNext = () => {
    cleanupHighlight();
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    cleanupHighlight();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    cleanupHighlight();
    onComplete();
  };
  
  if (!targetElement || !isClient) {
    return (
        <div className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" />
    );
  }
  
  const currentTourStep = tourSteps[currentStep];
  const targetRect = targetElement.getBoundingClientRect();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" onClick={handleSkip}/>
      <Popover open={popoverOpen}>
        <PopoverAnchor
            className="fixed"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
            }}
        />
        <PopoverContent 
          side={currentTourStep.side}
          align={currentTourStep.align}
          sideOffset={12}
          className="z-50 w-80"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t(currentTourStep.titleKey)}</h3>
            <p className="text-sm text-muted-foreground">{t(currentTourStep.contentKey)}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{currentStep + 1} / {tourSteps.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>{t('tour.skip')}</Button>
                {currentStep > 0 && <Button variant="outline" size="sm" onClick={handlePrev}><ArrowLeft className="h-4 w-4 mr-1"/>{t('tour.previous')}</Button>}
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tourSteps.length - 1 ? t('tour.done') : t('tour.next')}
                  {currentStep < tourSteps.length - 1 && <ArrowRight className="h-4 w-4 ml-1"/>}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
