// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1C5795" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack>
      {/* Signed in flow */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
        redirect={!isSignedIn}
      />

      {/* Signed out flow */}
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false }}
        redirect={isSignedIn}
      />
      <Stack.Screen
        name="sign-up"
        options={{ headerShown: false }}
        redirect={isSignedIn}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: false }}
        redirect={isSignedIn}
      />
    </Stack>
  );
}
