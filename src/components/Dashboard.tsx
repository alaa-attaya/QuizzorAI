import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useSubjectsStore } from "@/stores/subjectsStore";
import { useTopicsStore, Topic } from "@/stores/topicsStore";

type UserQuiz = {
  id: string;
  quizzes: { id: string; title: string } | null;
  score: number | null;
  completed_at: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const subjects = useSubjectsStore((s) => s.subjects);
  const setSubjects = useSubjectsStore((s) => s.setSubjects);

  const totalTopics = useTopicsStore((t) => t.totalTopics);
  const setTopics = useTopicsStore((t) => t.setTopics);
  const clearTopics = useTopicsStore((t) => t.clearTopics);

  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [averageScore, setAverageScore] = useState<number | string>("N/A");

  const [recent, setRecent] = useState<UserQuiz[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Fetch subjects ---
  const fetchSubjects = useCallback(async () => {
    if (!supabase || !session) return;
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setSubjects([]);
    }
  }, [supabase, session, setSubjects]);

  // --- Fetch topics ---
  const fetchTopics = useCallback(async () => {
    if (!supabase || !session) return;
    try {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // build a single map: { subjectId: Topic[] }
        const topicsBySubj: Record<string, Topic[]> = {};
        (data as Topic[]).forEach((t) => {
          if (!topicsBySubj[t.subject_id]) topicsBySubj[t.subject_id] = [];
          topicsBySubj[t.subject_id].push(t);
        });

        // atomic update: set the entire map at once
        // uses the new store action setAllTopics
        const setAllTopics = useTopicsStore.getState().setAllTopics;
        setAllTopics(topicsBySubj);
      }
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    }
  }, [supabase, session]);

  // --- Fetch quizzes count ---
  const fetchQuizzesCount = useCallback(async () => {
    if (!supabase || !session) return;
    try {
      const { count, error } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      if (error) throw error;
      setTotalQuizzes(count || 0);
    } catch (err) {
      console.error("Failed to fetch quizzes count:", err);
      setTotalQuizzes(0);
    }
  }, [supabase, session]);

  // --- Fetch recent quizzes ---
  const fetchRecent = useCallback(async () => {
    if (!supabase || !session) return;
    try {
      const { data, error } = await supabase
        .from("user_quizzes")
        .select(`id, score, completed_at, quizzes!inner(id, title, is_deleted)`)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const filtered = (data || []).filter(
        (uq: any) => uq.quizzes && !uq.quizzes.is_deleted
      );

      setRecent(
        filtered.map((uq: any) => ({
          id: uq.id,
          quizzes: uq.quizzes,
          score: uq.score ?? null,
          completed_at: uq.completed_at ?? null,
        }))
      );

      const scores = filtered
        .map((uq: any) => uq.score ?? null)
        .filter((s: number | null): s is number => s !== null);

      setAverageScore(
        scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : "N/A"
      );
    } catch (err) {
      console.error("Failed to fetch recent quizzes:", err);
      setRecent([]);
      setAverageScore("N/A");
    }
  }, [supabase, session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSubjects(),
      fetchTopics(),
      fetchQuizzesCount(),
      fetchRecent(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      await onRefresh();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const subjectCount = subjects.length;

  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2563EB"
          colors={["#2563EB"]}
          progressBackgroundColor="#F3F4F6"
        />
      }
    >
      {/* Stats */}
      <View className="mx-4 mt-6 mb-2">
        <Text className="text-lg font-bold">Your Stats</Text>
      </View>
      <View className="mx-4 bg-white rounded-2xl shadow p-4">
        <View className="flex-row justify-around">
          {[
            { icon: "book", label: "Subjects", value: subjectCount },
            { icon: "layers", label: "Topics", value: totalTopics },
            { icon: "file-text", label: "Quizzes", value: totalQuizzes },
            { icon: "award", label: "Avg Score", value: averageScore },
          ].map((item) => (
            <View key={item.label} className="items-center mx-1">
              <Feather name={item.icon as any} size={24} color="#2563EB" />
              <Text className="text-gray-700 mt-1 text-lg font-bold">
                {item.value}
              </Text>
              <Text className="text-gray-400 text-xs">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="mx-4 mt-6 mb-2">
        <Text className="text-lg font-bold">Quick Actions</Text>
      </View>
      <View className="mx-4 flex-row flex-wrap justify-between">
        {[
          {
            icon: "edit-3",
            label: "Generate Quiz",
            description: "AI generates quizzes for your topics automatically.",
            action: () => router.push("/quizzes/generate-quiz"),
          },
          {
            icon: "users",
            label: "Public Quizzes",
            description: "Browse quizzes shared by the community.",
            action: () => router.push("/quizzes/public"),
          },
          {
            icon: "bar-chart-2",
            label: "Statistics",
            description: "View detailed statistics and analytics.",
            action: () => router.push("/statistics"),
          },
          {
            icon: "plus-circle",
            label: "New Subject",
            description: "Create a new subject to start adding quizzes.",
            action: () => router.push("/subjects/create-subject"),
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.action}
            className="w-[48%] bg-white rounded-2xl p-4 mb-3 shadow"
            activeOpacity={0.85}
          >
            <View className="flex-row items-center">
              <Feather name={item.icon as any} size={20} color="#2563EB" />
              <Text className="ml-3 font-semibold text-gray-800">
                {item.label}
              </Text>
            </View>
            <Text
              className="text-gray-500 text-xs mt-1"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Quizzes */}
      <View className="mx-4 mt-6 mb-2 flex-row justify-between items-center">
        <Text className="text-lg font-bold">Recent Quizzes</Text>
        <TouchableOpacity
          onPress={() => router.push("/history")}
          className="px-3 py-1 bg-blue-50 rounded-md"
        >
          <Text className="text-blue-600 font-medium text-sm">View More →</Text>
        </TouchableOpacity>
      </View>

      {recent.length === 0 ? (
        <Text className="text-gray-500 mx-4 mb-6">
          No quizzes attempted yet.
        </Text>
      ) : (
        recent.map((uq) => (
          <TouchableOpacity
            key={uq.id}
            onPress={() => router.push(`/quizzes/${uq.quizzes?.id}`)}
            className="bg-white rounded-2xl p-4 mb-3 shadow flex-row justify-between items-center mx-4"
            activeOpacity={0.85}
          >
            <View className="flex-1">
              <Text className="font-medium text-gray-800">
                {uq.quizzes?.title}
              </Text>
              <Text className="text-sm text-gray-500">
                Score: {uq.score ?? "N/A"}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
