import { Loader } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <Loader className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
