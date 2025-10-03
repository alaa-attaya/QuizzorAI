// src/pages/dashboard.tsx
import React, { useState } from "react";
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
import { useDashboardQuizzes } from "@/hooks/useDashboard";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useDashboardQuizzes();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (!session?.user?.id) return;

    setRefreshing(true);
    try {
      // Refetch dashboard data
      await refetch();

      // Invalidate user-specific quizzes list
      queryClient.invalidateQueries({
        queryKey: ["quizzes", session.user.id],
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Full-screen loader on initial load
  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const totalQuizzes = data?.totalQuizzes ?? 0;
  const recent = data?.recent ?? [];
  const averageScore = data?.averageScore ?? "N/A";
  const completionRate = data?.completionRate ?? "N/A";

  const stats = [
    { icon: "file-text", label: "Quizzes", value: totalQuizzes },
    { icon: "check-circle", label: "Attempts", value: recent.length },
    { icon: "award", label: "Avg Score", value: averageScore },
    { icon: "check-square", label: "Completion", value: `${completionRate}%` },
  ];

  const quickActions = [
    {
      icon: "edit-3",
      label: "Generate Quiz",
      description: "AI generates quizzes for you automatically.",
      action: () => router.push("/quizzes/generate-quiz", { withAnchor: true }),
    },
    {
      icon: "users",
      label: "Public Quizzes",
      description: "Browse quizzes shared by the community.",
      action: () => router.push("/quizzes/public", { withAnchor: true }),
    },
    {
      icon: "bar-chart-2",
      label: "Statistics",
      description: "View detailed analytics.",
      action: () => router.push("/statistics"),
    },
    {
      icon: "plus-circle",
      label: "New Quiz",
      description: "Create a new quiz from scratch.",
      action: () => router.push("/quizzes/create-quiz", { withAnchor: true }),
    },
  ];

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
        <Text className="text-lg font-bold">Insights</Text>
      </View>
      <View className="mx-4 bg-white rounded-2xl shadow p-4">
        <View className="flex-row justify-around">
          {stats.map((item) => (
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
        {quickActions.map((item) => (
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
