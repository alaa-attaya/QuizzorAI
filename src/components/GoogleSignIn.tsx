import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// Handle any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// Warm up browser ONLY on Android
const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS === "android") {
      void WebBrowser.warmUpAsync();
    }
    return () => {
      if (Platform.OS === "android") {
        void WebBrowser.coolDownAsync();
      }
    };
  }, []);
};

export default function GoogleSignIn() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [running, setRunning] = useState(false);

  const onPress = useCallback(async () => {
    if (running) return;
    setRunning(true);

    try {
      const redirectUrl = Platform.select({
        web: AuthSession.makeRedirectUri(),
        default: AuthSession.makeRedirectUri({ scheme: "acme" }),
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        router.replace("/"); // home route
      } else {
        console.warn("No session created — additional steps may be required.");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
    } finally {
      setRunning(false);
    }
  }, [running, startSSOFlow]);

  return (
    <View className="">
      <TouchableOpacity
        onPress={onPress}
        disabled={running}
        className={`py-4 rounded-xl ${running ? "bg-blue-400" : "bg-blue-600"}`}
      >
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View className="flex-row items-center justify-center">
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text className="text-white font-semibold text-lg ml-3">
              Continue with Google
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
