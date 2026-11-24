import Svg, { Ellipse, Path, Circle } from "react-native-svg";
import { C } from "@/constants/design";

/** An ink-and-petal illustration, drawn natively at every screen density. */
export function EditorialBloom({
  size = 110,
  muted = false,
}: {
  size?: number;
  muted?: boolean;
}) {
  const colors = muted
    ? ["#E8C9B6", "#E1B29C", "#F3DCD0"]
    : [C.primary, C.coral, "#C59C6B", "#8B977C"];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden={true}
      pointerEvents="none"
    >
      {[-66, -44, -22, 0, 22, 44, 66].map((angle, index) => (
        <Ellipse
          key={angle}
          cx="60"
          cy="36"
          rx="7.5"
          ry="27"
          fill={colors[index % colors.length]}
          transform={`rotate(${angle} 60 82)`}
        />
      ))}
      <Path
        d="M60 75 C59 91 57 101 49 114"
        stroke={muted ? "#E8C9B6" : C.primary}
        strokeWidth="1.3"
        fill="none"
      />
      <Path
        d="M56 98 C69 81 85 82 89 84 C80 98 66 104 56 98"
        fill={muted ? "#E8C9B6" : "#8B977C"}
      />
      <Circle cx="60" cy="78" r="4.3" fill={muted ? "#F3DCD0" : C.primary} />
    </Svg>
  );
}
