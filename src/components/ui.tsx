import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export const C = {
  canvas: '#F8F9FF',
  paper: '#FFFFFF',
  ink: '#171B35',
  primary: '#4816FB',
  blue: '#2559FB',
  cyan: '#02D1FC',
  moss: '#727A95',
  line: '#E6E9F3',
  lavender: '#F1EDFF',
  blueTint: '#E8F5FF',
  coral: '#E25974',
  white: '#FFFFFF',
  red: '#D53B68',
  amber: '#C17A16',
};

export function Screen({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, style]}>
      <Animated.View entering={FadeInDown.duration(360)} style={styles.screenInner}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

export function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInUp.duration(380)} style={styles.heading}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </Animated.View>
  );
}

export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return <Animated.View entering={FadeInDown.duration(420).springify().damping(19)} style={[styles.card, style]}>{children}</Animated.View>;
}

export function Button({ title, onPress, secondary = false, disabled = false, busy = false, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; busy?: boolean; style?: ViewStyle }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || busy}
        onPress={onPress}
        // Reanimated shared values are intentionally updated in native gesture callbacks.
        // eslint-disable-next-line react-hooks/immutability
        onPressIn={() => { scale.value = withSpring(0.975, { damping: 16, stiffness: 280 }); }}
        // eslint-disable-next-line react-hooks/immutability
        onPressOut={() => { scale.value = withSpring(1, { damping: 13, stiffness: 240 }); }}
        style={[styles.button, secondary && styles.buttonSecondary, (disabled || busy) && { opacity: 0.62 }]}
      >
        {secondary ? null : <LinearGradient colors={['#4816FB', '#2559FB', '#02BDFC']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />}
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
        disabled={disabled}
        onPress={onPress}
        // Reanimated shared values are intentionally updated in native gesture callbacks.
        // eslint-disable-next-line react-hooks/immutability
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 14, stiffness: 280 }); }}
        // eslint-disable-next-line react-hooks/immutability
        onPressOut={() => { scale.value = withSpring(1, { damping: 13, stiffness: 240 }); }}
        style={({ pressed }) => [styles.iconButton, disabled && { opacity: 0.55 }, pressed && { opacity: 0.9 }]}
      >
        <LinearGradient colors={['#4816FB', '#2559FB', '#02BDFC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Ionicons name={name} size={22} color={C.white} />
      </Pressable>
    </Animated.View>
  );
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor="#9299AF" selectionColor={C.primary} {...props} style={[styles.field, props.style]} />;
}

export function SectionTitle({ children }: React.PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function EmptyState({ title, message, icon = '✦' }: { title: string; message: string; icon?: string }) {
  return (
    <View style={styles.empty}>
      <LinearGradient colors={['#F1EDFF', '#E7F7FF']} style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>{icon}</Text>
      </LinearGradient>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas, paddingHorizontal: 20 },
  screenInner: { flex: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 18 },
  title: { color: C.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { color: C.moss, fontSize: 13, marginTop: 4 },
  card: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16, shadowColor: '#283563', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.045, shadowRadius: 14, elevation: 2 },
  button: { overflow: 'hidden', backgroundColor: C.primary, minHeight: 49, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonSecondary: { backgroundColor: C.lavender },
  buttonText: { color: C.white, fontSize: 15, fontWeight: '700' },
  iconButton: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  field: { height: 52, backgroundColor: C.paper, borderRadius: 15, borderWidth: 1, borderColor: C.line, paddingHorizontal: 15, color: C.ink, fontSize: 16 },
  sectionTitle: { color: C.moss, fontSize: 11, fontWeight: '700', letterSpacing: 1.15, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 42 },
  emptyIconWrap: { width: 62, height: 62, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyIcon: { color: C.primary, fontSize: 30 },
  emptyTitle: { color: C.ink, fontSize: 18, fontWeight: '700' },
  emptyMessage: { color: C.moss, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
});
