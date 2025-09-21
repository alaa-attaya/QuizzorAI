import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useSubjectsStore, Subject } from "@/stores/subjectsStore";

export default function SubjectsListPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const subjects = useSubjectsStore((s) => s.subjects);
  const setSubjects = useSubjectsStore((s) => s.setSubjects);

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true); // initial loader
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh
  const [isNavigating, setIsNavigating] = useState(false);

  // --- Fetch subjects ---
  const fetchSubjects = useCallback(
    async (manualRefresh = false) => {
      if (!supabase || !session) return;

      if (manualRefresh) setRefreshing(true);
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("name", { ascending: true });
        if (error) throw error;

        const activeSubjects = (data || []).filter((s) => !s.is_deleted);
        setSubjects(activeSubjects);
      } catch (err) {
        console.error(err);
        setSubjects([]);
      } finally {
        if (manualRefresh) setRefreshing(false);
        setLoading(false);
      }
    },
    [supabase, session, setSubjects]
  );

  useEffect(() => {
    fetchSubjects(); // initial fetch
  }, [fetchSubjects]);

  const onRefresh = () => fetchSubjects(true);

  // --- Filter subjects by search ---
  const subjectsToShow = useMemo(() => {
    if (!searchText) return subjects;
    return subjects.filter((s) =>
      s.name.toLowerCase().startsWith(searchText.toLowerCase())
    );
  }, [subjects, searchText]);

  const clearSearch = () => setSearchText("");

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

  const handleEdit = (item: Subject) => {
    if (item.created_by !== session?.user.id) return;
    navigateTo(`/subjects/edit-subject?id=${item.id}`);
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      onPress={() =>
        navigateTo(`/subjects/${item.id}?name=${encodeURIComponent(item.name)}`)
      }
      className="bg-white rounded-xl mb-3 p-3 flex-row items-center justify-between shadow-sm"
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
        <Text className="text-gray-500 text-sm mt-1">
          {item.description || "No description"}
        </Text>
      </View>

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
      {/* Header is always visible */}
      <Header title="Subjects" />

      {/* Loader below header */}
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
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search subjects..."
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
              onPress={() => navigateTo("/subjects/create-subject")}
              disabled={isNavigating}
              className="bg-blue-600 rounded-xl flex-row items-center justify-center ml-3 h-12 px-4"
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add</Text>
            </TouchableOpacity>
          </View>

          {/* Subjects List */}
          <FlatList
            data={subjectsToShow}
            keyExtractor={(item) => item.id}
            renderItem={renderSubject}
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
                    ? "No subjects match your search."
                    : "No subjects created yet."}
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
