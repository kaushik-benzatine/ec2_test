'use client';

import React, { useState, useRef } from 'react';
import { UserProfile } from '@/lib/types';
import { api, getFullMediaUrl } from '@/lib/api';
import { X, Upload, Check, Sparkles, User, Image as ImageIcon } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

const PRESET_AVATARS = [
  { id: 'bot_1', name: 'Cyber Hero', url: '/avatars/bot_1.svg' },
  { id: 'bot_2', name: 'Princess Bot', url: '/avatars/bot_2.svg' },
  { id: 'bot_3', name: 'Thunderbot', url: '/avatars/bot_3.svg' },
  { id: 'bot_4', name: 'Solar Fox', url: '/avatars/bot_4.svg' },
  { id: 'bot_5', name: 'Star Coder', url: '/avatars/bot_5.svg' },
  { id: 'bot_6', name: 'Glitch Mech', url: '/avatars/bot_6.svg' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [selectedPreset, setSelectedPreset] = useState(currentUser.avatar_preset || 'bot_1');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setAvatarFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('avatar_preset', selectedPreset);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      onProfileUpdated(res.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Determine current display avatar
  const currentAvatarDisplay = previewUrl
    ? previewUrl
    : avatarFile
    ? URL.createObjectURL(avatarFile)
    : currentUser.avatar
    ? getFullMediaUrl(currentUser.avatar)
    : `/avatars/${selectedPreset}.svg`;

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '24px',
          padding: '28px',
          position: 'relative',
        }}
      >
        {/* Close Button */}
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

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={20} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Profile & Avatar</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customize your appearance on the bar chart</p>
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
          {/* Avatar Preview & Upload Area */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #818cf8',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
              background: '#1e1b4b',
              flexShrink: 0,
            }}>
              <img
                src={currentAvatarDisplay}
                alt="Avatar Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                Profile Picture
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <Upload size={14} />
                  Upload Photo
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setAvatarFile(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Presets Selection */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Or Choose an Avatar Character:
              </label>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '10px',
            }}>
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedPreset === preset.id && !avatarFile && !previewUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '2px solid #818cf8' : '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.5)' : 'none',
                    }}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Name Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. SpeedClicker99"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#818cf8')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-glass)')}
            />
          </div>

          {/* Submit */}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
