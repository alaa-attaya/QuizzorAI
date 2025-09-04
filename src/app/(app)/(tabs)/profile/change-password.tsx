import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Header } from "@/components/Header";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function ChangePasswordPage() {
  const { user } = useUser();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please re-enter your new password."
      );
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await user?.updatePassword({
        currentPassword,
        newPassword,
      });

      Alert.alert("Success", "Password updated successfully.", [
        { text: "OK", onPress: () => router.replace("/profile") },
      ]);
    } catch (err: any) {
      console.error("Error updating password:", err);
      Alert.alert(
        "Error",
        err?.errors?.[0]?.message || "Failed to update password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Change Password" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-2xl px-6 py-8 shadow-md m-4">
          <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Update Your Password
          </Text>

          {/* Current Password */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">
              Current Password
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
              <Feather
                name="lock"
                size={20}
                color="#9CA3AF"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                value={currentPassword}
                placeholder="Enter current password"
                secureTextEntry
                onChangeText={setCurrentPassword}
                editable={!isLoading}
                className="flex-1 px-4 py-4"
              />
            </View>
          </View>

          {/* New Password */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">New Password</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
              <Feather
                name="lock"
                size={20}
                color="#9CA3AF"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                value={newPassword}
                placeholder="Enter new password"
                secureTextEntry
                onChangeText={setNewPassword}
                editable={!isLoading}
                className="flex-1 px-4 py-4"
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">
              Confirm Password
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
              <Feather
                name="lock"
                size={20}
                color="#9CA3AF"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                value={confirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
                onChangeText={setConfirmPassword}
                editable={!isLoading}
                className="flex-1 px-4 py-4"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className={`py-4 rounded-xl ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Feather name="check" size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-3">
                  Save Password
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
