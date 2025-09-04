import React from "react";
import { Stack } from "expo-router";
import { SignedIn, useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, SafeAreaView, View, Text } from "react-native";

export default function AppLayout() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();
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
      <Stack.Protected
        guard={isSignedIn}
        key={isSignedIn ? "signed-in" : "signed-out"}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>
      <Stack.Protected
        guard={!isSignedIn}
        key={!isSignedIn ? "signed-out" : "signed-in"}
      >
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
