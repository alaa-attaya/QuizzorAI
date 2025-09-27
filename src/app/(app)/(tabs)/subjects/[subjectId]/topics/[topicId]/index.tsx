import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useQuizzesStore, Quiz } from "@/stores/quizzesStore";

export default function TopicQuizzesPage() {
  const router = useRouter();
  const { subjectId, topicId, name } = useLocalSearchParams<{
    subjectId: string;
    topicId: string;
    name?: string;
  }>();
  const { supabase, session } = useSupabase();

  const quizzes = useQuizzesStore((s) => s.quizzesByTopic(topicId!));
  const setQuizzes = useQuizzesStore((s) => s.setQuizzes);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateTo = async (path: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await router.push(path);
    } finally {
      setIsNavigating(false);
    }
  };

  // Fetch quizzes
  const fetchQuizzes = useCallback(
    async (manual = false) => {
      if (!supabase || !session || !topicId) return;
      if (manual) setRefreshing(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("topic_id", topicId)
          .order("title", { ascending: true });
        if (!error && data) {
          setQuizzes(
            topicId,
            (data as Quiz[]).filter((q) => !q.is_deleted)
          );
        }
      } catch (err) {
        console.error(err);
        setQuizzes(topicId, []);
      } finally {
        if (manual) setRefreshing(false);
        setLoading(false);
      }
    },
    [supabase, session, topicId, setQuizzes]
  );

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const onRefresh = () => fetchQuizzes(true);

  const filtered = useMemo(() => {
    if (!search) return quizzes;
    return quizzes.filter((q) =>
      q.title.toLowerCase().startsWith(search.toLowerCase())
    );
  }, [quizzes, search]);

  const clearSearch = () => setSearch("");

  const renderQuiz = ({ item }: { item: Quiz }) => (
    <TouchableOpacity
      onPress={() =>
        navigateTo(
          `/subjects/${subjectId}/topics/${topicId}/quizzes/${item.id}?name=${encodeURIComponent(
            item.title
          )}`
        )
      }
      className="bg-white rounded-xl mb-3 p-3 shadow-sm flex-row justify-between items-center"
      activeOpacity={0.9}
    >
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-base text-gray-900 mb-1">
          {item.title}
        </Text>
        <Text className="text-gray-500 text-sm">
          {item.description || "No description"}
        </Text>
      </View>

      {item.created_by === session?.user.id && (
        <TouchableOpacity
          onPress={() =>
            navigateTo(
              `/subjects/${subjectId}/topics/${topicId}/edit-quiz?quizId=${item.id}`
            )
          }
          disabled={isNavigating}
          className="bg-gray-50 rounded-full p-3 shadow"
        >
          <Feather name="edit" size={16} color="#2563EB" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-gray-100"
      edges={["bottom", "left", "right"]}
    >
      <Header
        title={name ?? "Quizzes"}
        leftButton={{ onPress: () => router.back() }}
      />

      {loading ? (
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
                value={search}
                onChangeText={setSearch}
                placeholder="Search quizzes..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-gray-900 text-base"
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                style={{ height: "100%" }}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={clearSearch} className="ml-2">
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() =>
                navigateTo(
                  `/subjects/${subjectId}/topics/${topicId}/generate-quiz`
                )
              }
              disabled={isNavigating}
              className="bg-blue-600 rounded-xl flex-row items-center justify-center ml-3 h-12 px-4"
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderQuiz}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#2563EB"
                colors={["#2563EB"]}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 16,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center px-6 mt-10">
                <Text className="text-gray-500 text-center">
                  {search ? "No quizzes match your search." : "No quizzes yet."}
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
