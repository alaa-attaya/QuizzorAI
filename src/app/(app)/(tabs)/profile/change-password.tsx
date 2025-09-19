import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function ChangePasswordPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <Text className="text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  const hasPasswordLogin = user?.passwordEnabled === true;
  const isOAuthOnly = !hasPasswordLogin;

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
    if (hasPasswordLogin && !currentPassword) {
      Alert.alert(
        "Missing Current Password",
        "Please enter your current password."
      );
      return;
    }

    setIsLoading(true);
    try {
      await user?.updatePassword({
        ...(hasPasswordLogin ? { currentPassword } : {}),
        newPassword,
      });

      Alert.alert(
        "Success",
        isOAuthOnly
          ? "Password created successfully!"
          : "Password updated successfully.",
        [{ text: "OK", onPress: () => router.back() }]
      );
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

  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    show: boolean,
    setShow: (val: boolean) => void,
    placeholder: string
  ) => (
    <View className="mb-5">
      <Text className="text-gray-700 mb-2 font-medium">{label}</Text>
      <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
        <Feather
          name="lock"
          size={20}
          color="#9CA3AF"
          style={{ marginLeft: 12 }}
        />
        <TextInput
          value={value}
          placeholder={placeholder}
          secureTextEntry={!show}
          onChangeText={setValue}
          editable={!isLoading}
          className="flex-1 px-4 py-4"
        />
        <TouchableOpacity onPress={() => setShow(!show)} className="px-3">
          <Feather name={show ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-gray-100"
    >
      <Header
        title={isOAuthOnly ? "Set Password" : "Change Password"}
        leftButton={{ onPress: () => router.back() }}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-2xl px-6 py-8 shadow-md m-4">
          <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isOAuthOnly
              ? "Create a Password for Your Account"
              : "Update Your Password"}
          </Text>

          {hasPasswordLogin &&
            renderPasswordInput(
              "Current Password",
              currentPassword,
              setCurrentPassword,
              showCurrent,
              setShowCurrent,
              "Enter current password"
            )}

          {renderPasswordInput(
            "New Password",
            newPassword,
            setNewPassword,
            showNew,
            setShowNew,
            "Enter new password"
          )}

          {renderPasswordInput(
            "Confirm Password",
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            setShowConfirm,
            "Re-enter new password"
          )}

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
                  {isOAuthOnly ? "Set Password" : "Save Password"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
