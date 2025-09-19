import React from "react";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-gray-100"
    >
      <Header title="QuizzorAI" />
      <Dashboard />
    </SafeAreaView>
  );
}
