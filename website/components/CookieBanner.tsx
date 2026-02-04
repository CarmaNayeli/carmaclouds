'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem('cookieBannerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('cookieBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍪</span>
          <p className="text-gray-300 text-sm">
            <strong className="text-white">Good news!</strong> This website doesn't use cookies or track you in any way. 
            We just wanted to let you know. 😊
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="bg-[#e91e8c] hover:bg-[#ff2ea0] text-white font-medium px-6 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
