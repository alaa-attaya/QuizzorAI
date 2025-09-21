import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useTopicsStore, Topic } from "@/stores/topicsStore";
import { useSubjectsStore, Subject } from "@/stores/subjectsStore";

export default function SubjectTopicsPage() {
  const router = useRouter();
  const { subjectId, name } = useLocalSearchParams<{
    subjectId: string;
    name?: string;
  }>();
  const { supabase, session } = useSupabase();

  const topics = useTopicsStore((s) => s.topicsBySubject(subjectId!));
  const setTopics = useTopicsStore((s) => s.setTopics);

  const [subject, setSubject] = useState<Subject | null>(
    name
      ? {
          id: subjectId!,
          name,
          description: "",
          created_by: "",
          is_deleted: false,
          is_public: false,
        }
      : null
  );
  const [loading, setLoading] = useState(true); // initial loader
  const [refreshing, setRefreshing] = useState(false); // manual pull-to-refresh
  const [search, setSearch] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateTo = async (path: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await router.push(path);
    } catch (err) {
      console.error("Navigation error:", err);
    } finally {
      setIsNavigating(false);
    }
  };

  // --- Fetch subject ---
  const fetchSubject = useCallback(async () => {
    if (!supabase || !session || !subjectId) return;
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single();
      if (!error && data) setSubject(data);
    } catch (err) {
      console.error(err);
    }
  }, [supabase, session, subjectId]);

  // --- Fetch topics ---
  const fetchTopics = useCallback(
    async (manualRefresh = false) => {
      if (!supabase || !session || !subjectId) return;

      if (manualRefresh) setRefreshing(true);
      try {
        const { data, error } = await supabase
          .from("topics")
          .select("*")
          .eq("subject_id", subjectId)
          .order("name", { ascending: true });
        if (!error && data) {
          const activeTopics = (data as Topic[]).filter((t) => !t.is_deleted);
          setTopics(subjectId, activeTopics);
        }
      } catch (err) {
        console.error(err);
        setTopics(subjectId!, []);
      } finally {
        if (manualRefresh) setRefreshing(false);
        setLoading(false); // stop initial loader
      }
    },
    [supabase, session, subjectId, setTopics]
  );

  useEffect(() => {
    fetchSubject();
    fetchTopics(); // initial fetch
  }, [fetchSubject, fetchTopics]);

  const onRefresh = () => fetchTopics(true);

  const filteredTopics = useMemo(() => {
    if (!search) return topics;
    return topics.filter((t) =>
      t.name.toLowerCase().startsWith(search.toLowerCase())
    );
  }, [topics, search]);

  const clearSearch = () => setSearch("");

  const handleEdit = (topic: Topic) => {
    if (topic.created_by !== session?.user.id) return;
    navigateTo(`/subjects/${subjectId}/edit-topic?topicId=${topic.id}`);
  };

  const renderTopic = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      onPress={() =>
        navigateTo(
          `/subjects/${subjectId}/topics/${item.id}?name=${encodeURIComponent(
            item.name
          )}`
        )
      }
      className="bg-white rounded-xl mb-3 p-3 shadow-sm flex-row justify-between items-center"
      activeOpacity={0.9}
    >
      <View className="flex-1 pr-3">
        <View className="flex-row items-center mb-1 flex-wrap">
          <Text className="font-semibold text-base text-gray-900 mr-2">
            {item.name}
          </Text>
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
        <Text className="text-gray-500 text-sm">
          {item.description || "No description"}
        </Text>
      </View>

      {item.created_by === session?.user.id && (
        <TouchableOpacity
          onPress={() => handleEdit(item)}
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
        title={subject?.name ?? "Topics"}
        leftButton={{ onPress: () => router.back() }}
      />

      {/* --- Full-screen loader during initial fetch --- */}
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
                placeholder="Search topics..."
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
                navigateTo(`/subjects/${subjectId}/generate-topic`)
              }
              disabled={isNavigating}
              className="bg-blue-600 rounded-xl flex-row items-center justify-center ml-3 h-12 px-4"
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add</Text>
            </TouchableOpacity>
          </View>

          {/* Topics List with manual pull-to-refresh */}
          <FlatList
            data={filteredTopics}
            keyExtractor={(item) => item.id}
            renderItem={renderTopic}
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
                  {search ? "No topics match your search." : "No topics yet."}
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
