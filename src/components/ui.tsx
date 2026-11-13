import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const C = { canvas: '#F7F5EE', paper: '#FFFFFF', ink: '#263D33', forest: '#204B3C', leaf: '#398064', moss: '#68786D', line: '#E5E7DE', mint: '#E5EFE5', pale: '#EEF2EA', coral: '#D8795E', white: '#FFFFFF', red: '#B83E36' };
export function Screen({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) { return <SafeAreaView edges={['top']} style={[styles.screen, style]}>{children}</SafeAreaView>; }
export function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) { return <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{action}</View>; }
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ title, onPress, secondary = false, disabled = false, busy = false, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; busy?: boolean; style?: ViewStyle }) { return <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, (pressed || disabled || busy) && { opacity: 0.65 }, style]}>{busy ? <ActivityIndicator color={secondary ? C.forest : C.white} /> : <Text style={[styles.buttonText, secondary && { color: C.forest }]}>{title}</Text>}</Pressable>; }
export function Field(props: TextInputProps) { return <TextInput placeholderTextColor="#89948A" selectionColor={C.leaf} {...props} style={[styles.field, props.style]} />; }
export function SectionTitle({ children }: React.PropsWithChildren) { return <Text style={styles.sectionTitle}>{children}</Text>; }
export function EmptyState({ title, message, icon = '✦' }: { title: string; message: string; icon?: string }) { return <View style={styles.empty}><Text style={styles.emptyIcon}>{icon}</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyMessage}>{message}</Text></View>; }
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas, paddingHorizontal: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 18 },
  title: { color: C.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { color: C.moss, fontSize: 13, marginTop: 4 },
  card: { backgroundColor: C.paper, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 16 },
  button: { backgroundColor: C.forest, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonSecondary: { backgroundColor: C.mint },
  buttonText: { color: C.white, fontSize: 15, fontWeight: '700' },
  field: { height: 52, backgroundColor: C.paper, borderRadius: 14, borderWidth: 1, borderColor: C.line, paddingHorizontal: 15, color: C.ink, fontSize: 16 },
  sectionTitle: { color: C.moss, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 42 },
  emptyIcon: { color: C.leaf, fontSize: 34, marginBottom: 12 },
  emptyTitle: { color: C.ink, fontSize: 18, fontWeight: '700' },
  emptyMessage: { color: C.moss, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
});
