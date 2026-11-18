import { useEffect } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { BrandCrest } from '@/components/brand-crest';
import { C, editorialFont } from '@/components/ui';
import type { VoiceError, VoiceState } from '@/lib/voice-mode';

const labels = { idle: 'Voice mode', requesting: 'Preparing microphone', connecting: 'Connecting to Hoopi', listening: 'Your turn', thinking: 'Thinking it through', speaking: 'Hoopi is speaking', ending: 'Ending conversation' };

export function VoiceModeButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Start voice conversation" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.launch, { opacity: disabled ? 0.4 : 1, backgroundColor: pressed ? C.lavender : 'transparent' }]}>
    <Ionicons name="headset-outline" size={18} color={C.primary} /><Text style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>Voice</Text>
  </Pressable>;
}

export function VoiceModePanel({ state, onStop, onMute }: { state: VoiceState; onStop: () => void; onMute: () => void }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  const waiting = ['requesting', 'connecting', 'ending'].includes(state.status);
  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = reduced || waiting || state.muted ? withTiming(1) : withRepeat(withSequence(withTiming(1.08, { duration: state.status === 'speaking' ? 550 : 1100 }), withTiming(1, { duration: 1100 })), -1);
    return () => cancelAnimation(pulse);
  }, [state.status, state.muted, waiting, reduced, pulse]);
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>A CONVERSATION WITH HOOPI</Text>
      <View style={styles.emblem}><Animated.View style={[styles.halo, halo]} /><BrandCrest size={100} /></View>
      <Text accessibilityLiveRegion="polite" style={styles.title}>{labels[state.status]}</Text>
      <View style={styles.subtitle}>{waiting ? <ActivityIndicator size="small" color={C.primary} /> : null}<Text style={styles.hint}>{state.muted && !waiting ? 'Your microphone is muted.' : state.status === 'listening' ? 'Speak naturally. I’m listening.' : state.status === 'speaking' ? 'You can speak to interrupt.' : state.status === 'thinking' ? 'A little room for a thought.' : state.status === 'ending' ? 'Closing the microphone…' : 'Your voice connects to your workspace.'}</Text></View>
      {state.heard ? <View style={styles.transcript}><Text style={styles.speaker}>YOU</Text><Text selectable style={styles.words}>{state.heard}</Text></View> : null}
      {state.answer ? <View style={styles.transcript}><Text style={[styles.speaker, { color: C.primary }]}>HOOPI</Text><Text selectable style={styles.words}>{state.answer}</Text></View> : null}
    </ScrollView>
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel={state.muted ? 'Unmute microphone' : 'Mute microphone'} accessibilityState={{ selected: state.muted, disabled: waiting }} disabled={waiting} onPress={onMute} style={[styles.control, { backgroundColor: state.muted ? C.lavender : C.white, opacity: waiting ? 0.4 : 1 }]}><Ionicons name={state.muted ? 'mic-off-outline' : 'mic-outline'} size={23} color={C.primary} /><Text style={styles.controlLabel}>{state.muted ? 'Unmute' : 'Mute'}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={waiting ? 'Cancel voice conversation' : 'End voice conversation'} disabled={state.status === 'ending'} onPress={onStop} style={[styles.control, { backgroundColor: C.ink, borderColor: C.ink }]}><Ionicons name="call-outline" size={23} color={C.white} style={{ transform: [{ rotate: '135deg' }] }} /><Text style={[styles.controlLabel, { color: C.white }]}>{waiting ? 'Cancel' : 'End call'}</Text></Pressable>
    </View>
    <Text style={styles.footer}>Live voice · Responses can contain mistakes</Text>
  </View>;
}

export function VoiceModeError({ error, onDismiss }: { error: VoiceError | null; onDismiss: () => void }) {
  if (!error) return null;
  return <View style={{ padding: 16, gap: 4 }}><Text accessibilityLiveRegion="polite" style={{ color: C.red, fontSize: 13, lineHeight: 20 }}>{error.message}</Text><View style={{ flexDirection: 'row', gap: 20 }}>{error.settings ? <Pressable accessibilityRole="button" onPress={() => { void Linking.openSettings().catch(() => Alert.alert('Open device settings', 'Allow microphone access for Hoopi, then try again.')); }} style={styles.textButton}><Text style={{ color: C.primary }}>Open settings</Text></Pressable> : null}<Pressable accessibilityRole="button" onPress={onDismiss} style={styles.textButton}><Text style={{ color: C.moss }}>Dismiss</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  launch: { flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  content: { flexGrow: 1, padding: 28, paddingTop: 32, alignItems: 'center' },
  eyebrow: { fontSize: 9, letterSpacing: 2, color: C.moss, textAlign: 'center' },
  emblem: { marginTop: 30, marginBottom: 26, width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  halo: { position: 'absolute', inset: 0, backgroundColor: C.lavender, borderRadius: 70, borderWidth: 1, borderColor: C.line },
  title: { fontFamily: editorialFont, fontSize: 28, color: C.ink, textAlign: 'center' },
  subtitle: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 12, marginBottom: 30 },
  hint: { fontSize: 12, lineHeight: 20, color: C.moss, flexShrink: 1, textAlign: 'center' },
  transcript: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 18, gap: 8 },
  speaker: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: C.moss },
  words: { fontSize: 17, lineHeight: 27, color: C.ink },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 12 },
  control: { flex: 1, maxWidth: 180, minHeight: 66, borderRadius: 16, borderWidth: 1, borderColor: C.line, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  controlLabel: { color: C.primary, fontSize: 13, fontWeight: '600' },
  footer: { color: C.moss, fontSize: 10, textAlign: 'center', paddingVertical: 20, paddingHorizontal: 24 },
  textButton: { minHeight: 44, justifyContent: 'center' },
});
