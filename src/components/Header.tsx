import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

type HeaderProps = {
  title: string;
  leftButton?: {
    icon?: keyof typeof Feather.glyphMap;
    onPress: () => void;
  };
};

export function Header({ title, leftButton }: HeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View className="bg-blue-600" style={{ paddingTop: top }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        {/* Left button or placeholder */}
        <View style={{ width: 44, alignItems: "flex-start" }}>
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
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text className="text-white text-2xl font-bold">{title}</Text>
        </View>

        {/* Right placeholder for symmetry */}
        <View style={{ width: 44 }} />
      </View>
    </View>
  );
}
