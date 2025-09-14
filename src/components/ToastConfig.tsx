// ToastConfig.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const toastConfig = {
  success: ({ text1 }: any) => (
    <View style={[styles.container, styles.success]}>
      <Text style={[styles.text, styles.successText]}>{text1}</Text>
    </View>
  ),
  error: ({ text1 }: any) => (
    <View style={[styles.container, styles.error]}>
      <Text style={[styles.text, styles.errorText]}>{text1}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20, // pill shape
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  success: {
    backgroundColor: "#F3F4F6", // light gray bg
  },
  successText: {
    color: "#2563EB", // blue text
  },
  error: {
    backgroundColor: "#FEE2E2", // light red bg
  },
  errorText: {
    color: "#B91C1C",
  },
});
