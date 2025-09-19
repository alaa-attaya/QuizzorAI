import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";

type Subject = {
  id: string;
  name: string;
  description?: string;
};

export default function SubjectsListPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadCache = async () => {
    try {
      const cached = await AsyncStorage.getItem("subjects_list");
      if (cached) setSubjects(JSON.parse(cached));
    } catch (err) {
      console.error("Failed to load subjects cache:", err);
    }
  };

  useEffect(() => {
    loadCache();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCache();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCache();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Subjects updated",
      position: "top",
      visibilityTime: 1000,
    });
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-100"
      edges={["bottom", "left", "right"]} // ignore top because Header handles status bar
    >
      <ScrollView
        className="flex-1 bg-gray-100"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={["#2563EB"]}
            progressBackgroundColor="#F3F4F6"
          />
        }
      >
        {/* Header with status bar handled */}
        <Header title="Subjects" />

        <View className="p-4">
          {/* Add Subject Button */}
          <TouchableOpacity
            onPress={() => router.push("/subjects/create-subject")}
            className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center justify-center mb-4"
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Add Subject</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold mb-4">Your Subjects</Text>

          {subjects.length ? (
            subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                onPress={() => router.push(`/subjects/${subject.id}`)}
                className="bg-white rounded-xl p-4 shadow mb-3 flex-row justify-between items-center"
              >
                <View>
                  <Text className="font-semibold text-lg">{subject.name}</Text>
                  {subject.description && (
                    <Text className="text-gray-500 text-sm mt-1">
                      {subject.description}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-500">No subjects found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
