// src/pages/subjects/edit-subject.tsx
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
import { Header } from "@/components/Header";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubjectsStore, Subject } from "@/stores/subjectsStore";

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params?.id ?? "";
  const { supabase, session } = useSupabase();
  const updateSubject = useSubjectsStore((s) => s.updateSubject);
  const removeSubject = useSubjectsStore((s) => s.removeSubject);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!id || !session) {
      router.push("/subjects");
      return;
    }

    const fetchSubject = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, description, is_deleted, created_by, is_public")
          .eq("id", id)
          .single();

        if (
          error ||
          !data ||
          data.is_deleted ||
          data.created_by !== session.user.id
        ) {
          Alert.alert("Cannot edit", "This subject cannot be edited.", [
            { text: "OK", onPress: () => router.push("/subjects") },
          ]);
          return;
        }

        setName(data.name);
        setDescription(data.description ?? "");
        setIsPublic(data.is_public ?? true);
        updateSubject(data as Subject);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load subject.", [
          { text: "OK", onPress: () => router.push("/subjects") },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id, supabase, session, router, updateSubject]);

  const handleSave = async () => {
    if (saving || !name.trim() || !supabase) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description?.trim() || null,
        is_public: isPublic,
      };

      const { data, error } = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      updateSubject(data as Subject);
      router.push("/subjects");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update subject.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!supabase) return;

    Alert.alert(
      "Delete subject",
      "Are you sure you want to delete this subject?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const { data, error } = await supabase
                .from("subjects")
                .update({
                  is_deleted: true,
                  deleted_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select()
                .single();

              if (!error && data) {
                removeSubject(id);
                router.push("/subjects");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete subject.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <SafeAreaView
        className="flex-1 bg-gray-100"
        edges={["bottom", "left", "right"]}
      >
        <Header
          title="Edit Subject"
          leftButton={{ onPress: () => router.push("/subjects") }}
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
          edges={["bottom", "left", "right"]}
          className="flex-1 bg-gray-100"
        >
          <Header
            title="Edit Subject"
            leftButton={{ onPress: () => router.push("/subjects") }}
          />
          <View className="bg-white m-4 rounded-2xl p-6 shadow">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Edit Subject
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Subject name"
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
                  <Feather name="trash-2" size={18} color="#fff" />
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
