import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import React from "react";

const TabButton = React.forwardRef((props: any, ref: any) => (
  <TouchableOpacity {...props} ref={ref} activeOpacity={0.6} />
));
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB", // active icon/text color
        tabBarInactiveTintColor: "#9CA3AF", // inactive icon/text color
        tabBarButton: (props) => <TabButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, size }) => {
            return <Feather name="home" color={color} size={size} />;
          },
        }}
      />

      <Tabs.Screen
        name="subjects"
        options={{
          headerShown: false,
          title: "Subjects",
          tabBarIcon: ({ color, size }) => {
            return <Feather name="book" color={color} size={size} />;
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color, size }) => {
            return <Feather name="user" color={color} size={size} />;
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          headerShown: false,
          title: "History",
          tabBarIcon: ({ color, size }) => {
            return <Feather name="clock" color={color} size={size} />;
          },
        }}
      />
    </Tabs>
  );
}
