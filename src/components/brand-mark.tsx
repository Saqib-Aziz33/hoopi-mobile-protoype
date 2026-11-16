import { Image, View } from 'react-native';
import { C } from '@/components/ui';

export function BrandMark({ size = 44 }: { size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, padding: size * 0.1 }}><Image accessibilityLabel="Hoopi" source={require('@/assets/images/hoopi-mark.png')} style={{ width: '100%', height: '100%', borderRadius: size * 0.2 }} resizeMode="contain" /></View>;
}
