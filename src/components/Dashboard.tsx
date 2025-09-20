// src/components/Dashboard.tsx
import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useSubjectsStore } from "@/stores/subjectsStore";

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
  const stats = useDashboardStore((s) => s.stats);
  const setStats = useDashboardStore((s) => s.setStats);

  const [recent, setRecent] = useState<UserQuiz[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- Fetch subjects from Supabase ---
  const fetchSubjects = useCallback(async () => {
    if (!supabase || !session) return;

    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubjects(data || []); // overwrite Zustand
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  }, [supabase, session, setSubjects]);

  // --- Fetch recent quizzes ---
  const fetchRecent = useCallback(async () => {
    if (!supabase || !session) return;

    try {
      const { data, error } = await supabase
        .from("user_quizzes")
        .select("id, score, completed_at, quizzes(id, title, is_deleted)")
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
        .filter(Boolean);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : "N/A";

      setStats((prev) => ({ ...prev, averageScore: avgScore }));
    } catch (err) {
      console.error("Failed to fetch recent quizzes:", err);
      setRecent([]);
      setStats((prev) => ({ ...prev, averageScore: "N/A" }));
    }
  }, [supabase, session, setStats]);

  // --- Stats auto-update on Zustand changes ---
  useEffect(() => {
    setStats((prev) => ({ ...prev, subjects: subjects.length }));
  }, [subjects, setStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSubjects(), fetchRecent()]);
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh(); // fetch fresh on mount
  }, []);

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
      {/* Stats Card */}
      <View className="mx-4 mt-6 bg-white rounded-2xl shadow p-5">
        <Text className="text-xl font-bold mb-4">Your Stats</Text>
        <View className="flex-row justify-between">
          {[
            { icon: "book", label: "Subjects", value: subjects.length },
            { icon: "layers", label: "Topics", value: stats.topics },
            { icon: "file-text", label: "Quizzes", value: stats.quizzes },
            { icon: "award", label: "Avg Score", value: stats.averageScore },
          ].map((item) => (
            <View key={item.label} className="items-center">
              <Feather name={item.icon as any} size={28} color="#2563EB" />
              <Text className="text-gray-700 mt-2">{item.value}</Text>
              <Text className="text-gray-400 text-xs">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="mx-4 mt-6">
        {[
          {
            icon: "zap",
            title: "Generate Quiz",
            subtitle: "Create a new AI-generated quiz",
            path: "/generate-quiz",
          },
          {
            icon: "list",
            title: "My Quizzes",
            subtitle: "View all your quizzes",
            path: "/quizzes",
          },
          {
            icon: "globe",
            title: "Browse Quizzes",
            subtitle: "Check out quizzes shared by other users",
            path: "/public-quizzes",
          },
          {
            icon: "bar-chart-2",
            title: "Statistics",
            subtitle: "View performance insights",
            path: "/stats",
          },
        ].map((action) => (
          <View key={action.title} className="mb-4">
            <TouchableOpacity
              className="bg-white rounded-xl shadow flex-row items-center p-4"
              onPress={() => router.push(action.path)}
            >
              <Feather name={action.icon as any} size={24} color="#2563EB" />
              <View className="ml-3">
                <Text className="text-lg font-semibold">{action.title}</Text>
                <Text className="text-gray-500 text-sm">{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Recent Quizzes */}
      <View className="mx-4 mt-6">
        <Text className="text-xl font-bold mb-3">Recent Quizzes</Text>
        {recent.length ? (
          recent.map((uq) => (
            <View
              key={uq.id}
              className="bg-white rounded-xl p-4 shadow mb-3 flex-row justify-between items-center"
            >
              <View>
                <Text className="font-semibold">
                  {uq.quizzes?.title ?? "Untitled Quiz"}
                </Text>
                <Text className="text-gray-500 text-sm">
                  Score: {uq.score ?? "N/A"}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs">
                {uq.completed_at
                  ? new Date(uq.completed_at).toLocaleDateString()
                  : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-500">No recent quizzes yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}
