'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, KeyRound, Check, Lock } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      setSuccess('Password changed successfully!');
      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
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
          maxWidth: '440px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <KeyRound size={20} color="#fbbf24" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Update Password</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keep your account safe and secure</p>
          </div>
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

        {success && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#6ee7b7',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Current Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
