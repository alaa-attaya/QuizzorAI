import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

export default function CreateSubjectPage() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a subject name.");
      return;
    }

    if (!supabase) {
      Alert.alert("Error", "Supabase client not ready. Please sign in.");
      return;
    }

    setIsLoading(true);

    try {
      // No need to include created_by, Supabase fills it automatically
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      console.log("📤 Sending payload to Supabase:", payload);

      const { data, error } = await supabase
        .from("subjects")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Update AsyncStorage cache
      const cached = await AsyncStorage.getItem("subjects_list");
      const subjects = cached ? JSON.parse(cached) : [];
      await AsyncStorage.setItem(
        "subjects_list",
        JSON.stringify([data, ...subjects])
      );

      Toast.show({
        type: "success",
        text1: "Subject created",
        position: "top",
        visibilityTime: 1500,
      });

      router.back();
    } catch (err: any) {
      console.error("❌ Failed to create subject:", err);
      Alert.alert("Error", err.message || "Failed to create subject.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Create Subject"
          leftButton={{ onPress: () => router.back() }}
        />

        <View className="bg-white m-4 rounded-2xl p-6 shadow">
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

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">Description</Text>
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
            className={`py-4 rounded-xl ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Feather name="check" size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-3">
                  Create Subject
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
