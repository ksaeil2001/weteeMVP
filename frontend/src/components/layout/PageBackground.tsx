/**
 * PageBackground Component
 * Based on: DESIGN_STYLE_GUIDE.md Section 2.3
 *
 * Provides the base page background with optional Aurora gradient effects.
 * Creates a clean, modern backdrop for Bento cards.
 *
 * Features:
 * - Light grey base background (#F5F7FA)
 * - Optional Aurora gradient effects (soft blue & purple)
 * - Proper z-index layering
 */

import React from 'react';

export interface PageBackgroundProps {
  /**
   * Page content
   */
  children: React.ReactNode;

  /**
   * Enable Aurora gradient effects
   * @default true
   */
  aurora?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  children,
  aurora = true,
  className = '',
}) => {
  return (
    <div className={`relative min-h-screen bg-[#F5F7FA] overflow-hidden ${className}`}>
      {/* Aurora Effects */}
      {aurora && (
        <>
          {/* Blue Aurora - Top Left */}
          <div
            className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[80px] opacity-60 mix-blend-multiply pointer-events-none"
            aria-hidden="true"
          />

          {/* Purple Aurora - Bottom Right */}
          <div
            className="absolute -bottom-36 -right-36 w-[500px] h-[500px] bg-purple-400/25 rounded-full blur-[80px] opacity-60 mix-blend-multiply pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

PageBackground.displayName = 'PageBackground';

export default PageBackground;
