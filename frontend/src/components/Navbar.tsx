'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { getFullMediaUrl } from '@/lib/api';
import { User, KeyRound, LogOut, History, Zap, Sparkles, Trophy, ChevronDown, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenPassword: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
  onSeedRivals: () => void;
  isRealtimeConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenPassword,
  onOpenHistory,
  onLogout,
  onSeedRivals,
  isRealtimeConnected,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(10, 13, 24, 0.8)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Live status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
          }}>
            <Zap size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="gradient-text-neon">
              BAR BATTLE 🚀
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Interactive Multiplayer Face Clicker
            </span>
          </div>
        </div>

        {/* Live sync badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: isRealtimeConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${isRealtimeConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.75rem',
          fontWeight: 600,
          color: isRealtimeConnected ? '#34d399' : '#f87171',
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isRealtimeConnected ? '#34d399' : '#f87171',
            boxShadow: isRealtimeConnected ? '0 0 8px #34d399' : 'none',
          }} />
          {isRealtimeConnected ? 'LIVE SYNC' : 'DISCONNECTED'}
        </div>
      </div>

      {/* Center / Stats info */}
      {currentUser && (
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)',
          padding: '6px 18px',
          borderRadius: '30px',
        }} className="md-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Today:</span>
            <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{currentUser.daily_points} pts</strong>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-glass)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#ec4899" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Clicks:</span>
            <strong style={{ color: '#ec4899', fontSize: '0.95rem' }}>{currentUser.clicks_given}</strong>
          </div>
        </div>
      )}

      {/* Right Controls & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* History Button */}
        <button
          onClick={onOpenHistory}
          className="btn-secondary"
          title="Daily Leaderboard History"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <History size={16} />
          <span>Daily Archives</span>
        </button>

        {currentUser ? (
          /* Profile Menu Dropdown */
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px 6px 6px',
                background: dropdownOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-glass)',
                borderRadius: '30px',
                cursor: 'pointer',
                color: 'var(--text-main)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #818cf8',
                background: '#1e1b4b',
              }}>
                <img
                  src={getFullMediaUrl(currentUser.avatar || `/avatars/${currentUser.avatar_preset}.svg`)}
                  alt={currentUser.effective_display_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ textAlign: 'left', marginRight: '4px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  {currentUser.effective_display_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                  {currentUser.daily_points} pts
                </div>
              </div>
              <ChevronDown size={15} color="#94a3b8" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '240px',
                  borderRadius: '16px',
                  padding: '8px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-glass)', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>@{currentUser.username}</div>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenProfile();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={16} color="#38bdf8" />
                  <span>Edit Profile & Avatar</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenPassword();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <KeyRound size={16} color="#fbbf24" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onSeedRivals();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <RefreshCw size={16} color="#a855f7" />
                  <span>Seed Rival Bots</span>
                </button>

                <div style={{ height: '1px', background: 'var(--border-glass)', margin: '6px 0' }} />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={16} color="#f87171" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Login / Register Trigger */
          <button
            onClick={onOpenAuth}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.88rem' }}
          >
            <User size={16} />
            <span>Sign In / Join</span>
          </button>
        )}
      </div>
    </header>
  );
};
