import React from "react";
import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};
export default function QuizzesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
