import React from "react";
import { TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { SupabaseProvider } from "@/providers/SupabaseProvider";

const TabButton = React.forwardRef((props: any, ref: any) => (
  <TouchableOpacity {...props} ref={ref} activeOpacity={0.6} />
));

export default function TabsLayout() {
  const { isSignedIn, getToken, userId, sessionId } = useAuth();

  return (
    <SupabaseProvider
      isSignedIn={isSignedIn}
      getToken={getToken}
      userId={userId}
      sessionId={sessionId}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarButton: (props) => <TabButton {...props} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="subjects"
          options={{
            title: "Subjects",
            tabBarIcon: ({ color, size }) => (
              <Feather name="book" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Feather name="clock" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SupabaseProvider>
  );
}
