import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-blue-600 px-4 lg:px-6">
      <View className="h-20 flex justify-center items-center">
        <Text className="text-white text-3xl font-bold">{title}</Text>
      </View>
    </View>
  );
}
