import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from 'lucide-react';

export function AboutCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Info className="h-6 w-6 text-muted-foreground" />
        <div>
          <CardTitle className="text-lg">Über diese App</CardTitle>
          <CardDescription>Erstellt von Mohamed Haji</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          Diese Anwendung wurde von Mohamed Haji, einem Full-Stack-Softwareentwickler, mit Firebase Studio basierend auf seinen Ideen und Designkonzepten entwickelt.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold">Bitte beachten:</span> Diese App ist experimentell und für Demonstrationszwecke gedacht. Alle Daten werden lokal in Ihrem Browser gespeichert.
        </p>
      </CardContent>
    </Card>
  );
}
