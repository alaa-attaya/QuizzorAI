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
};

export function useQuizzes() {
  const { supabase, session } = useSupabase();

  const query = useQuery<Quiz[]>({
    queryKey: ["quizzes", session?.user?.id],
    queryFn: async () => {
      if (!supabase || !session) return [];

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("is_deleted", false)
        .order("title", { ascending: true });

      if (error) throw error;

      return data || [];
    },
    enabled: !!supabase && !!session,
    staleTime: 60_000, // 1 min cache
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    ...query,
    loading: query.isLoading || query.isFetching,
  };
}
