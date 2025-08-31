import { View, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SignHeader() {
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: top }}
      className="w-full items-center justify-center"
    >
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Image
          source={require("../assets/images/quizzorai.png")}
          style={{
            width: 100,
            height: 100,
            resizeMode: "contain",
          }}
        />
      </View>

      <Text className="text-gray-900 text-3xl font-extrabold mt-4">
        QuizzorAI
      </Text>

      {/* Subtext message */}
      <Text className="text-gray-500 text-base mt-2 text-center px-6">
        Your AI-powered study companion. Generate quizzes, master topics, and
        test yourself smarter.
      </Text>
    </View>
  );
}
