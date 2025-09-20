import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
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

  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    if (!supabase || !session) return;

    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, description, is_deleted, created_by")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Only show active subjects
      const activeSubjects = (data || []).filter((s) => !s.is_deleted);
      setSubjects(activeSubjects);
    } catch (err) {
      console.error(err);
      setSubjects([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [supabase, session, setSubjects]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    setFilteredSubjects(
      searchText
        ? subjects.filter((s) =>
            s.name.toLowerCase().startsWith(searchText.toLowerCase())
          )
        : subjects
    );
  }, [subjects, searchText]);

  const clearSearch = () => setSearchText("");

  const handleEdit = (item: Subject) => {
    if (item.created_by !== session?.user.id) return;
    router.push(`/subjects/edit-subject?id=${item.id}`);
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      onPress={() => router.push(`/subjects/${item.id}`)}
      className="bg-white rounded-xl mb-3 p-3 flex-row items-center justify-between shadow-sm"
      activeOpacity={0.9}
    >
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-base text-gray-900">
          {item.name}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {item.description || "No description"}
        </Text>
      </View>
      {item.created_by === session?.user.id && (
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="bg-gray-50 rounded-full p-3 shadow"
          activeOpacity={0.8}
        >
          <Feather name="edit" size={16} color="#2563EB" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const subjectsToShow = searchText.length > 0 ? filteredSubjects : subjects;

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-gray-100">
      <Header title="Subjects" />

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
          onPress={() => router.push("/subjects/create-subject")}
          className="bg-blue-600 rounded-xl flex-row items-center justify-center ml-3 h-12 px-4"
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text className="text-white font-semibold ml-2">Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : subjectsToShow.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-500 text-center">
            {searchText
              ? "No subjects match your search."
              : "No subjects created yet."}
          </Text>
        </View>
      ) : (
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
              onRefresh={fetchSubjects}
              tintColor="#2563EB"
              colors={["#2563EB"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
