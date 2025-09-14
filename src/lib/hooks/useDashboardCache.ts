import { useState, useEffect, useCallback } from "react";
import { getItem, setItem } from "@/lib/storage";

export const useDashboardCache = (statsKey: string, recentKey: string) => {
  const [stats, setStats] = useState({
    subjects: 0,
    topics: 0,
    quizzes: 0,
    averageScore: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);

  // Load cached data once
  useEffect(() => {
    const loadCache = async () => {
      const cachedStats = await getItem(statsKey);
      const cachedRecent = await getItem(recentKey);
      if (cachedStats) setStats(cachedStats);
      if (cachedRecent) setRecent(cachedRecent);
    };
    loadCache();
  }, [statsKey, recentKey]);

  // Wrap in useCallback to prevent infinite loops
  const saveCache = useCallback(
    async (newStats: any, newRecent: any) => {
      setStats(newStats);
      setRecent(newRecent);
      await setItem(statsKey, newStats);
      await setItem(recentKey, newRecent);
    },
    [statsKey, recentKey]
  );

  return { stats, recent, saveCache };
};
