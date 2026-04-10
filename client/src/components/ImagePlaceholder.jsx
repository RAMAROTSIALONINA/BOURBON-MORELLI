import React from 'react';

const ImagePlaceholder = ({ className = '', alt = 'Product image', showLogo = true }) => {
  return (
    <div 
      className={`bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center ${className}`}
      style={{
        backgroundImage: showLogo ? 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23f9fafb\'/%3E%3Ctext x=\'50%25\' y=\'40%25\' font-family=\'Georgia, serif\' font-size=\'14\' font-weight=\'bold\' fill=\'%23111827\' text-anchor=\'middle\'%3EBOURBON%3C/text%3E%3Ctext x=\'50%25\' y=\'60%25\' font-family=\'Georgia, serif\' font-size=\'14\' font-weight=\'bold\' fill=\'%23111827\' text-anchor=\'middle\'%3EMORELLI%3C/text%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial\' font-size=\'10\' fill=\'%239ca3af\' text-anchor=\'middle\'%3EHAUTE COUTURE%3C/text%3E%3C/svg%3E")' : undefined,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      alt={alt}
    >
      {!showLogo && (
        <div className="text-center">
          <div className="text-neutral-400 text-sm">Image</div>
          <div className="text-neutral-300 text-xs mt-1">BOURBON MORELLI</div>
        </div>
      )}
    </div>
  );
};

export default ImagePlaceholder;
