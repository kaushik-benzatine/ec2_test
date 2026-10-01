'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { LiveBarChart } from '@/components/LiveBarChart';
import { ProfileModal } from '@/components/ProfileModal';
import { PasswordModal } from '@/components/PasswordModal';
import { AuthModal } from '@/components/AuthModal';
import { HistoryModal } from '@/components/HistoryModal';
import { api } from '@/lib/api';
import { UserProfile, BarItem } from '@/lib/types';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Zap, Award, Sparkles, TrendingUp, Users } from 'lucide-react';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [bars, setBars] = useState<BarItem[]>([]);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [todayDate, setTodayDate] = useState<string>('');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const prevRankRef = useRef<number | null>(null);

  // Fetch initial data & current user
  const fetchCurrentUserData = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchChartData = useCallback(async () => {
    try {
      const data = await api.getBars();
      setBars(data.bars);
      setMaxScore(data.max_score);
      setTodayDate(data.date);
      setIsRealtimeConnected(true);
    } catch (err) {
      console.error('Error fetching bars:', err);
      setIsRealtimeConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUserData();
    fetchChartData();
  }, [fetchChartData]);

  // Real-time EventSource / SSE connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      const streamUrl = api.getRealtimeStreamUrl();
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'chart_update') {
            setBars(payload.bars);
            setMaxScore(payload.max_score);
            setTodayDate(payload.date);
            setIsRealtimeConnected(true);
          }
        } catch {
          // Ignore parse errors on heartbeat
        }
      };

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    // Backup polling every 2.5s
    fallbackInterval = setInterval(() => {
      fetchChartData();
    }, 2500);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchChartData]);

  // Handle clicking an opponent's face (Option A)
  const handleFaceClick = async (targetUserId: number) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await api.clickTargetUser(targetUserId);

      // Optimistic & server update
      setBars(res.bars);
      setMaxScore(res.max_score);

      // Update current user points in header
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              daily_points: res.my_daily_points,
              points: res.my_lifetime_points,
              clicks_given: prev.clicks_given + 1,
            }
          : null
      );

      // Check if user reached #1
      if (res.my_rank === 1 && prevRankRef.current !== 1) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#ec4899', '#38bdf8'],
        });
      }
      prevRankRef.current = res.my_rank;
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    fetchChartData();
  };

  const handleSeedRivals = async () => {
    try {
      await api.seedRivals();
      fetchChartData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Find current leader & user stats
  const currentLeader = bars.find((b) => b.rank === 1);
  const myBar = currentUser ? bars.find((b) => b.user_id === currentUser.user_id) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPassword={() => setIsPasswordOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLogout={handleLogout}
        onSeedRivals={handleSeedRivals}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Main Content Arena */}
      <main style={{
        flex: 1,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Top Summary Banner Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {/* Card 1: Today's Date & Round */}
          <div className="glass-panel" style={{ borderRadius: '18px', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <TrendingUp size={16} color="#38bdf8" />
              <span>Current Round</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', color: '#f8fafc' }}>
              {todayDate || 'Today'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>
              Scores reset daily at midnight
            </div>
          </div>

          {/* Card 2: Current #1 Champion */}
          <div className="glass-panel" style={{ borderRadius: '18px', padding: '18px 22px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Trophy size={16} color="#fbbf24" />
              <span>Today's Leader</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', color: '#fbbf24' }}>
              {currentLeader ? `👑 ${currentLeader.display_name}` : 'No leader yet'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentLeader ? `${currentLeader.daily_points} points today` : 'Be the first to click!'}
            </div>
          </div>

          {/* Card 3: Your Performance */}
          <div className="glass-panel" style={{ borderRadius: '18px', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Zap size={16} color="#ec4899" />
              <span>Your Standing</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', color: '#ec4899' }}>
              {currentUser && myBar
                ? `${myBar.rank === 1 ? '🥇' : myBar.rank === 2 ? '🥈' : myBar.rank === 3 ? '🥉' : 'Rank'} #${myBar.rank} (${myBar.daily_points} pts)`
                : 'Not signed in'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentUser ? `${currentUser.clicks_given} clicks given` : 'Sign in to track your rank'}
            </div>
          </div>
        </div>

        {/* The Interactive Live Bar Chart */}
        <LiveBarChart
          bars={bars}
          maxScore={maxScore}
          currentUser={currentUser}
          onFaceClick={handleFaceClick}
          onRequireAuth={() => setIsAuthOpen(true)}
        />
      </main>

      {/* Modals */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            fetchChartData();
          }}
        />
      )}

      <PasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          fetchChartData();
        }}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRolloverSuccess={() => {
          fetchCurrentUserData();
          fetchChartData();
        }}
      />
    </div>
  );
}
