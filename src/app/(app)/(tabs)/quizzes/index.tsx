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
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Header } from "@/components/Header";

type Quiz = {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  is_deleted?: boolean;
  created_by: string;
};

export default function QuizzesListPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    data: quizzes = [],
    isLoading,
    refetch,
  } = useQuery<Quiz[]>({
    queryKey: ["quizzes", session?.user.id],
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
  });

  const quizzesToShow = useMemo(() => {
    if (!searchText) return quizzes;
    return quizzes.filter((q) =>
      q.title.toLowerCase().startsWith(searchText.toLowerCase())
    );
  }, [quizzes, searchText]);

  const clearSearch = () => setSearchText("");

  const navigateTo = useCallback(
    async (path: string) => {
      if (isNavigating) return;
      setIsNavigating(true);
      try {
        await router.push(path);
      } finally {
        setIsNavigating(false);
      }
    },
    [isNavigating, router]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = (quiz: Quiz) => {
    if (quiz.created_by === session?.user.id) {
      navigateTo(`/quizzes/edit-quiz?id=${quiz.id}`);
    }
  };
  const renderQuiz = ({ item }: { item: Quiz }) => (
    <TouchableOpacity
      onPress={() => navigateTo(`/quizzes/${item.id}`)}
      className="bg-white rounded-xl mb-3 p-3 flex-row items-start justify-between shadow-sm border border-gray-100"
      activeOpacity={0.9}
    >
      <View className="flex-1 pr-3">
        {/* Title */}
        <Text className="font-semibold text-base text-gray-900 mb-1">
          {item.title}
        </Text>

        {/* Description */}
        <Text className="text-gray-500 text-sm mb-1">
          {item.description || "No description"}
        </Text>

        {/* Public / Private below description */}
        <View className="flex-row items-center">
          <View
            className={`w-3 h-3 rounded-full mr-1 ${
              item.is_public ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <Text
            className={`text-xs font-medium ${
              item.is_public ? "text-green-600" : "text-gray-500"
            }`}
          >
            {item.is_public ? "Public" : "Private"}
          </Text>
        </View>
      </View>

      {/* Edit button stays on the right */}
      {item.created_by === session?.user.id && (
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

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <>
          {/* Search + Add */}
          <View className="px-4 pt-4 pb-2 flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white rounded-xl border border-gray-300 h-12 px-3">
              <Feather name="search" size={18} color="#9CA3AF" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search quizzes..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-gray-900 text-base"
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                style={{ height: "100%" }}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  className="ml-2"
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
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
        </>
      )}
    </SafeAreaView>
  );
}
