'use client';

import React, { useState, useEffect } from 'react';
import { api, getFullMediaUrl } from '@/lib/api';
import { HistorySummaryItem, DailyRecordDetail } from '@/lib/types';
import { X, Calendar, Trophy, Medal, Award, Flame, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRolloverSuccess?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onRolloverSuccess,
}) => {
  const [historyList, setHistoryList] = useState<HistorySummaryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<DailyRecordDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolloverLoading, setRolloverLoading] = useState(false);
  const [rolloverMsg, setRolloverMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistoryList();
      setHistoryList(data);
      if (data.length > 0 && !selectedDate) {
        selectDate(data[0].date);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectDate = async (date: string) => {
    setSelectedDate(date);
    try {
      const res = await api.getHistoryDetail(date);
      setDayDetails(res.standings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollover = async () => {
    if (!confirm("Are you sure you want to archive today's scores and start a fresh day?")) return;
    setRolloverLoading(true);
    try {
      const res = await api.rolloverDay();
      setRolloverMsg(res.message);
      await loadHistory();
      if (onRolloverSuccess) onRolloverSuccess();
      setTimeout(() => setRolloverMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Rollover failed');
    } finally {
      setRolloverLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel modal-content"
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          borderRadius: '24px',
          padding: '28px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
            }}>
              <Trophy size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Daily Leaderboard History</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical daily standings and end-of-day champions</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleRollover}
              disabled={rolloverLoading}
              className="btn-secondary"
              title="Archive current day scores & start new day"
              style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <RefreshCw size={14} className={rolloverLoading ? 'spin' : ''} color="#fbbf24" />
              <span>{rolloverLoading ? 'Archiving...' : 'Rollover Today'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
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
          </div>
        </div>

        {rolloverMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#6ee7b7',
            fontSize: '0.85rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} />
            {rolloverMsg}
          </div>
        )}

        {/* Content Body: Sidebar Date List + Main View */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Date Selector Sidebar */}
          <div style={{
            width: '240px',
            borderRight: '1px solid var(--border-glass)',
            paddingRight: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Archived Days ({historyList.length})
            </div>

            {historyList.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No past daily records yet. Click "Rollover Today" to archive today's scores.
              </div>
            ) : (
              historyList.map((item) => {
                const isSelected = selectedDate === item.date;
                const winner = item.podium.find((p) => p.rank === 1);
                return (
                  <button
                    key={item.date}
                    onClick={() => selectDate(item.date)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '14px',
                      border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.05)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                      <Calendar size={14} color="#38bdf8" />
                      {item.date}
                    </div>
                    {winner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: '#fbbf24' }}>
                        <span>👑 {winner.display_name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({winner.points} pts)</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Main Standings View */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {selectedDate && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    Final Standings for <span style={{ color: '#38bdf8' }}>{selectedDate}</span>
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {dayDetails.length} Participants
                  </span>
                </div>

                {/* Top 3 Podium Cards */}
                {dayDetails.length >= 3 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '20px',
                  }}>
                    {/* Rank 2 */}
                    <div style={{
                      background: 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🥈</div>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 8px', overflow: 'hidden', border: '2px solid #94a3b8' }}>
                        <img src={getFullMediaUrl(dayDetails[1].avatar_url)} alt="rank2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{dayDetails[1].display_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{dayDetails[1].points} pts</div>
                    </div>

                    {/* Rank 1 */}
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '2px solid rgba(245, 158, 11, 0.5)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'center',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '4px' }}>👑 🥇</div>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px', overflow: 'hidden', border: '3px solid #fbbf24' }}>
                        <img src={getFullMediaUrl(dayDetails[0].avatar_url)} alt="rank1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fbbf24' }}>{dayDetails[0].display_name}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>{dayDetails[0].points} pts</div>
                    </div>

                    {/* Rank 3 */}
                    <div style={{
                      background: 'rgba(217, 119, 6, 0.1)',
                      border: '1px solid rgba(217, 119, 6, 0.3)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🥉</div>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 8px', overflow: 'hidden', border: '2px solid #d97706' }}>
                        <img src={getFullMediaUrl(dayDetails[2].avatar_url)} alt="rank3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{dayDetails[2].display_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#d97706' }}>{dayDetails[2].points} pts</div>
                    </div>
                  </div>
                )}

                {/* Ranked Standings Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Rank</th>
                      <th style={{ padding: '10px' }}>Player</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Score</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Clicks Given</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Clicks Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayDetails.map((record) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px', fontWeight: 800 }}>
                          {record.rank === 1 ? '🥇 #1' : record.rank === 2 ? '🥈 #2' : record.rank === 3 ? '🥉 #3' : `#${record.rank}`}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={getFullMediaUrl(record.avatar_url)}
                              alt={record.display_name}
                              style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{record.display_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>@{record.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                          {record.points} pts
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#ec4899' }}>
                          {record.clicks_given}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#34d399' }}>
                          {record.clicks_received}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
