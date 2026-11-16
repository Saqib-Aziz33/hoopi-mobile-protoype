import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { C } from '@/components/ui';

export function ChatModeSwitch({ value, onChange }: { value: 'chat' | 'work'; onChange: (value: 'chat' | 'work') => void }) {
  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value === 'work' ? 112 : 0, { duration: 190, easing: Easing.out(Easing.cubic) }) }],
  }));
  return <View style={{ alignSelf: 'flex-start', marginTop: 12 }}>
    <View style={{ flexDirection: 'row' }}>{(['chat', 'work'] as const).map(mode => <Pressable key={mode} accessibilityRole="tab" accessibilityState={{ selected: value === mode }} onPress={() => onChange(mode)} style={{ width: 112, minHeight: 44, justifyContent: 'center' }}><Text style={{ color: value === mode ? C.primary : C.moss, fontSize: 13, fontWeight: value === mode ? '600' : '400' }}>{mode === 'chat' ? 'Conversation' : 'Work mode'}</Text></Pressable>)}</View>
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, bottom: -1, height: 2, width: 84, backgroundColor: C.primary }, indicator]} />
  </View>;
}
