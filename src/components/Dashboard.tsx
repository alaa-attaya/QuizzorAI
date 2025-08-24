import { View, Text, TouchableOpacity, ScrollView } from "react-native";

export function Dashboard() {
  const ctas = [
    { title: "Generate Quiz", subtitle: "Create a new AI-generated quiz" },
    { title: "My Quizzes", subtitle: "View your saved quizzes" },
    { title: "Statistics", subtitle: "Check your progress" },
  ];

  return (
    <ScrollView className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mb-6 text-center">
        Welcome to MentorAI
      </Text>

      <View className="space-y-4">
        {ctas.map((cta) => (
          <TouchableOpacity
            key={cta.title}
            className="bg-white rounded-lg p-4 shadow"
            onPress={() => console.log(`${cta.title} clicked`)}
          >
            <Text className="text-lg font-semibold">{cta.title}</Text>
            <Text className="text-gray-500 text-sm mt-1">{cta.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
