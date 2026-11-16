import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, Easing, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export const C = {
  canvas: '#FAFAF8',
  paper: '#FFFFFF',
  ink: '#171B35',
  primary: '#4816FB',
  blue: '#2559FB',
  cyan: '#02D1FC',
  moss: '#626D86',
  line: '#E5E4E9',
  lavender: '#F1EDFF',
  blueTint: '#E8F5FF',
  coral: '#E25974',
  white: '#FFFFFF',
  red: '#D53B68',
  amber: '#C17A16',
};

export const editorialFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export function Screen({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, style]}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.screenInner}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

export function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))} style={styles.heading}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </Animated.View>
  );
}

export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return <Animated.View entering={FadeIn.duration(220)} style={[styles.card, style]}>{children}</Animated.View>;
}

export function Button({ title, onPress, secondary = false, disabled = false, busy = false, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; busy?: boolean; style?: ViewStyle }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || busy, busy }}
        disabled={disabled || busy}
        onPress={onPress}
        // Reanimated shared values are intentionally updated in native gesture callbacks.
        // eslint-disable-next-line react-hooks/immutability
        onPressIn={() => { scale.value = withSpring(0.975, { damping: 16, stiffness: 280 }); }}
        // eslint-disable-next-line react-hooks/immutability
        onPressOut={() => { scale.value = withSpring(1, { damping: 13, stiffness: 240 }); }}
        style={[styles.button, secondary && styles.buttonSecondary, (disabled || busy) && { opacity: 0.62 }]}
      >

        {busy ? <ActivityIndicator color={secondary ? C.primary : C.white} /> : <Text style={[styles.buttonText, secondary && { color: C.primary }]}>{title}</Text>}
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({ name, onPress, disabled = false, accessibilityLabel, style }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; accessibilityLabel: string; style?: ViewStyle }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        // Reanimated shared values are intentionally updated in native gesture callbacks.
        // eslint-disable-next-line react-hooks/immutability
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 14, stiffness: 280 }); }}
        // eslint-disable-next-line react-hooks/immutability
        onPressOut={() => { scale.value = withSpring(1, { damping: 13, stiffness: 240 }); }}
        style={({ pressed }) => [styles.iconButton, disabled && { opacity: 0.55 }, pressed && { opacity: 0.9 }]}
      >

        <Ionicons name={name} size={22} color={C.white} />
      </Pressable>
    </Animated.View>
  );
}

export function Field(props: TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return <TextInput placeholderTextColor="#8992A8" selectionColor={C.primary} {...props} onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }} style={[styles.field, focused && { borderColor: C.primary, backgroundColor: C.white }, props.style]} />;
}

export function SectionTitle({ children }: React.PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function EmptyState({ title, message, icon = 'chatbubble-outline' }: { title: string; message: string; icon?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon === '▤' ? 'documents-outline' : icon === '✦' ? 'file-tray-outline' : 'chatbubble-outline'} size={26} color={C.moss} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas, paddingHorizontal: 20 },
  screenInner: { flex: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 22, paddingBottom: 26 },
  title: { color: C.ink, fontFamily: editorialFont, fontSize: 36, fontWeight: '400', letterSpacing: -1.2 },
  subtitle: { color: C.moss, fontSize: 14, lineHeight: 20, marginTop: 5 },
  card: { backgroundColor: C.paper, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 16 },
  button: { overflow: 'hidden', backgroundColor: C.primary, minHeight: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonSecondary: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  buttonText: { color: C.white, fontSize: 15, fontWeight: '700' },
  iconButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.primary, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  field: { minHeight: 54, backgroundColor: C.paper, borderRadius: 10, borderWidth: 1, borderColor: C.line, paddingHorizontal: 15, color: C.ink, fontSize: 16 },
  sectionTitle: { color: C.ink, fontSize: 13, fontWeight: '600', letterSpacing: 0, marginBottom: 12, marginTop: 10 },
  empty: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 42 },
  emptyIconWrap: { width: 48, height: 48, borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyIcon: { color: C.primary, fontSize: 30 },
  emptyTitle: { textAlign: 'center', color: C.ink, fontFamily: editorialFont, fontSize: 25, fontWeight: '400', letterSpacing: -0.5 },
  emptyMessage: { color: C.moss, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
});
