// hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/providers/SupabaseProvider";

export type QuizStats = {
  totalQuizzes: number;
  recent: any[];
  averageScore: number | "N/A";
  completionRate: number | "N/A";
};

export function useDashboardQuizzes() {
  const { supabase, session } = useSupabase();

  return useQuery<QuizStats>({
    queryKey: ["dashboard-quizzes", session?.user?.id],
    queryFn: async (): Promise<QuizStats> => {
      if (!supabase || !session) {
        return {
          totalQuizzes: 0,
          recent: [],
          averageScore: "N/A",
          completionRate: "N/A",
        };
      }

      const { count: totalCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      const { data: userQuizzes } = await supabase
        .from("user_quizzes")
        .select(`id, score, completed_at, quizzes!inner(id, title, is_deleted)`)
        .order("completed_at", { ascending: false });

      const filtered = (userQuizzes || []).filter(
        (uq: any) => uq.quizzes && !uq.quizzes.is_deleted
      );

      const scores = filtered.map((uq) => uq.score).filter(Boolean);
      const averageScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : "N/A";

      const completionRate =
        totalCount && totalCount > 0
          ? Math.round((filtered.length / totalCount) * 100)
          : "N/A";

      return {
        totalQuizzes: totalCount || 0,
        recent: filtered.slice(0, 5),
        averageScore,
        completionRate,
      };
    },
    enabled: !!supabase && !!session,
    staleTime: 60_000, // cache 1 min
    refetchOnWindowFocus: false,
  });
}
