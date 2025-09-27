import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Quiz = {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  is_deleted?: boolean;
  created_by: string;
};

export default function CreateQuizPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const mutation = useMutation({
    mutationKey: ["create-quiz"],
    mutationFn: async (): Promise<Quiz> => {
      if (!supabase || !session) throw new Error("Supabase not ready");
      if (!title.trim()) throw new Error("Title is required");

      const { data, error } = await supabase
        .from("quizzes")
        .insert([
          {
            title: title.trim(),
            description: description.trim() || null,
            is_public: isPublic,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newQuiz) => {
      // Update quizzes list cache immediately
      queryClient.setQueryData<Quiz[]>(
        ["quizzes", session?.user?.id],
        (old) => [...(old || []), newQuiz]
      );

      // Invalidate dashboard stats so it refetches
      queryClient.invalidateQueries({
        queryKey: ["dashboard-quizzes", session?.user?.id],
      });

      // Navigate back to quizzes list
      router.replace("/quizzes");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to create quiz.");
    },
  });

  const isPending = mutation.status === "pending";

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
            title="Create Quiz"
            leftButton={{ onPress: () => router.replace("/quizzes") }}
          />
          <View className="bg-white m-4 rounded-2xl p-6 shadow flex-1">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              New Quiz
            </Text>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Quiz title"
                editable={!isPending}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional"
                editable={!isPending}
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
                disabled={isPending}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => mutation.mutate()}
              disabled={isPending}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                isPending ? "bg-blue-400 opacity-70" : "bg-blue-600"
              }`}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#fff" />
                  <Text className="text-white font-semibold text-lg ml-3">
                    Create Quiz
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
