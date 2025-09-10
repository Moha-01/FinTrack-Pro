
"use client";

import React from 'react';
import { useSettings } from '@/hooks/use-settings';
import { AboutCard } from '../about-card';

export function AboutView() {
    const { t } = useSettings();

  return (
     <>
      <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">{t('navigation.about')}</h1>
          <p className="text-sm text-muted-foreground">{t('about.title')}</p>
      </div>
      <AboutCard />
     </>
  );
}
