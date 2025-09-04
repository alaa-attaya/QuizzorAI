import { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { SignHeader } from "@/components/SignHeader";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Go Back
  useEffect(() => {
    if (!pendingVerification) return; // only active during verification

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        Alert.alert(
          "Go back?",
          "Your email verification is not complete. Go back to edit your email?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => setPendingVerification(false) },
          ]
        );
        return true; // prevent default behavior (app exit)
      }
    );

    return () => backHandler.remove(); // cleanup when pendingVerification changes or unmounts
  }, [pendingVerification]);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Trim inputs
    const email = emailAddress.trim();
    const pass = password.trim();
    const confirmPass = confirmPassword.trim();

    // Check for empty fields
    if (!email || !pass || !confirmPass) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // Password match
    if (pass !== confirmPass) {
      Alert.alert("Passwords do not match", "Please re-enter your password.");
      return;
    }

    // Optional: minimum password length
    if (pass.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await signUp.create({ emailAddress: email, password: pass });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign Up Error", err?.message || "Something went wrong.");
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
          <View className="bg-white rounded-2xl px-6 py-8 shadow-md mb-6">
            <Text className="text-2xl font-bold text-center text-gray-800 mb-8">
              Verify your email
            </Text>
            <View className="mb-5">
              <Text className="text-gray-700 mb-2 font-medium">
                Verification Code
              </Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-300">
                <Feather
                  name="key"
                  size={20}
                  color="#9CA3AF"
                  className="ml-3"
                />
                <TextInput
                  value={code}
                  placeholder="Enter verification code"
                  onChangeText={setCode}
                  editable={!isLoading}
                  keyboardType="numeric"
                  className="flex-1 px-4 py-4"
                />
              </View>
            </View>
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
                <View className="flex-row items-center justify-center">
                  <Feather name="check" size={20} color="#fff" />
                  <Text className="text-white font-semibold text-lg ml-3">
                    Verify Email
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Resend Code Text */}
            <View className="mt-4 flex-row justify-center">
              <Text className="text-gray-600">Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={async () => {
                  if (!isLoaded) return;
                  setIsLoading(true);
                  try {
                    await signUp.prepareEmailAddressVerification({
                      strategy: "email_code",
                    });
                    Alert.alert(
                      "Code Sent",
                      "A new verification code has been sent to your email."
                    );
                  } catch (err) {
                    console.error(JSON.stringify(err, null, 2));
                    Alert.alert("Error", "Failed to resend code. Try again.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                <Text className={`text-blue-600 font-semibold ml-1`}>
                  Resend
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

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
                <Feather name="user-plus" size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-3">
                  Create Account
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 text-center mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
        {/* Link to Sign In */}
        <View className="flex-row justify-center ">
          <Text className="text-gray-600">Already have an account? </Text>

          <TouchableOpacity onPress={() => router.replace("/sign-in")}>
            <Text className="text-blue-600 font-semibold">Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
