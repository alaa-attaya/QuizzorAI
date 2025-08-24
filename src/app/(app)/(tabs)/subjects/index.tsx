import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import { Header } from "@/components/Header";
export default function SubjectsListPage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Subjects" />
      <View className="p-4">
        <Text className="text-3xl font-bold mb-4">Subjects</Text>
      </View>
    </SafeAreaView>
  );
}
