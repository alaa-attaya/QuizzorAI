// src/pages/quizzes/create-quiz.tsx
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
  tags: string[];
  created_by: string;
};

export default function CreateQuizPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // tags state
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
            tags: tags.length > 0 ? tags : [],
          },
        ])
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

      router.back(); // ✅ go back to /quizzes without stacking
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to create quiz.", [
        { text: "OK", onPress: () => router.dismissAll() }, // ✅ reset stack if needed
      ]);
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
            leftButton={{ onPress: () => router.dismissAll() }} // ✅ cancel button nukes stack
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
            {/* Description Multiline */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional"
                multiline
                scrollEnabled
                textAlignVertical="top"
                editable={!isPending}
                maxLength={100} // optional character limit
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
                style={{ height: 80 }} // roughly 4 lines
              />
              <Text className="text-gray-400 text-sm mt-1 text-right">
                {description.length} / 100
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
                  editable={!isPending}
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
              <Text className="text-gray-700 font-medium text-lg">Public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                thumbColor={isPublic ? "#2563EB" : "#f4f3f4"}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                disabled={isPending}
              />
            </View>

            {/* Submit */}
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
