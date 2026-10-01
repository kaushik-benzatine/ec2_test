'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { UserProfile } from '@/lib/types';
import { X, Lock, User, Sparkles, LogIn, UserPlus, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

const PRESETS = [
  { id: 'bot_1', url: '/avatars/bot_1.svg' },
  { id: 'bot_2', url: '/avatars/bot_2.svg' },
  { id: 'bot_3', url: '/avatars/bot_3.svg' },
  { id: 'bot_4', url: '/avatars/bot_4.svg' },
  { id: 'bot_5', url: '/avatars/bot_5.svg' },
  { id: 'bot_6', url: '/avatars/bot_6.svg' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('bot_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ username, password });
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          username,
          password,
          display_name: displayName || username,
          avatar_preset: selectedPreset,
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          padding: '28px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '14px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid var(--border-glass)',
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: isLogin ? 'linear-gradient(135deg, #6366f1, #3b82f6)' : 'transparent',
              color: isLogin ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <LogIn size={16} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: !isLogin ? 'linear-gradient(135deg, #06b6d4, #6366f1)' : 'transparent',
              color: !isLogin ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <UserPlus size={16} />
            Create Player
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {isLogin ? 'Welcome Back!' : 'Join the Arena'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {isLogin
              ? 'Sign in to tap faces and climb to the #1 top spot!'
              : 'Create your avatar and start dominating the live charts.'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Registration Extra Fields */}
          {!isLogin && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Pick Your Avatar Character
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPreset(p.id)}
                      style={{
                        background: selectedPreset === p.id ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                        border: selectedPreset === p.id ? '2px solid #818cf8' : '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        padding: '6px',
                        cursor: 'pointer',
                        transform: selectedPreset === p.id ? 'scale(1.06)' : 'scale(1)',
                      }}
                    >
                      <img src={p.url} alt="preset" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Neon Striker"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              justifyContent: 'center',
              fontSize: '0.95rem',
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In to Play' : 'Start Playing'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
