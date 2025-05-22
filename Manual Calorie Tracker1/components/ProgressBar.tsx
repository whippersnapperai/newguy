import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  
  let barColorClass = 'bg-light-primary dark:bg-dark-primary';
  if (percentage > 100) { // Actual percentage can exceed 100 for visual cue
    barColorClass = 'bg-light-danger dark:bg-dark-danger'; 
  } else if (safePercentage > 85) {
    barColorClass = 'bg-light-warning dark:bg-dark-warning';
  }


  return (
    <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-3 sm:h-4 mt-5 mb-1 overflow-hidden">
      <div
        className={`h-full rounded-full ${barColorClass} transition-all duration-700 ease-out flex items-center justify-end`}
        style={{ width: `${Math.min(percentage, 100)}%` }} // Visual cap at 100% for the bar filling
        role="progressbar"
        aria-valuenow={safePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Optional: Add text inside progress bar if design calls for it */}
         {/* <span className="text-xs font-medium text-white pr-2">{`${Math.round(safePercentage)}%`}</span> */}
      </div>
    </div>
  );
};

export default ProgressBar;