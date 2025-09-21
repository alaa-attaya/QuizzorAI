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
import { useTopicsStore, Topic } from "@/stores/topicsStore";

export default function GenerateTopicPage() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { supabase } = useSupabase();
  const addTopic = useTopicsStore((s) => s.addTopic);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a topic name.");
      return;
    }
    if (!supabase) return;

    setIsLoading(true);
    try {
      const payload = {
        subject_id: subjectId,
        name: name.trim(),
        description: description.trim() || null,
      };

      const { data, error } = await supabase
        .from("topics")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      addTopic(data as Topic);
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to create topic.");
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
            title="Create Topic"
            leftButton={{ onPress: () => router.back() }}
          />

          <View className="bg-white m-4 rounded-2xl p-6 shadow flex-1">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              New Topic
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter topic name"
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
                    Create Topic
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
