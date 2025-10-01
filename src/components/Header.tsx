// src/components/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

type HeaderProps = {
  title: string;
  leftButton?: { icon?: keyof typeof Feather.glyphMap; onPress: () => void };
  rightButton?: {
    icon?: keyof typeof Feather.glyphMap;
    visible?: boolean;
    options?: { label: string; onPress: () => void }[];
    backgroundColor?: string;
  };
  dropdownVisible?: boolean;
  setDropdownVisible?: (v: boolean) => void;
  onLayout?: (event: LayoutChangeEvent) => void; // new
};

export function Header({
  title,
  leftButton,
  rightButton,
  dropdownVisible,
  setDropdownVisible,
  onLayout,
}: HeaderProps) {
  const { top } = useSafeAreaInsets();

  const toggleDropdown = () => {
    if (setDropdownVisible) setDropdownVisible(!dropdownVisible);
  };

  return (
    <View
      className="bg-blue-600"
      style={{ paddingTop: top }}
      onLayout={onLayout} // measure height
    >
      <View className="flex-row items-center justify-between px-4 py-4">
        {/* Left Button */}
        <View className="w-11 items-start">
          {leftButton && (
            <TouchableOpacity onPress={leftButton.onPress} activeOpacity={0.7}>
              <Feather
                name={leftButton.icon || "arrow-left"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View className="flex-1 items-center">
          <Text className="text-white text-2xl font-bold">{title}</Text>
        </View>

        {/* Right Button */}
        <View className="w-11 items-end">
          {rightButton && rightButton.visible && rightButton.options?.length ? (
            <TouchableOpacity onPress={toggleDropdown} activeOpacity={0.7}>
              <Feather
                name={rightButton.icon || "more-vertical"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
