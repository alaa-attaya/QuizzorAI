import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import { Header } from "@/components/Header";
export default function ProfilePage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Profile" />
      <View className="p-4">
        <Text className="text-3xl font-bold mb-4">Profile</Text>

        <View className="bg-white p-4 rounded-lg shadow space-y-2">
          <Text className="text-lg font-semibold">Name:</Text>
          <Text className="text-gray-700"></Text>

          <Text className="text-lg font-semibold mt-4">Email:</Text>
          <Text className="text-gray-700"></Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
