import { Text } from "@/components/ui/text";
import { Box as View } from "@/components/ui/box";
import Animated, {
  FadeIn,
  FadeOut,
  useReducedMotion,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { C } from "@/components/ui";

function Dot({ index }: { index: number }) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({
    opacity: reduced
      ? 1
      : withDelay(
          index * 140,
          withRepeat(
            withSequence(
              withTiming(0.3, { duration: 440 }),
              withTiming(1, { duration: 440 }),
            ),
            -1,
          ),
        ),
  }));
  return (
    <Animated.View
      style={[
        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary },
        style,
      ]}
    />
  );
}

export function ThinkingIndicator() {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(100)}
      accessibilityLabel="Hoopi is thinking"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 6,
      }}
    >
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[0, 1, 2].map((index) => (
          <Dot key={index} index={index} />
        ))}
      </View>
      <Text style={{ color: C.moss, fontSize: 13 }}>Thinking…</Text>
    </Animated.View>
  );
}
