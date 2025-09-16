import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import React from "react";
import { SignHeader } from "@/components/SignHeader";
import GoogleSignIn from "@/components/GoogleSignIn";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Validation
    if (!emailAddress.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password."
      );
      return;
    }

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        Alert.alert(
          "Sign In Failed",
          "Please check your credentials and try again."
        );
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err?.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mt-10 mb-10">
          <SignHeader />
        </View>

        {/* Card for Welcome & Inputs */}
        <View className="bg-white rounded-2xl px-6 py-8 shadow-md mb-6">
          <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Welcome Back
          </Text>

          {/* Email */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Email</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
              <Feather name="mail" size={20} color="#9CA3AF" className="ml-3" />
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Enter email"
                onChangeText={setEmailAddress}
                editable={!isLoading}
                className="flex-1 px-4 py-4"
              />
            </View>
          </View>

          {/* Password with Eye Toggle */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
              <Feather name="lock" size={20} color="#9CA3AF" className="ml-3" />
              <TextInput
                value={password}
                placeholder="Enter password"
                secureTextEntry={!showPassword} // <-- toggle here
                onChangeText={setPassword}
                editable={!isLoading}
                className="flex-1 px-4 py-4"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                className="px-3"
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={onSignInPress}
            disabled={isLoading}
            className={`py-4 rounded-xl ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Feather name="log-in" size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-3">
                  Sign In
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* OR Separator */}
          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="px-3 text-gray-500 font-semibold">OR</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Google Sign-In */}
          <GoogleSignIn />
        </View>

        {/* Link to Sign Up */}
        <View className="flex-row justify-center ">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/sign-up")}>
            <Text className="text-blue-600 font-semibold">Sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
