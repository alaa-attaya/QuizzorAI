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
        {/* Left button */}
        {leftButton ? (
          <TouchableOpacity onPress={leftButton.onPress} className="p-2">
            <Feather
              name={leftButton.icon || "chevron-left"}
              size={28}
              color="white"
            />
          </TouchableOpacity>
        ) : (
          // Empty space to reserve layout space
          <View style={{ width: 44 }} />
        )}

        {/* Title */}
        <Text className="text-white text-2xl font-bold text-center flex-1">
          {title}
        </Text>

        {/* Right spacer to center title */}
        <View style={{ width: 44 }} />
      </View>
    </View>
  );
}
