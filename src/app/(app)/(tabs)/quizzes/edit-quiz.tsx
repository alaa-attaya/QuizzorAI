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

  // Fetch quiz
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

  // Populate form on fetch success
  useEffect(() => {
    if (status === "success" && quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description ?? "");
      setIsPublic(quiz.is_public ?? true);
    }
  }, [status, quiz]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase not ready");

      const { data, error } = await supabase
        .from("quizzes")
        .update({
          title: title.trim(),
          description: description?.trim() || null,
          is_public: isPublic,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedQuiz) => {
      // Update single quiz cache
      queryClient.setQueryData(["quizzes", id], updatedQuiz);

      // Update quizzes list cache
      queryClient.setQueryData<Quiz[]>(
        ["quizzes", session?.user?.id],
        (old) => old?.map((q) => (q.id === id ? updatedQuiz : q)) ?? []
      );

      // Refresh dashboard stats
      queryClient.invalidateQueries({
        queryKey: ["dashboard-quizzes", session?.user?.id],
      });

      // Go back to list
      router.back();
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update quiz.");
    },
  });

  // Delete mutation
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
      // Remove the quiz from list cache
      queryClient.setQueryData<Quiz[]>(
        ["quizzes", session?.user?.id],
        (old) => old?.filter((q) => q.id !== id) ?? []
      );

      // Remove single quiz query so edit page won't refetch a deleted quiz
      queryClient.removeQueries({ queryKey: ["quizzes", id] });

      // Refresh dashboard stats
      queryClient.invalidateQueries({
        queryKey: ["dashboard-quizzes", session?.user?.id],
      });

      // Navigate back
      router.back();
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete quiz.");
    },
  });

  // Compute loading flag after mutations
  const isSavingOrDeleting =
    saveMutation.status === "pending" || deleteMutation.status === "pending";

  // Show loader while fetching quiz
  if (status === "pending") {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-100"
        edges={["bottom", "left", "right"]}
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
          <View className="bg-white m-4 rounded-2xl p-6 shadow flex-1">
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

            {/* Description */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Description
              </Text>
              <TextInput
                value={description ?? ""}
                onChangeText={setDescription}
                placeholder="Optional"
                editable={!isSavingOrDeleting}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
              />
            </View>

            {/* Public Toggle */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium text-lg">Public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                thumbColor={isPublic ? "#2563EB" : "#f4f3f4"}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                disabled={isSavingOrDeleting}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              disabled={isSavingOrDeleting}
              activeOpacity={0.8}
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

            {/* Delete Button */}
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
              activeOpacity={0.8}
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
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
