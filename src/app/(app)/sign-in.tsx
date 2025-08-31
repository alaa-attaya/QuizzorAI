import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React from "react";
import { SignHeader } from "@/components/SignHeader";
import { ActivityIndicator } from "react-native";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6"
      >
        {/* Header + Title */}
        <View className="items-center mt-20 mb-10">
          <SignHeader />
        </View>
        <View className="items-center mb-5">
          <Text className="text-3xl font-bold text-gray-800 mt-8 text-center">
            Welcome Back
          </Text>
        </View>

        {/* Email */}
        <View className="mb-5">
          <Text className="text-gray-700 mb-2 font-medium">Email</Text>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter email"
            onChangeText={setEmailAddress}
            editable={!isLoading}
            className="bg-white px-4 py-4 rounded-xl border border-gray-300"
          />
        </View>

        {/* Password */}
        <View className="mb-7">
          <Text className="text-gray-700 mb-2 font-medium">Password</Text>
          <TextInput
            value={password}
            placeholder="Enter password"
            secureTextEntry
            onChangeText={setPassword}
            editable={!isLoading}
            className="bg-white px-4 py-4 rounded-xl border border-gray-300"
          />
        </View>

        {/* Button */}
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
            <Text className="text-white font-semibold text-center text-lg">
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Link to Sign up */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
