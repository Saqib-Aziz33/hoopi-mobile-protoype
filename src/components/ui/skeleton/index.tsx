import { useEffect, useState } from "react";
import { Animated, Easing, Platform, type ViewProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const skeletonStyle = tva({
  base: "rounded-md bg-background-100",
  variants: {
    variant: {
      sharp: "rounded-none",
      circular: "rounded-full",
      rounded: "rounded-md",
    },
  },
});

// Adapted from gluestack's Skeleton. Start/stop animation in an effect, and
// respect reduced motion rather than starting a new loop during each render.
export function Skeleton({
  className,
  variant = "rounded",
  startColor = "bg-background-100",
  style,
  ...props
}: ViewProps & {
  variant?: "sharp" | "circular" | "rounded";
  startColor?: string;
}) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);
  return (
    <Animated.View
      {...props}
      className={skeletonStyle({
        variant,
        class: `${startColor} ${className ?? ""}`,
      })}
      style={[{ opacity }, style]}
    />
  );
}
