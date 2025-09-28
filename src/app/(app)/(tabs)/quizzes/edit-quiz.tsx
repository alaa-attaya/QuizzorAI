// src/pages/quizzes/edit-quiz.tsx
import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Header } from "@/components/Header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Quiz = {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  tags?: string[];
  is_deleted?: boolean;
  created_by: string;
};

export default function EditQuizPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params?.id ?? "";
  const { supabase, session } = useSupabase();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [isPublic, setIsPublic] = useState(true);

  // tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const clean = tagInput.trim();
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const { data: quiz, status } = useQuery({
    queryKey: ["quizzes", id],
    queryFn: async (): Promise<Quiz> => {
      if (!supabase) throw new Error("Supabase not ready");
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (
        !data ||
        error ||
        data.is_deleted ||
        data.created_by !== session?.user.id
      ) {
        throw new Error("Quiz cannot be edited");
      }

      return data;
    },
    enabled: !!id && !!supabase && !!session,
  });

  useEffect(() => {
    if (status === "success" && quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description ?? "");
      setIsPublic(quiz.is_public ?? true);
      setTags(quiz.tags || []);
    }
  }, [status, quiz]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase not ready");
      const { data, error } = await supabase
        .from("quizzes")
        .update({
          title: title.trim(),
          description: description?.trim() || null,
          is_public: isPublic,
          tags,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes", session?.user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-quizzes", session?.user?.id],
      });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update quiz.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase not ready");
      const { data, error } = await supabase
        .from("quizzes")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes", session?.user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-quizzes", session?.user?.id],
      });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete quiz.");
    },
  });

  const isSavingOrDeleting =
    saveMutation.status === "pending" || deleteMutation.status === "pending";

  if (status === "pending") {
    return (
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        className="flex-1 bg-gray-100"
      >
        <Header
          title="Edit Quiz"
          leftButton={{ onPress: () => router.back() }}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView
          edges={["bottom", "left", "right"]}
          className="flex-1 bg-gray-100"
        >
          <Header
            title="Edit Quiz"
            leftButton={{ onPress: () => router.back() }}
          />
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="bg-white rounded-2xl p-6 shadow">
              <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Modify Quiz
              </Text>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Quiz title"
                  editable={!isSavingOrDeleting}
                  className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
                />
              </View>

              {/* Description Multiline */}
              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">
                  Description
                </Text>
                <TextInput
                  value={description ?? ""}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                  editable={!isSavingOrDeleting}
                  maxLength={100} // character limit
                  className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
                  style={{
                    height: 80, // roughly 4 lines
                  }}
                />
                <Text className="text-gray-400 text-sm mt-1 text-right">
                  {description?.length ?? 0} / 100
                </Text>
              </View>

              {/* Tags */}
              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">Tags</Text>
                <View className="flex-row items-center mb-2">
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Type a tag and press +"
                    editable={!isSavingOrDeleting}
                    onSubmitEditing={addTag}
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
                  />
                  <TouchableOpacity
                    onPress={addTag}
                    disabled={!tagInput.trim()}
                    className="ml-2 bg-blue-600 px-4 py-3 rounded-xl"
                  >
                    <Feather name="plus" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap">
                  {tags.map((tag) => (
                    <View
                      key={tag}
                      className="flex-row items-center bg-blue-100 px-3 py-2 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-blue-700 font-medium mr-2">
                        {tag}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeTag(tag)}
                        className="p-1 rounded-full"
                      >
                        <Feather name="x" size={18} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Public Toggle */}
              <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-gray-700 font-medium text-lg">
                  Public
                </Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  thumbColor={isPublic ? "#22c55e" : "#f4f3f4"}
                  trackColor={{ false: "#d1d5db", true: "#86efac" }}
                  disabled={isSavingOrDeleting}
                />
              </View>

              {/* Save */}
              <TouchableOpacity
                onPress={() => saveMutation.mutate()}
                disabled={isSavingOrDeleting}
                className={`py-4 rounded-xl flex-row items-center justify-center px-6 ${
                  saveMutation.status === "pending"
                    ? "bg-blue-400 opacity-70"
                    : "bg-blue-600"
                }`}
              >
                <View className="w-6 flex items-center justify-center">
                  {saveMutation.status === "pending" ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Feather name="save" size={18} color="#fff" />
                  )}
                </View>
                <Text className="text-white font-semibold text-lg ml-3">
                  Save
                </Text>
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Delete quiz",
                    "Are you sure you want to delete this quiz?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteMutation.mutate(),
                      },
                    ]
                  )
                }
                disabled={isSavingOrDeleting}
                className={`mt-4 py-4 rounded-xl flex-row items-center justify-center px-6 ${
                  deleteMutation.status === "pending"
                    ? "bg-red-400 opacity-70"
                    : "bg-red-600"
                }`}
              >
                <View className="w-6 flex items-center justify-center">
                  {deleteMutation.status === "pending" ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Feather name="trash-2" size={18} color="#fff" />
                  )}
                </View>
                <Text className="text-white font-semibold text-lg ml-3">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
