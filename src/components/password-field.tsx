import { useState } from 'react';
import { Pressable, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, Field } from '@/components/ui';

export function PasswordField(props: TextInputProps) {
  const [visible, setVisible] = useState(false);
  return <View><Field {...props} secureTextEntry={!visible} autoCapitalize="none" style={{ paddingRight: 54 }} /><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} accessibilityState={{ checked: visible }} onPress={() => setVisible(value => !value)} style={{ position: 'absolute', right: 4, top: 4, bottom: 4, width: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.moss} /></Pressable></View>;
}
