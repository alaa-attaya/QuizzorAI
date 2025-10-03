// src/pages/quizzes/[quizId]/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Header } from "@/components/Header";

type QuizBasic = {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  is_public: boolean;
  created_by: string;
};

export default function QuizPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ quizId?: string }>();
  const { supabase, session } = useSupabase();
  const id = params.quizId;

  const [quiz, setQuiz] = useState<QuizBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!id || !supabase || !session) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setAccessDenied(false);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data || data.is_deleted)
          throw error || new Error("Quiz not found");

        if (!data.is_public && data.created_by !== session.user.id) {
          setAccessDenied(true);
        } else {
          setQuiz(data);
        }
      } catch (err) {
        console.error(err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, supabase, session]);

  const handleEdit = () => {
    if (!quiz) return;
    router.push(`/quizzes/edit-quiz?id=${quiz.id}`);
    setDropdownVisible(false);
  };

  const showError = !id || accessDenied || !quiz;

  return (
    <SafeAreaView
      className="flex-1 bg-gradient-to-b from-blue-50 via-white to-blue-100"
      edges={["left", "right"]}
    >
      {/* Header */}
      <Header
        title="Quiz"
        leftButton={{
          icon: "arrow-left",
          onPress: () => router.back(),
        }}
        rightButton={{
          icon: "more-vertical",
          visible: !!quiz && quiz.created_by === session?.user.id,
          options: [{ label: "Edit Quiz", onPress: handleEdit }],
          backgroundColor: "bg-blue-400",
        }}
        dropdownVisible={dropdownVisible}
        setDropdownVisible={setDropdownVisible}
        onLayout={(event: LayoutChangeEvent) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      />

      {/* Dropdown Overlay */}
      {dropdownVisible && (
        <Pressable
          className="absolute inset-0 z-40"
          onPress={() => setDropdownVisible(false)}
        >
          <View
            className="absolute bg-blue-500 rounded-bl-lg overflow-hidden"
            style={{
              top: headerHeight,
              right: 0,
              width: 150,
            }}
          >
            {quiz?.created_by === session?.user.id && (
              <TouchableOpacity onPress={handleEdit} className="px-2 py-4">
                <Text className="text-white font-medium text-center text-lg">
                  Edit Quiz
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {loading ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : showError ? (
          <View className="flex-1 justify-center items-center mt-10 px-6">
            <Text className="text-gray-500 text-center text-lg">
              {!id
                ? "Quiz not found."
                : accessDenied
                  ? "This quiz is private."
                  : "Quiz not found."}
            </Text>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center px-6 py-8">
            <View className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
              {/* Quiz Title */}
              <Text className="text-gray-900 text-5xl font-extrabold text-center mb-6">
                {quiz.title}
              </Text>

              {/* Description */}
              {quiz.description && (
                <Text className="text-gray-700 text-lg leading-relaxed text-center mb-6">
                  {quiz.description}
                </Text>
              )}

              {/* Tags */}
              {quiz.tags?.length > 0 && (
                <View className="flex-row flex-wrap justify-center mb-8">
                  {quiz.tags.map((tag) => (
                    <View
                      key={tag}
                      className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-blue-800 text-sm font-medium">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Elegant Play Button */}
              <View className="w-full mt-4">
                <TouchableOpacity
                  className="bg-blue-600 py-5 rounded-2xl shadow-lg items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-2xl font-semibold">
                    Play Quiz
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
