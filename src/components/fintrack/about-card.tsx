
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

export function AboutCard() {
  const { t } = useSettings();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Info className="h-6 w-6 text-muted-foreground" />
        <div>
          <CardTitle className="text-lg">{t('about.title')}</CardTitle>
          <CardDescription>{t('about.author')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          {t('about.description')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold">{t('about.noteTitle')}</span> {t('about.noteContent')}
        </p>
      </CardContent>
    </Card>
  );
}
