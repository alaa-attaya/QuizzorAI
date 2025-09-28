import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Header } from "@/components/Header";

export type QuizWithTags = {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  tags?: string[];
  created_by: string;
};

export default function QuizzesListPage() {
  const router = useRouter();
  const { session } = useSupabase();
  const queryClient = useQueryClient();

  const { data: quizzes = [], loading, refetch } = useQuizzes();

  const [searchText, setSearchText] = useState("");
  const [searchMode, setSearchMode] = useState<"title" | "tags">("title");
  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const quizzesToShow = useMemo(() => {
    if (!searchText) return quizzes;
    const lowerSearch = searchText.toLowerCase();
    if (searchMode === "tags") {
      return quizzes.filter((q) =>
        q.tags?.some((tag) => tag.toLowerCase().includes(lowerSearch))
      );
    }
    return quizzes.filter((q) => q.title.toLowerCase().includes(lowerSearch));
  }, [quizzes, searchText, searchMode]);

  const clearSearch = () => setSearchText("");

  const navigateTo = useCallback(
    async (path: string) => {
      if (isNavigating) return;
      setIsNavigating(true);
      try {
        router.push(path);
      } finally {
        setIsNavigating(false);
      }
    },
    [isNavigating, router]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      queryClient.invalidateQueries({
        queryKey: ["dashboard-quizzes", session?.user?.id],
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (quiz: QuizWithTags) => {
    if (quiz.created_by === session?.user?.id) {
      navigateTo(`/quizzes/edit-quiz?id=${quiz.id}`);
    }
  };

  const renderQuiz = ({ item }: { item: QuizWithTags }) => (
    <TouchableOpacity
      onPress={() => navigateTo(`/quizzes/${item.id}`)}
      className="bg-white rounded-xl mb-3 p-3 flex-row items-start justify-between shadow-sm border border-gray-100"
      activeOpacity={0.9}
    >
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-base text-gray-900 mb-1">
          {item.title}
        </Text>
        <Text className="text-gray-500 text-sm mb-2">
          {item.description || "No description"}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <View className="flex-row flex-wrap mb-2">
            {item.tags.map((tag) => (
              <View
                key={tag}
                className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-2"
              >
                <Text className="text-blue-700 text-xs font-medium">{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View
          className={`px-2 py-0.5 rounded-full ${
            item.is_public ? "bg-green-100" : "bg-gray-200"
          } self-start`}
        >
          <Text
            className={`text-xs font-semibold ${
              item.is_public ? "text-green-700" : "text-gray-600"
            }`}
          >
            {item.is_public ? "Public" : "Private"}
          </Text>
        </View>
      </View>

      {item.created_by === session?.user?.id && (
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          disabled={isNavigating}
          className="bg-gray-50 rounded-full p-3 shadow"
          activeOpacity={0.8}
        >
          <Feather name="edit" size={16} color="#2563EB" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-gray-100">
      <Header title="Quizzes" />

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center mt-8">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <View className="flex-1">
          {/* Search + Add */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white rounded-xl border border-gray-300 h-12 px-3">
              {/* Search Icon */}
              <Feather name="search" size={18} color="#9CA3AF" />

              {/* Text Input */}
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder={
                  searchMode === "title"
                    ? "Search by title..."
                    : "Search by tags..."
                }
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-gray-900 text-base"
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                style={{ height: "100%" }}
              />

              {/* Clear Text Button */}
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  className="ml-2"
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}

              {/* Title/Tags Toggle - unified style */}
              <TouchableOpacity
                onPress={() =>
                  setSearchMode(searchMode === "title" ? "tags" : "title")
                }
                className="ml-2 px-3 py-1 bg-gray-100 rounded-md border border-gray-300"
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 text-sm font-medium">
                  {searchMode === "title" ? "Title" : "Tags"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigateTo("/quizzes/create-quiz")}
              disabled={isNavigating}
              className="bg-blue-600 rounded-xl flex-row items-center justify-center ml-3 h-12 px-4"
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add</Text>
            </TouchableOpacity>
          </View>

          {/* Quizzes List */}
          <FlatList
            data={quizzesToShow}
            keyExtractor={(item) => item.id}
            renderItem={renderQuiz}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 16,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#2563EB"
                colors={["#2563EB"]}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center px-6 mt-10">
                <Text className="text-gray-500 text-center">
                  {searchText
                    ? "No quizzes match your search."
                    : "No quizzes created yet."}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
