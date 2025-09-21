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
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubjectsStore, Subject } from "@/stores/subjectsStore";

export default function CreateSubjectPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const addSubject = useSubjectsStore((s) => s.addSubject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (isLoading) return;

    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a subject name.");
      return;
    }

    if (!supabase) {
      Alert.alert("Error", "Supabase client not ready.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      };

      const { data, error } = await supabase
        .from("subjects")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      addSubject(data as Subject); // Update Zustand store
      router.back();
    } catch (err: any) {
      console.error("Failed to create subject:", err);
      Alert.alert("Error", err.message || "Failed to create subject.");
    } finally {
      setIsLoading(false);
    }
  };

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
            title="Create Subject"
            leftButton={{ onPress: () => router.back() }}
          />
          <View className="bg-white m-4 rounded-2xl p-6 shadow flex-1">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              New Subject
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter subject name"
                editable={!isLoading}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
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
                editable={!isLoading}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={isLoading}
              activeOpacity={0.8}
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
                    Create Subject
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
