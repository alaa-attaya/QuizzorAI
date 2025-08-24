import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-blue-600 px-4 lg:px-6">
      <View className="h-14 flex flex-row items-center justify-between">
        <Text className="text-white text-xl font-bold">{title}</Text>
      </View>
    </View>
  );
}
