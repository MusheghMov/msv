import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  isVisible: boolean;
}

export function LoadingSpinner({ message = 'Loading...', isVisible }: LoadingSpinnerProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 z-20 flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <div className="text-xl font-medium">{message}</div>
      </div>
    </div>
  );
}