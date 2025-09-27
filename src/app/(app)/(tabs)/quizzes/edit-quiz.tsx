// src/pages/quizzes/edit-quiz.tsx
import React, { useEffect, useState } from "react";
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
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [isPublic, setIsPublic] = useState(true);

  // Fetch quiz
  useEffect(() => {
    if (!id || !session) {
      router.push("/quizzes");
      return;
    }

    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("id, title, description, is_public, is_deleted, created_by")
          .eq("id", id)
          .single();

        if (
          error ||
          !data ||
          data.is_deleted ||
          data.created_by !== session.user.id
        ) {
          Alert.alert("Cannot edit", "This quiz cannot be edited.", [
            { text: "OK", onPress: () => router.push("/quizzes") },
          ]);
          return;
        }

        setTitle(data.title);
        setDescription(data.description ?? "");
        setIsPublic(data.is_public ?? true);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load quiz.", [
          { text: "OK", onPress: () => router.push("/quizzes") },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, supabase, session, router]);

  // Save quiz
  const handleSave = async () => {
    if (saving || !title.trim() || !supabase) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description?.trim() || null,
        is_public: isPublic,
      };

      const { data, error } = await supabase
        .from("quizzes")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      router.push("/quizzes");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update quiz.");
    } finally {
      setSaving(false);
    }
  };

  // Delete quiz
  const handleDelete = async () => {
    if (!supabase) return;

    Alert.alert("Delete quiz", "Are you sure you want to delete this quiz?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            const { data, error } = await supabase
              .from("quizzes")
              .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
              })
              .eq("id", id)
              .select()
              .single();

            if (!error && data) {
              router.push("/quizzes");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete quiz.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <SafeAreaView
        className="flex-1 bg-gray-100"
        edges={["bottom", "left", "right"]}
      >
        <Header
          title="Edit Quiz"
          leftButton={{ onPress: () => router.push("/quizzes") }}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );

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
            leftButton={{ onPress: () => router.push("/quizzes") }}
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
                editable={!saving}
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
                editable={!saving}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
              />
            </View>

            {/* Public / Private Switch */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium text-lg">Public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                thumbColor={isPublic ? "#2563EB" : "#f4f3f4"}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                disabled={saving}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
              className={`py-4 rounded-xl flex-row items-center justify-center px-6 ${
                saving ? "bg-blue-400 opacity-70" : "bg-blue-600"
              }`}
            >
              <View className="w-6 flex items-center justify-center">
                {saving ? (
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
              onPress={handleDelete}
              disabled={saving}
              activeOpacity={0.8}
              className={`mt-4 py-4 rounded-xl flex-row items-center justify-center px-6 ${
                saving ? "bg-red-400 opacity-70" : "bg-red-600"
              }`}
            >
              <View className="w-6 flex items-center justify-center">
                {saving ? (
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
