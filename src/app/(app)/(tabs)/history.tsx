import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import { Header } from "@/components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HistoryPage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="History" />
      <View className="p-4">
        <Text className="text-3xl font-bold mb-4">History</Text>
      </View>
    </SafeAreaView>
  );
}
