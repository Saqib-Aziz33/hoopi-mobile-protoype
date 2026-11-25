import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { C } from "@/components/ui";
import { AuthProvider } from "@/context/auth";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora: require("@/assets/fonts/Lora.ttf"),
    LoraItalic: require("@/assets/fonts/LoraItalic.ttf"),
  });
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider>
        <KeyboardProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: C.canvas },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AuthProvider>
        </KeyboardProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
