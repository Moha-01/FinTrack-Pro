
"use client";

import React from 'react';
import { useSettings } from '@/hooks/use-settings';
import { AboutCard } from '../about-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Pencil, PiggyBank, BarChart2, CalendarDays, BrainCircuit, ShieldCheck, FileJson, Palette } from 'lucide-react';


const featureIcons: { [key: string]: React.ElementType } = {
  dashboard: LayoutDashboard,
  profiles: Users,
  data: Pencil,
  savings: PiggyBank,
  reports: BarChart2,
  calendar: CalendarDays,
  ai: BrainCircuit,
  security: ShieldCheck,
  portability: FileJson,
  customization: Palette,
};

function KeyFeaturesCard() {
    const { t } = useSettings();
    const features = t('about.features') as any[];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('about.featuresTitle')}</CardTitle>
                <CardDescription>{t('about.featuresDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {features.map((feature, index) => {
                     const Icon = featureIcons[feature.icon] || LayoutDashboard;
                    return (
                        <div key={index} className="flex items-start gap-4">
                            <Icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}


export function AboutView() {
    const { t } = useSettings();

  return (
     <>
      <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">{t('navigation.about')}</h1>
          <p className="text-sm text-muted-foreground">{t('about.title')}</p>
      </div>
       <div className="space-y-6">
        <KeyFeaturesCard />
        <AboutCard />
      </div>
     </>
  );
}
