import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface DigitalQueueButtonProps {
  restaurantId: number;
  className?: string;
}

export default function DigitalQueueButton({ restaurantId, className }: DigitalQueueButtonProps) {
  const [, setLocation] = useLocation();

  return (
    <Button 
      className={`bg-red-500 hover:bg-red-600 text-white flex items-center justify-between gap-2 ${className || ''}`}
      onClick={() => setLocation(`/restaurants/${restaurantId}/remote-waitlist`)}
    >
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8V12L14.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 5C6 4 4.5 4 3.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 5C18 4 19.5 4 20.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
      <span className="text-base font-medium">Digital Queue System</span>
    </Button>
  );
}