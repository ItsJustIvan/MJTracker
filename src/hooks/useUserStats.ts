import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type StatsData = {
  maxHand: number;
  maxPayout: number;
  totalPoints: number;
  maxStreak: number;
  gamesPlayed: number;
};

export function useUserStats(userId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>('lifetime');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<string, StatsData>>({});
  const [profileData, setProfileData] = useState<StatsData | null>(null);

  // 1. Initial Data Fetch (Lifetime and List of Months)
  useEffect(() => {
    if (!userId) return;

    async function fetchInitialData() {
      setLoading(true);
      
      // Fetch lifetime stats from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('lifetime_max_hand, lifetime_max_payout, lifetime_total_points, lifetime_max_streak, total_games_played')
        .eq('id', userId)
        .single();

      if (profile) {
        setProfileData({
          maxHand: profile.lifetime_max_hand || 0,
          maxPayout: profile.lifetime_max_payout || 0,
          totalPoints: Number(profile.lifetime_total_points) || 0,
          maxStreak: profile.lifetime_max_streak || 0,
          gamesPlayed: profile.total_games_played || 0,
        });
      }

      // Fetch list of available seasons from monthly_stats
      const { data: months } = await supabase
        .from('monthly_stats')
        .select('month_year')
        .eq('user_id', userId)
        .order('month_year', { ascending: false });

      if (months) {
        const monthStrings = months.map(m => m.month_year);
        setAvailableSeasons(monthStrings);
      }
      
      setLoading(false);
    }

    fetchInitialData();
  }, [userId]);

  // 2. Fetch specific month data if not already cached
  useEffect(() => {
    if (!userId || selectedSeason === 'lifetime' || monthlyData[selectedSeason]) return;

    async function fetchSeasonData() {
      const { data } = await supabase
        .from('monthly_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', selectedSeason)
        .single();

      if (data) {
        setMonthlyData(prev => ({
          ...prev,
          [selectedSeason]: {
            maxHand: data.max_hand_score,
            maxPayout: data.max_payout_gain,
            totalPoints: Number(data.total_points_earned),
            maxStreak: data.max_dealer_streak,
            gamesPlayed: data.games_played,
          }
        }));
      }
    }

    fetchSeasonData();
  }, [selectedSeason, userId, monthlyData]);

  // 3. Derived current stats based on selection
  const currentStats = useMemo(() => {
    if (selectedSeason === 'lifetime') return profileData;
    return monthlyData[selectedSeason] || null;
  }, [selectedSeason, profileData, monthlyData]);

  return {
    stats: currentStats,
    selectedSeason,
    setSelectedSeason,
    availableSeasons,
    loading
  };
}