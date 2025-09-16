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
    <View style={{ paddingTop: top }} className="bg-blue-600 px-4 lg:px-6">
      <View className="h-20 justify-center items-center relative">
        {leftButton && (
          <TouchableOpacity
            onPress={leftButton.onPress}
            className="p-2 absolute left-0 top-1/2 -translate-y-1/2"
          >
            <Feather
              name={leftButton.icon || "chevron-left"}
              size={28}
              color="white"
            />
          </TouchableOpacity>
        )}
        <Text className="text-white text-3xl font-bold text-center">
          {title}
        </Text>
      </View>
    </View>
  );
}
