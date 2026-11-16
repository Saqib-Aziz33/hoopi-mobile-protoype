import { View } from 'react-native';
import { C } from '@/components/ui';

/** A small line drawing that echoes the movement in Hoopi's mark. */
export function BrandOrbit({ size = 76 }: { size?: number }) {
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    {[C.primary, C.blue, C.cyan].map((color, index) => <View key={color} style={{ position: 'absolute', width: size * 0.78, height: size * 0.43, top: size * 0.28, left: size * 0.11, borderWidth: 1.5, borderColor: color, borderRadius: size, transform: [{ rotate: `${index * 60 - 30}deg` }] }} />)}
    <View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary, top: size * 0.47, left: size * 0.47 }} />
  </View>;
}
