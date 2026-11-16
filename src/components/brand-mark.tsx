import { Image, View } from 'react-native';

export function BrandMark({ size = 44 }: { size?: number }) {
  return <View style={{ width: size, height: size, padding: size * 0.04 }}><Image accessibilityLabel="Hoopi" source={require('@/assets/images/hoopi-mark.png')} style={{ width: '100%', height: '100%', borderRadius: size * 0.2 }} resizeMode="contain" /></View>;
}
