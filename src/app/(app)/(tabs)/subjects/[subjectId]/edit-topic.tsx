import React, { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useTopicsStore, Topic } from "@/stores/topicsStore";

export default function EditTopicPage() {
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { supabase, session } = useSupabase();
  const updateTopic = useTopicsStore((s) => s.updateTopic);
  const removeTopic = useTopicsStore((s) => s.removeTopic);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [isPublic, setIsPublic] = useState(true);
  const [subjectId, setSubjectId] = useState<string>("");

  // Fetch topic on mount
  useEffect(() => {
    if (!topicId || !session) return;

    const fetchTopic = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("topics")
          .select("*")
          .eq("id", topicId)
          .single();

        if (
          error ||
          !data ||
          data.is_deleted ||
          data.created_by !== session.user.id
        ) {
          Alert.alert("Cannot edit", "This topic cannot be edited.", [
            { text: "OK", onPress: () => router.back() },
          ]);
          return;
        }

        setName(data.name);
        setDescription(data.description ?? "");
        setIsPublic(data.is_public ?? true);
        setSubjectId(data.subject_id);
        updateTopic(data as Topic);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load topic.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId, supabase, session]);

  // Save topic
  const handleSave = async () => {
    if (saving || !name.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("topics")
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          is_public: isPublic,
        })
        .eq("id", topicId)
        .select()
        .single();

      if (error || !data) throw error;
      updateTopic(data as Topic);
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update topic.");
    } finally {
      setSaving(false);
    }
  };

  // Delete topic
  const handleDelete = async () => {
    Alert.alert("Delete Topic", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            const { data, error } = await supabase
              .from("topics")
              .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
              })
              .eq("id", topicId)
              .select()
              .single();

            if (error || !data) throw error;
            removeTopic(data as Topic);
            router.back();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete topic.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  // Full-screen loader while fetching topic
  if (loading)
    return (
      <SafeAreaView
        className="flex-1 bg-gray-100"
        edges={["bottom", "left", "right"]}
      >
        <Header
          title="Edit Topic"
          leftButton={{ onPress: () => router.back() }}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView
          className="flex-1 bg-gray-100"
          edges={["bottom", "left", "right"]}
        >
          <Header
            title="Edit Topic"
            leftButton={{ onPress: () => router.back() }}
          />

          <View className="bg-white m-4 rounded-2xl p-6 shadow flex-1">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Edit Topic
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Topic name"
                editable={!saving}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Description
              </Text>
              <TextInput
                value={description ?? ""}
                onChangeText={setDescription}
                placeholder="Optional"
                editable={!saving}
                className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300"
              />
            </View>

            {/* Public / Private Switch */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium text-lg">Public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                thumbColor={isPublic ? "#2563EB" : "#f4f3f4"}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                disabled={saving}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
              className={`py-4 rounded-xl flex-row items-center justify-center px-6 ${
                saving ? "bg-blue-400 opacity-70" : "bg-blue-600"
              }`}
            >
              <View className="w-6 flex items-center justify-center">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Feather name="save" size={18} color="#fff" />
                )}
              </View>
              <Text className="text-white font-semibold text-lg ml-3">
                Save
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={saving}
              activeOpacity={0.8}
              className={`mt-4 py-4 rounded-xl flex-row items-center justify-center px-6 ${
                saving ? "bg-red-400 opacity-70" : "bg-red-600"
              }`}
            >
              <View className="w-6 flex items-center justify-center">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Feather name="trash" size={18} color="#fff" />
                )}
              </View>
              <Text className="text-white font-semibold text-lg ml-3">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
