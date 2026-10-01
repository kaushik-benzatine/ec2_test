'use client';

import React, { useState, useEffect } from 'react';
import { BarItem, UserProfile } from '@/lib/types';
import { getFullMediaUrl } from '@/lib/api';
import { Trophy, Zap, Sparkles, AlertCircle, Clock } from 'lucide-react';

interface LiveBarChartProps {
  bars: BarItem[];
  maxScore: number;
  currentUser: UserProfile | null;
  onFaceClick: (targetUserId: number, event: React.MouseEvent<HTMLDivElement>) => void;
  onRequireAuth: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const LiveBarChart: React.FC<LiveBarChartProps> = ({
  bars,
  maxScore,
  currentUser,
  onFaceClick,
  onRequireAuth,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bouncingId, setBouncingId] = useState<number | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // 15-click cooldown tracking: targetUserId -> remaining seconds
  const [clickCounts, setClickCounts] = useState<Record<number, number>>({});
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({});

  // Cooldown countdown timer tick every 100ms
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const handleBarClick = (bar: BarItem, e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (bar.user_id === currentUser.user_id) {
      setWarningMsg("You can't click yourself! Click on other players' faces to boost YOUR score!");
      setTimeout(() => setWarningMsg(null), 3500);
      return;
    }

    // Check if user is currently on 5s cooldown
    const cooldownEnd = cooldowns[bar.user_id] || 0;
    if (cooldownEnd > now) {
      const remaining = Math.ceil((cooldownEnd - now) / 1000);
      setWarningMsg(`Player is resting! Reappears in ${remaining}s...`);
      setTimeout(() => setWarningMsg(null), 2000);
      return;
    }

    // Update consecutive click count for this target
    const currentCount = (clickCounts[bar.user_id] || 0) + 1;
    if (currentCount >= 15) {
      // 15 clicks reached! Trigger 5 second cooldown disappearance
      setCooldowns((prev) => ({
        ...prev,
        [bar.user_id]: Date.now() + 5000,
      }));
      setClickCounts((prev) => ({
        ...prev,
        [bar.user_id]: 0,
      }));
      setWarningMsg(`💨 15 Rapid Clicks! ${bar.display_name} disappeared for 5 seconds!`);
      setTimeout(() => setWarningMsg(null), 4000);
    } else {
      setClickCounts((prev) => ({
        ...prev,
        [bar.user_id]: currentCount,
      }));
    }

    // Spawn floating particle at click coordinate
    const newParticle: Particle = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY - 20,
      text: '+10 PTS',
    };

    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 850);

    // Face bounce trigger
    setBouncingId(bar.user_id);
    setTimeout(() => setBouncingId(null), 350);

