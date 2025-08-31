import { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { SignHeader } from "@/components/SignHeader";

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
          className="bg-white px-4 py-4 rounded-xl border border-gray-300 mb-6"
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
      <View className="flex-1 px-6">
        {/* Header + Title */}
        <View className="items-center mt-20 mb-10">
          <SignHeader />
        </View>
        <View className="items-center mb-5">
          <Text className="text-3xl font-bold text-gray-800 mt-8 text-center">
            Create Account
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
        <View className="mb-5">
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
        {/* Confirm Password */}
        <View className="mb-7">
          <Text className="text-gray-700 mb-2 font-medium">
            Confirm Password
          </Text>
          <TextInput
            value={confirmPassword}
            placeholder="Re-enter password"
            secureTextEntry
            onChangeText={setConfirmPassword}
            editable={!isLoading}
            className="bg-white px-4 py-4 rounded-xl border border-gray-300"
          />
        </View>
        {/* Continue button */}
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
            <Text className="text-white font-semibold text-center text-lg">
              Continue
            </Text>
          )}
        </TouchableOpacity>
        {/* Link to sign-in */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
