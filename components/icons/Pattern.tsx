
import React from 'react';

const Pattern: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full opacity-10">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M40 0 v80 M0 40 h80" stroke="white" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p)" />
      </svg>
    </div>
  );
};
export default Pattern;