    // Call parent click handler
    onFaceClick(bar.user_id, e);
  };

  // Dynamic scaling: adaptive power-curve normalization
  // Ensures leader stays at the top without breaking the ceiling,
  // and other players maintain visible, motivating, growing bar heights!
  const effectiveMax = Math.max(maxScore, 50);

  const calculateDynamicHeight = (pts: number) => {
    if (pts <= 0) return 18; // Base 18% minimum height
    const ratio = pts / effectiveMax;
    // Power curve (0.6): gives lower & mid scores a visible, lively bar height while preserving ranking disparity
    const scaledRatio = Math.pow(ratio, 0.6);
    // Scale between 18% minimum and 82% maximum (leaves 18% top headroom so faces & crowns NEVER get clipped)
    return Math.round(18 + scaledRatio * 64);
  };

  const gridSteps = [
    { value: effectiveMax, label: `${effectiveMax} pts`, pct: 82 },
    { value: Math.round(effectiveMax * 0.75), label: `${Math.round(effectiveMax * 0.75)} pts`, pct: 66 },
    { value: Math.round(effectiveMax * 0.5), label: `${Math.round(effectiveMax * 0.5)} pts`, pct: 50 },
    { value: Math.round(effectiveMax * 0.25), label: `${Math.round(effectiveMax * 0.25)} pts`, pct: 34 },
    { value: 0, label: `0 pts`, pct: 18 },
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Floating Particles Overlay */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-particle"
          style={{
            position: 'fixed',
            left: `${p.x - 30}px`,
            top: `${p.y}px`,
          }}
        >
          ⚡ {p.text}
        </div>
      ))}

      {/* Warning / Feedback Banner */}
      {warningMsg && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid #38bdf8',
            backdropFilter: 'blur(16px)',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '24px',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.4)',
            zIndex: 999,
            animation: 'slideUp 0.2s ease',
          }}
        >
          <AlertCircle size={18} color="#38bdf8" />
          {warningMsg}
        </div>
      )}

      {/* Chart Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '24px',
          padding: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.85)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Arena Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Live Bar Arena</h2>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {bars.length} PLAYERS
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              💡 Click rival avatar faces to boost <strong style={{ color: '#38bdf8' }}>YOUR bar height</strong>! (15 clicks triggers 5s cooldown)
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dynamic Matrix: <strong style={{ color: '#fbbf24' }}>Peak {effectiveMax} pts</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Responsive Chart Viewport */}
        <div style={{
          position: 'relative',
          height: 'clamp(440px, 55vh, 600px)',
          width: '100%',
          display: 'flex',
          paddingLeft: '75px', // Space for left Y-axis
          paddingBottom: '55px', // Space for bottom labels
          paddingTop: '20px',   // Space for top headroom
        }}>
          {/* Y-Axis Column on Left */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: '20px',
            bottom: '55px',
            width: '70px',
            borderRight: '2px solid rgba(255, 255, 255, 0.1)',
            zIndex: 5,
          }}>
            {gridSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: `${step.pct}%`,
                  transform: 'translateY(50%)',
                  width: '100%',
                  textAlign: 'right',
                  paddingRight: '10px',
                }}
              >
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: idx === 0 ? '#fbbf24' : 'var(--text-dim)',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Horizontal Guide Lines */}
          <div style={{
            position: 'absolute',
            left: '75px',
            right: '20px',
            top: '20px',
            bottom: '55px',
            pointerEvents: 'none',
          }}>
            {gridSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${step.pct}%`,
                  borderBottom: idx === 4
                    ? '2px solid rgba(255, 255, 255, 0.25)'
                    : '1px dashed rgba(255, 255, 255, 0.08)',
                }}
              />
            ))}
          </div>

          {/* Player Bars Container with full flex height and smooth horizontal scrolling */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '24px',
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 10,
            overflowX: 'auto',
            overflowY: 'visible',
            padding: '0 20px',
          }}>
            {bars.map((bar) => {
              const isCurrentUser = currentUser && bar.user_id === currentUser.user_id;
              const isLeader = bar.rank === 1;
              const isBouncing = bouncingId === bar.user_id;

              // Calculate dynamic percentage height
              const dynamicHeightPct = calculateDynamicHeight(bar.daily_points);

              // Cooldown check for 15-click disappearance
              const cooldownEnd = cooldowns[bar.user_id] || 0;
              const isCoolingDown = cooldownEnd > now;
              const remainingSec = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));
              const currentClicks = clickCounts[bar.user_id] || 0;

              return (
                <div
                  key={bar.user_id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    minWidth: '85px',
                    position: 'relative',
                  }}
                >
                  {/* Dynamic Height Bar Column */}
                  <div
                    style={{
                      height: `${dynamicHeightPct}%`,
                      width: '66px',
                      borderRadius: '20px 20px 8px 8px',
                      background: isCurrentUser
                        ? 'linear-gradient(180deg, #38bdf8 0%, #6366f1 100%)'
                        : isLeader
                        ? 'linear-gradient(180deg, #f59e0b 0%, #ec4899 100%)'
                        : 'linear-gradient(180deg, rgba(99, 102, 241, 0.85) 0%, rgba(30, 41, 59, 0.8) 100%)',
                      boxShadow: isCurrentUser
                        ? '0 0 25px rgba(56, 189, 248, 0.6), inset 0 2px 6px rgba(255, 255, 255, 0.5)'
                        : isLeader
                        ? '0 0 25px rgba(245, 158, 11, 0.6), inset 0 2px 6px rgba(255, 255, 255, 0.5)'
                        : '0 6px 20px rgba(0, 0, 0, 0.4)',
                      border: isCurrentUser
                        ? '2.5px solid #38bdf8'
                        : isLeader
                        ? '2.5px solid #fbbf24'
                        : '1px solid var(--border-glass)',
                      transition: 'height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {/* AVATAR FACE PERCHED AT THE TOP OF THE BAR */}
                    <div
                      onClick={(e) => handleBarClick(bar, e)}
                      title={
                        isCurrentUser
                          ? 'This is your bar!'
                          : isCoolingDown
                          ? `Resting... Reappears in ${remainingSec}s`
                          : `Click face (+10 pts)! [${currentClicks}/15 clicks]`
                      }
                      style={{
                        position: 'absolute',
                        top: '-36px',
                        width: '66px',
                        height: '66px',
                        borderRadius: '50%',
                        cursor: isCurrentUser ? 'default' : isCoolingDown ? 'not-allowed' : 'pointer',
                        transform: isBouncing
                          ? 'scale(1.25) translateY(-6px)'
                          : 'scale(1) translateY(0)',
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                        zIndex: 20,
                        filter: isCurrentUser
                          ? 'drop-shadow(0 0 12px #38bdf8)'
                          : isLeader
                          ? 'drop-shadow(0 0 14px #fbbf24)'
                          : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
                        opacity: isCoolingDown ? 0.15 : 1,
                      }}
                    >
                      {/* Leader Crown Badge */}
                      {isLeader && !isCoolingDown && (
                        <div style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '1.35rem',
                          animation: 'bounceSlow 2s infinite',
                          zIndex: 25,
                        }}>
                          👑
                        </div>
                      )}

                      {/* "YOU" Tag */}
                      {isCurrentUser && !isCoolingDown && (
                        <div style={{
                          position: 'absolute',
                          top: '-16px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#38bdf8',
                          color: '#0f172a',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          padding: '1px 7px',
                          borderRadius: '8px',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 10px rgba(56, 189, 248, 0.9)',
                          zIndex: 25,
                        }}>
                          YOU
                        </div>
                      )}

                      {/* 15-Click Progress Badge on Opponents */}
                      {!isCurrentUser && currentClicks > 0 && !isCoolingDown && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          background: '#ec4899',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 5px',
                          borderRadius: '10px',
                          boxShadow: '0 2px 6px rgba(236, 72, 153, 0.6)',
                          zIndex: 26,
                        }}>
                          {currentClicks}/15
                        </div>
                      )}

                      {/* Face Image Circle */}
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: isCurrentUser
                            ? '3px solid #38bdf8'
                            : isLeader
                            ? '3px solid #fbbf24'
                            : '2.5px solid rgba(255, 255, 255, 0.85)',
                          background: '#0f172a',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        <img
                          src={getFullMediaUrl(bar.avatar_url)}
                          alt={bar.display_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {/* Pulsing Target Ring on Opponents */}
                      {!isCurrentUser && !isCoolingDown && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: '-4px',
                            borderRadius: '50%',
                            border: '2px solid rgba(56, 189, 248, 0.5)',
                            animation: 'pulseGlow 2s infinite',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>

                    {/* 5-Second Cooldown Overlay when 15 clicks reached */}
                    {isCoolingDown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-36px',
                          width: '66px',
                          height: '66px',
                          borderRadius: '50%',
                          background: 'rgba(15, 23, 42, 0.92)',
                          border: '2px dashed #f59e0b',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 30,
                          animation: 'slideUp 0.2s ease',
                          boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        <Clock size={16} color="#fbbf24" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                          {remainingSec}s
                        </span>
                      </div>
                    )}

                    {/* Points Pill Inside Bar */}
                    <div style={{
                      marginTop: 'auto',
                      marginBottom: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
                      textAlign: 'center',
                    }}>
                      {bar.daily_points}
                    </div>
                  </div>

                  {/* Player Label & Rank at Bottom of Bar */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-46px',
                    textAlign: 'center',
                    width: '95px',
                  }}>
                    <div style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isCurrentUser ? '#38bdf8' : '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {bar.display_name}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: isLeader ? '#fbbf24' : 'var(--text-muted)',
                      fontWeight: 700,
                    }}>
                      {bar.rank === 1 ? '🥇 #1' : bar.rank === 2 ? '🥈 #2' : bar.rank === 3 ? '🥉 #3' : `#${bar.rank}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar Info / Tips */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '10px',
          borderTop: '1px solid var(--border-glass)',
          paddingTop: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>Click any rival's avatar face for <strong>+10 points</strong>. After <strong>15 continuous clicks</strong>, player disappears for <strong>5s</strong>!</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#38bdf8' }} />
              <span>Your Bar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#fbbf24' }} />
              <span>Leader (#1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
