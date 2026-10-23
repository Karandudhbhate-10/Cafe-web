import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Coffee, LogOut, ExternalLink, KeyRound } from 'lucide-react';
import { setAudioMuted, getAudioMuted, playNewOrderChime } from '../../utils/audioAlert';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  rightAction,
}) => {
  const [muted, setMuted] = useState(getAudioMuted());
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleSound = () => {
    const nextState = !muted;
    setMuted(nextState);
    setAudioMuted(nextState);
    if (!nextState) {
      // Test audio chime
      playNewOrderChime();
    }
  };

  return (
    <header className="bg-white border-b border-espresso/10 no-print">
      {/* 1. Mobile & Tablet Top Bar (lg:hidden) */}
      <div className="lg:hidden bg-roast text-cream px-4 py-3 flex items-center justify-between border-b border-roast-border">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-caramel flex items-center justify-center text-espresso shadow-xs shrink-0">
            <Coffee className="w-4 h-4 text-espresso" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-serif text-sm font-bold text-white tracking-wide">
                BREW & BEAN
              </span>
              <span className="bg-caramel text-espresso text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                Staff Portal
              </span>
            </div>
            <div className="text-[11px] text-cream/70 font-medium truncate mt-0.5">
              {user?.name || 'Staff Member'} • <span className="text-caramel font-semibold capitalize">{user?.role || 'Barista'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Mobile Audio chime toggle */}
          <button
            onClick={toggleSound}
            type="button"
            className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
              muted
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-espresso/80 text-caramel border-roast-border'
            }`}
            title={muted ? 'Audio Muted' : 'Sound Active'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-caramel" />}
          </button>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            type="button"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-espresso/80 text-cream/90 hover:text-caramel text-xs font-semibold border border-roast-border transition-colors"
            title="Change Staff Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-caramel" />
            <span className="hidden sm:inline">Password</span>
          </button>

          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-espresso/80 text-cream/80 hover:text-red-300 text-xs font-semibold border border-roast-border transition-colors"
            title="Sign Out of Staff Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Main Page Header Bar */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          {/* Mobile Staff Portal pill indicator */}
          <div className="lg:hidden mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-caramel/15 text-caramel-dark border border-caramel/30 px-2 py-0.5 rounded-md">
              Staff Portal • {user?.role || 'Staff'}
            </span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-espresso">{title}</h1>
          {subtitle && <p className="text-xs text-espresso/60 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Audio notification toggle */}
          <button
            onClick={toggleSound}
            type="button"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${muted
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              : 'bg-cream text-espresso border-espresso/10 hover:border-caramel/40'
              }`}
            title={muted ? 'Audio notification muted' : 'Audio notification active'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-caramel" />}
            <span>{muted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* Change Password Button */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            type="button"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cream hover:bg-cream-dark text-espresso border border-espresso/10 transition-colors"
            title="Change your admin/staff password"
          >
            <KeyRound className="w-3.5 h-3.5 text-caramel" />
            <span className="hidden md:inline">Change Password</span>
          </button>

          {/* Customer Menu Preview Link */}
          <a
            href="/menu"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-espresso/5 hover:bg-espresso/10 text-espresso transition-colors"
          >
            <span>Preview Menu</span>
            <ExternalLink className="w-3 h-3 text-caramel" />
          </a>

          {rightAction}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
};

