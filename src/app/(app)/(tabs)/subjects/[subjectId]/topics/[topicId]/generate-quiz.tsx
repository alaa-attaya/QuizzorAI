import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useQuizzesStore, Quiz } from "@/stores/quizzesStore";

export default function GenerateQuizPage() {
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { supabase, session } = useSupabase();
  const addQuizzes = useQuizzesStore((s) => s.setQuizzes);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a quiz title.");
      return;
    }
    if (!supabase || !session) return;

    setIsLoading(true);
    try {
      const payload = {
        topic_id: topicId,
        title: title.trim(),
        description: description.trim() || null,
        created_by: session.user.id,
        // is_ai_generated will default to false
      };

      const { data, error } = await supabase
        .from("quizzes")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Update store (append quiz under topic)
      addQuizzes(topicId, [data as Quiz]);

      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to create quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          className="flex-1 bg-gray-100"
          edges={["bottom", "left", "right"]}
        >
          <Header
            title="Create Quiz"
            leftButton={{ onPress: () => router.back() }}
          />

          <View className="bg-white m-4 rounded-2xl p-6 shadow flex-1">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              New Quiz
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter quiz title"
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
                editable={!isLoading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 mb-2 font-medium">
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={isLoading}
              className={`py-4 rounded-xl flex-row justify-center items-center ${
                isLoading ? "bg-blue-400 opacity-70" : "bg-blue-600"
              }`}
            >
              {isLoading ? (
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
