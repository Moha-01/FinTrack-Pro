import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from 'lucide-react';

export function AboutCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Info className="h-6 w-6 text-muted-foreground" />
        <div>
          <CardTitle className="text-lg">About This App</CardTitle>
          <CardDescription>Created by Mohamed Haji</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          This application was developed by Mohamed Haji, a Full-Stack Software Developer, using Firebase Studio based on his ideas and design concepts.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold">Please Note:</span> This app is experimental and intended for demonstration purposes. All data is stored locally in your browser.
        </p>
      </CardContent>
    </Card>
  );
}
