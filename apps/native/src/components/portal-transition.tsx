import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SumaiyaMark } from "./sumaiya-mark";
import { useThemeColors } from "./ui/theme";
import { EASE } from "./ui/motion";
import { MARK_WELL, wellBackground } from "./ui/mark-well-tokens";
import { haptics } from "./ui/haptics";

/**
 * The "Anza" moment — entering the product *through* the mark.
 *
 * One clock, three beats:
 *
 *   1. IGNITE  (0→180ms)   the slide collapses; at 180ms the field catches
 *                          from the centre of where its art was.
 *   2. BLOOM   (180→760ms) the field floods the screen. The mark runs the
 *                          *same* easing over the *same* window as the field,
 *                          so it rides the leading edge of the flood instead
 *                          of racing it, and it only fades in once there is
 *                          accent behind it to be seen against.
 *   3. HANDOFF (760ms)     the field is opaque edge-to-edge; the mark leaves
 *                          while the colour still holds, then `onDone` fires.
 *
 * There is deliberately no flash, and no second animation on the way out. The
 * root stack's own `fade` transition dissolves this colour field into the
 * screen underneath (sign-in, already mounted and at rest), so the reveal *is*
 * the navigator's cross-fade — one dissolve, nothing else moving.
 *
 * Everything this component used to stack onto that moment read as unrelated
 * choreographies finishing at once: a cream wash over the bloom's peak (which
 * the handoff then cut off mid-flight), a mark scaling on its own curve to
 * 3.4× while the field grew on another (two centres of expansion for the eye),
 * and a destination screen re-animating its logo on top of all of it.
 *
 * The mark here is the SAME object the slides left on screen — `MARK_WELL`'s
 * container and size, so the hand-off adds no size jump and no container
 * change — riding the flood on the same `EASE` family the rest of the path
 * uses. It has to change ink (`accentText`, not `accent`): by the time it is
 * visible the field behind it *is* the accent, so accent-coloured blades would
 * paint cream-on-cream. That is the one difference between this frame and the
 * rest of the path, and it is a contrast requirement, not a style choice.
 */
// The single clock. COVER_AT is the moment the field is opaque everywhere —
// everything else in this file is expressed relative to it.
const IGNITE_MS = 180;
const BLOOM_MS = 580;
const COVER_AT = IGNITE_MS + BLOOM_MS; // 760ms
// The mark fades in only after the field has grown enough to sit behind it —
// fading it in at t=0 painted cream blades on a cream page, i.e. nothing.
const MARK_IN_AT = 240;
const MARK_IN_MS = 160;
// How long the mark takes to leave once the field has covered the screen. It
// must be gone *before* the navigator's reveal starts, or it ghosts on top of
// the incoming screen's own brand mark.
const MARK_OUT_MS = 140;
// The mark's bloom ceiling, and the scale it starts from. The field and the
// mark are set in motion at IGNITE_MS with the same easing and duration, so
// they read as one object: the size ratio between them never changes.
//
// It starts at 1.0 — the size the slide's mark was already at — because the
// previous 1.18 existed to fake the old 64 → 78 jump by starting the mark at
// 64 * 1.18 ≈ 75.5. With one shared well there is no jump to fake: the mark
// continues from where the slide left it.
const MARK_FROM = 1;
const MARK_TO = 1.55;

export function PortalTransition({
  onDone,
  origin,
}: {
  onDone: () => void;
  /** Real on-screen centre of the last-seen slide's art, measured just before
   *  this mounts — the bloom grows from there instead of the screen's
   *  geometric centre, which sits below where the art actually was (art is
   *  grouped with the title/body under it, centred as a pair, not alone).
   *  Falls back to screen centre if the measurement didn't land in time. */
  origin?: { x: number; y: number } | null;
}) {
  const c = useThemeColors();
  // Live, not a module-level Dimensions.get() snapshot taken once at bundle
  // load — a fold/unfold changes the window size without an app restart.
  const { width, height } = useWindowDimensions();
  const DIAG = Math.hypot(width, height);
  // The flooding disc must fully cover the screen at full bloom regardless of
  // where it starts from. DIAG/2 only guarantees that from dead-centre — once
  // the origin can be anywhere on screen (see `origin` prop), the worst case
  // (origin near one corner, farthest point the opposite corner) approaches the
  // full diagonal, so the disc's own diameter needs to be DIAG*2 (radius DIAG).
  const COVER = DIAG * 2;
  const ox = origin?.x ?? width / 2;
  const oy = origin?.y ?? height / 2;

  // 0 = the field is a point at the origin, 1 = it covers the screen.
  const disc = useSharedValue(0);
  const markScale = useSharedValue(MARK_FROM);
  const markOpacity = useSharedValue(0);

  // The parent passes `onDone` inline, and it does re-render while this is on
  // screen (a 1400ms mark-state timer from the language pick can land
  // mid-portal). Reading the callback through a ref keeps the timeline below
  // on stable deps, so it runs exactly once — otherwise a mid-flight re-render
  // reassigns every animation and the whole sequence visibly restarts.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  const fireDone = useCallback(() => doneRef.current(), []);

  useEffect(() => {
    // Haptics choreographed to the same three beats the eye sees: the collapse
    // (light), the ignition (the bloom kicks off — medium), the arrival (the
    // field covers — success). One tap at t=0 and silence for the rest of the
    // sequence reads as disconnected from what's on screen; this doesn't.
    haptics.light();
    const release = setTimeout(() => haptics.medium(), IGNITE_MS);

    markOpacity.value = withSequence(
      withDelay(MARK_IN_AT, withTiming(1, { duration: MARK_IN_MS, easing: EASE.out })),
      // hold through the rest of the flood, then leave — see MARK_OUT_MS
      withDelay(COVER_AT - (MARK_IN_AT + MARK_IN_MS), withTiming(0, { duration: MARK_OUT_MS, easing: EASE.in })),
    );

    // Same easing, same duration, same start as the field — one object.
    markScale.value = withDelay(
      IGNITE_MS,
      withTiming(MARK_TO, { duration: BLOOM_MS, easing: EASE.in }),
    );

    disc.value = withDelay(
      IGNITE_MS,
      withTiming(1, { duration: BLOOM_MS, easing: EASE.in }, (finished) => {
        "worklet";
        if (!finished) return;
        runOnJS(haptics.success)();
        runOnJS(fireDone)();
      }),
    );

    return () => clearTimeout(release);
  }, [disc, markScale, markOpacity, fireDone]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: disc.value }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* the flooding field */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: ox - COVER / 2,
            top: oy - COVER / 2,
            width: COVER,
            height: COVER,
            borderRadius: COVER / 2,
            backgroundColor: c.accent,
          },
          discStyle,
        ]}
      />
      {/* the mark, riding the leading edge of the flood — same well geometry
          and same mark size as the slide it left, so nothing resizes here */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: ox - MARK_WELL.size / 2,
            top: oy - MARK_WELL.size / 2,
            width: MARK_WELL.size,
            height: MARK_WELL.size,
            borderRadius: MARK_WELL.radius,
            backgroundColor: wellBackground(c.accent),
            alignItems: "center",
            justifyContent: "center",
          },
          markStyle,
        ]}
      >
        <SumaiyaMark size={MARK_WELL.mark} state="thinking" color={c.accentText} />
      </Animated.View>
    </View>
  );
}
