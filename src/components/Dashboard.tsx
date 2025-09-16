import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useDashboardCache } from "@/lib/hooks/useDashboardCache";
import Toast from "react-native-toast-message";

export function Dashboard() {
  const router = useRouter();
  const { stats, recent } = useDashboardCache(
    "dashboard_stats",
    "dashboard_recent"
  );
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    Toast.show({
      type: "success",
      text1: "Dashboard updated",
      position: "top",
      visibilityTime: 1000,
    });
    setRefreshing(false);
  };

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
            { icon: "book", label: "Subjects", value: stats.subjects },
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
                <Text className="font-semibold">{uq.quizzes?.title}</Text>
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

export default Dashboard;
