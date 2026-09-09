import React from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * Staggered entrance for a list of children — each item fades/slides up a beat
 * after the last. Wrap mapped rows: children.map((row, i) => <Stagger index={i}>…)
 */
export function Stagger({
  index,
  children,
  distance = 14,
  step = 55,
  base = 40,
}: {
  index: number;
  children: React.ReactNode;
  distance?: number;
  step?: number;
  base?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify()
        .damping(18)
        .delay(base + index * step)
        .withInitialValues({ transform: [{ translateY: distance }], opacity: 0 })}
    >
      {children}
    </Animated.View>
  );
}
