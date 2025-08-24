import "../global.css";
import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ClerkProvider } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
export default function MainLayout() {
  return (
    <ClerkProvider>
      <Slot />
    </ClerkProvider>
  );
}
