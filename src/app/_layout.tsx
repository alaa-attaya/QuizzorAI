import "../global.css";
import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ClerkProvider } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ToastConfig";
export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaView className="flex-1 bg-gray-100">
        <Slot />
        <Toast config={toastConfig} />
      </SafeAreaView>
    </ClerkProvider>
  );
}
