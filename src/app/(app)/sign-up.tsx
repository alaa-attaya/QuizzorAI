import { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { SignHeader } from "@/components/SignHeader";
import { Feather } from "@expo/vector-icons";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please re-enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 px-6 justify-center">
        <Text className="text-2xl font-bold text-center text-gray-800 mb-8">
          Verify your email
        </Text>
        <TextInput
          value={code}
          placeholder="Enter verification code"
          onChangeText={setCode}
          editable={!isLoading}
          className="bg-gray-100 px-4 py-4 rounded-xl border border-gray-300 mb-6"
        />
        <TouchableOpacity
          onPress={onVerifyPress}
          disabled={isLoading}
          className={`py-4 rounded-xl ${
            isLoading ? "bg-blue-400" : "bg-blue-600"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-center text-lg">
              Verify
            </Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6"
      >
        {/* Header */}
        <View className="items-center mt-10 mb-10">
          <SignHeader />
        </View>

        {/* Card for Inputs */}
        <View className="bg-white rounded-2xl px-6 py-8 shadow-md mb-6">
          <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Create Account
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

          {/* Password */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
              <Feather name="lock" size={20} color="#9CA3AF" className="ml-3" />
              <TextInput
                value={password}
                placeholder="Enter password"
                secureTextEntry
                onChangeText={setPassword}
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
              <Feather name="lock" size={20} color="#9CA3AF" className="ml-3" />
              <TextInput
                value={confirmPassword}
                placeholder="Re-enter password"
                secureTextEntry
                onChangeText={setConfirmPassword}
                editable={!isLoading}
                className="flex-1 px-4 py-4"
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={onSignUpPress}
            disabled={isLoading}
            className={`py-4 rounded-xl ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Feather name="arrow-right-circle" size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-3">
                  Continue
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {/* Link to Sign In */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/sign-in" replace asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
