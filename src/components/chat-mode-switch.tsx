import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { C } from '@/components/ui';

export function ChatModeSwitch({ value, onChange }: { value: 'chat' | 'work'; onChange: (value: 'chat' | 'work') => void }) {
  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value === 'work' ? 108 : 0, { duration: 210, easing: Easing.out(Easing.cubic) }) }],
  }));
  return (
    <View style={{ alignSelf: 'center', flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: C.lavender, marginTop: 12 }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, width: 108, borderRadius: 12, backgroundColor: C.white }, indicator]} />
      {(['chat', 'work'] as const).map(mode => (
        <Pressable key={mode} accessibilityRole="tab" accessibilityState={{ selected: value === mode }} onPress={() => onChange(mode)} style={{ width: 108, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: value === mode ? C.primary : C.moss, fontSize: 13, fontWeight: '700' }}>{mode === 'chat' ? 'Ask Hoopi' : 'Work mode'}</Text>
        </Pressable>
      ))}
    </View>
  );
}
