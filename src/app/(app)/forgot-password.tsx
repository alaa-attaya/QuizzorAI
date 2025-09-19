// app/forgot-password.tsx
import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Header } from "@/components/Header";
import { SignHeader } from "@/components/SignHeader";
import { SafeAreaView } from "react-native-safe-area-context";
export default function ForgotPasswordPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request"); // current step
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: send password reset code
  const handleSendCode = async () => {
    if (!isLoaded) return;
    if (!email.trim()) {
      Alert.alert("Missing Information", "Please enter your email.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStep("reset"); // move to next step
      Alert.alert(
        "Check Your Email",
        "A verification code has been sent to your email."
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.message || "Failed to send password reset code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: verify code + update password
  const handleResetPassword = async () => {
    if (!isLoaded) return;
    if (!code.trim() || !newPassword.trim()) {
      Alert.alert("Missing Information", "Please enter code and new password.");
      return;
    }

    setIsLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword, // <-- pass the new password here
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        Alert.alert("Success", "Password updated successfully!", [
          { text: "OK", onPress: () => router.replace("/sign-in") },
        ]);
      } else {
        Alert.alert("Error", "Invalid code or flow failed.");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err?.message || "Failed to reset password. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-100"
      edges={["bottom", "left", "right"]}
    >
      <Header
        title="Forgot Password"
        leftButton={{ onPress: () => router.replace("/sign-in") }}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mt-6 mb-10">
          <SignHeader />
        </View>

        <View className="bg-white rounded-2xl px-6 py-8 shadow-md">
          {step === "request" ? (
            <>
              <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Forgot Password
              </Text>

              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300 mb-6">
                <Feather
                  name="mail"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginLeft: 12 }}
                />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  placeholder="Enter your email"
                  onChangeText={setEmail}
                  editable={!isLoading}
                  style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSendCode}
                disabled={isLoading}
                className={`py-4 rounded-xl ${
                  isLoading ? "bg-blue-400" : "bg-blue-600"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Feather
                      name="mail"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 12 }}
                    />
                    <Text className="text-white font-semibold text-lg">
                      Send Verification Code
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Reset Password
              </Text>

              <Text className="text-gray-700 mb-2 font-medium">
                Verification Code
              </Text>
              <TextInput
                value={code}
                placeholder="Enter code from email"
                onChangeText={setCode}
                editable={!isLoading}
                className="bg-gray-100 rounded-xl border border-gray-300 px-4 py-4 mb-4"
              />

              <Text className="text-gray-700 mb-2 font-medium">
                New Password
              </Text>
              <TextInput
                value={newPassword}
                placeholder="Enter new password"
                secureTextEntry
                onChangeText={setNewPassword}
                editable={!isLoading}
                className="bg-gray-100 rounded-xl border border-gray-300 px-4 py-4 mb-6"
              />

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isLoading}
                className={`py-4 rounded-xl ${
                  isLoading ? "bg-blue-400" : "bg-blue-600"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Feather
                      name="lock"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 12 }}
                    />
                    <Text className="text-white font-semibold text-lg">
                      Reset Password
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
