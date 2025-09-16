import React from "react";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Header } from "@/components/Header";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { LogOut, KeyRound, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            console.error("Error signing out:", err);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <Text className="text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  // initials for avatar
  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user?.primaryEmailAddress?.emailAddress[0].toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Profile" />

      {/* Profile Card */}
      <View className="bg-white m-4 p-6 rounded-2xl shadow flex-row items-center">
        <View className="w-16 h-16 rounded-full bg-indigo-500 justify-center items-center">
          <Text className="text-white text-2xl font-bold">{initials}</Text>
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-xl font-semibold" numberOfLines={1}>
            {user?.fullName || "Account"}
          </Text>
          <Text className="text-gray-600" numberOfLines={1}>
            {user?.primaryEmailAddress?.emailAddress || "N/A"}
          </Text>
        </View>
      </View>

      {/* Settings Section */}
      <View className="bg-white mx-4 rounded-2xl shadow divide-y divide-gray-200">
        <TouchableOpacity
          onPress={() => router.push("/profile/change-password")}
          className="flex-row items-center justify-between px-4 py-4"
        >
          <View className="flex-row items-center">
            <KeyRound size={20} color="gray" />
            <Text className="ml-3 text-base text-gray-800">
              Change Password
            </Text>
          </View>
          <ChevronRight size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View className="bg-white mx-4 mt-6 rounded-2xl shadow">
        <TouchableOpacity
          onPress={handleSignOut}
          className="flex-row items-center justify-between px-4 py-4"
        >
          <View className="flex-row items-center">
            <LogOut size={20} color="red" />
            <Text className="ml-3 text-base text-red-600 font-semibold">
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
