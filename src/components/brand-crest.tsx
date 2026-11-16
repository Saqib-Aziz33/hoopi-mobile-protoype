import { View } from 'react-native';
import { C } from '@/components/ui';

/** Five fine rays and open tips echo the hoopoe crest in the original logo. */
export function BrandCrest({ size = 76 }: { size?: number }) {
  const origin = { x: size * 0.48, y: size * 0.82 };
  const tips = [[0.1, 0.5], [0.23, 0.23], [0.48, 0.12], [0.71, 0.25], [0.88, 0.48]];
  const colors = [C.primary, C.primary, C.blue, C.blue, C.cyan];
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    {tips.map(([x, y], index) => {
      const end = { x: size * x, y: size * y };
      const length = Math.hypot(end.x - origin.x, end.y - origin.y);
      const angle = Math.atan2(end.y - origin.y, end.x - origin.x) * 180 / Math.PI;
      const tipSize = size * 0.085;
      return <View key={index} style={{ position: 'absolute', inset: 0 }}>
        <View style={{ position: 'absolute', width: length, height: 1, left: (origin.x + end.x - length) / 2, top: (origin.y + end.y) / 2, backgroundColor: colors[index], transform: [{ rotate: `${angle}deg` }] }} />
        <View style={{ position: 'absolute', width: tipSize, height: tipSize, borderRadius: tipSize / 2, borderWidth: 1.5, borderColor: colors[index], backgroundColor: C.canvas, left: end.x - tipSize / 2, top: end.y - tipSize / 2 }} />
      </View>;
    })}
  </View>;
}
