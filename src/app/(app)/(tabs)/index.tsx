import React from "react";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { SafeAreaView } from "react-native";

export default function Page() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="MentorAI" />
      <Dashboard />
    </SafeAreaView>
  );
}
