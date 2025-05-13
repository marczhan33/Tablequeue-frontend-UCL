import { type WaitStatus } from "@shared/schema";

interface WaitTimeBadgeProps {
  status: WaitStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  available: {
    text: 'Available',
    bgColor: 'bg-status-available',
    textColor: 'text-white',
  },
  short: {
    text: 'Short Wait',
    bgColor: 'bg-status-short',
    textColor: 'text-white',
  },
  long: {
    text: 'Long Wait',
    bgColor: 'bg-status-long',
    textColor: 'text-white',
  },
  very_long: {
    text: 'Very Long Wait',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
  },
  closed: {
    text: 'Closed',
    bgColor: 'bg-gray-600',
    textColor: 'text-white',
  }
};

const WaitTimeBadge = ({ status, className = '', size = 'sm' }: WaitTimeBadgeProps) => {
  // Default config in case status is not recognized
  const config = statusConfig[status] || {
    text: 'Unknown',
    bgColor: 'bg-gray-400',
    textColor: 'text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs font-semibold',
    md: 'px-3 py-1.5 text-sm font-semibold',
    lg: 'px-4 py-2 text-base font-semibold'
  };
  
  return (
    <span className={`rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`}>
      {config.text}
    </span>
  );
};

export default WaitTimeBadge;
