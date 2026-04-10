import React from 'react';

const Logo = ({ className = '', size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xlarge: 'h-24 w-24',
    xxlarge: 'h-48 w-48',
    full: 'h-64 w-64'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <img
        src="/images/BOURBON MORELLI.png"
        alt="BOURBON MORELLI"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to text logo if image fails
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <div 
        className="w-full h-full flex items-center justify-center bg-primary-500 text-white rounded-lg font-luxury font-bold text-xs"
        style={{ display: 'none' }}
      >
        BM
      </div>
    </div>
  );
};

export default Logo;
