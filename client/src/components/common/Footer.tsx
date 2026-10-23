import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-espresso text-cream/70 py-3 sm:py-4 border-t border-caramel/20 relative z-10 text-[11px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-caramel text-espresso flex items-center justify-center shrink-0">
            <Coffee className="w-3 h-3" />
          </div>
          <span className="font-serif font-bold text-white tracking-wide text-xs truncate">
            BREW & BEAN
          </span>
          <span className="text-cream/30 hidden sm:inline">•</span>
          <span className="text-cream/50 text-[11px] hidden sm:inline truncate">
            Artisanal Roastery & Café
          </span>
        </div>

        {/* Right Info & Staff Link */}
        <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-cream/50 shrink-0">
          <span>© {new Date().getFullYear()}</span>
          <span className="text-cream/30">•</span>
          <Link
            to="/admin/login"
            className="text-cream/60 hover:text-caramel transition-colors font-medium"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
};
