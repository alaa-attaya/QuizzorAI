// hooks/useQuizzes.ts
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/providers/SupabaseProvider";

export type Quiz = {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  is_deleted?: boolean;
  created_by: string;
  tags?: string[]; // <--- optional tags
};

export function useQuizzes() {
  const { supabase, session } = useSupabase();

  const query = useQuery<Quiz[]>({
    queryKey: ["quizzes", session?.user?.id],
    queryFn: async () => {
      if (!supabase || !session) return [];

      // Fetch quizzes
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("is_deleted", false)
        .order("title", { ascending: true });

      if (error) throw error;

      // Add optional empty tags array to each quiz
      return (data || []).map((q) => ({
        ...q,
        tags: q.tags || [], // keep tags if present, or default to []
      }));
    },
    enabled: !!supabase && !!session,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    ...query,
    loading: query.isLoading || query.isFetching,
  };
}
