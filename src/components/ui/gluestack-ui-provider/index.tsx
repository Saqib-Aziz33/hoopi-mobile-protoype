import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ToastProvider } from "@gluestack-ui/core/toast/creator";
import { config } from "./config";

// The app ships a light appearance. Explicit selection keeps SSR and native
// on the same theme at first paint, regardless of the device color scheme.
export function GluestackUIProvider({
  children,
  style,
}: PropsWithChildren<{ style?: ViewProps["style"] }>) {
  return (
    <View style={[config.light, { flex: 1 }, style]}>
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
