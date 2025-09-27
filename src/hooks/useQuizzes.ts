// hooks/useQuizzes.ts
import { useState, useCallback } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";

export function useQuizzes() {
  const { supabase, session } = useSupabase();
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState<number | "N/A">("N/A");
  const [loading, setLoading] = useState(true);

  const fetchQuizzesData = useCallback(
    async (opts?: { skipLoading?: boolean }) => {
      if (!supabase || !session) return;
      if (!opts?.skipLoading) setLoading(true);

      try {
        const { count } = await supabase
          .from("quizzes")
          .select("*", { count: "exact", head: true })
          .eq("is_deleted", false);
        setTotalQuizzes(count || 0);

        const { data } = await supabase
          .from("user_quizzes")
          .select(
            `id, score, completed_at, quizzes!inner(id, title, is_deleted)`
          )
          .order("completed_at", { ascending: false })
          .limit(5);

        const filtered = (data || []).filter(
          (uq: any) => uq.quizzes && !uq.quizzes.is_deleted
        );
        setRecent(filtered);

        const scores = filtered.map((uq: any) => uq.score).filter(Boolean);
        setAverageScore(
          scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : "N/A"
        );
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
        setTotalQuizzes(0);
        setRecent([]);
        setAverageScore("N/A");
      } finally {
        if (!opts?.skipLoading) setLoading(false);
      }
    },
    [supabase, session]
  );

  return { totalQuizzes, recent, averageScore, fetchQuizzesData, loading };
}
