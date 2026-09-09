import React, { useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { Button, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";

const { width } = Dimensions.get("window");

interface Props {
  navigation: any;
  onComplete?: () => void;
}

const SLIDES = [
  {
    icon: "camera",
    tint: "#d85c2c",
    title: "Scan your CV",
    body: "Point your camera at an existing CV — we pull out your experience, skills and contact details automatically.",
  },
  {
    icon: "sparkles",
    tint: "#7c3aed",
    title: "Sumaiya writes with you",
    body: "Chat in English or Swahili. Your AI assistant drafts summaries, tailors to a job, and fixes the wording.",
  },
  {
    icon: "grid",
    tint: "#0e9488",
    title: "260+ templates",
    body: "Every one built to pass employer screening (ATS). Switch designs any time — your content carries over.",
  },
  {
    icon: "download",
    tint: "#c77a17",
    title: "Export & apply",
    body: "Download a clean PDF or Word file and share straight to email, LinkedIn or WhatsApp.",
  },
];

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const c = useThemeColors();
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, input, [8, 24, 8], "clamp"),
      opacity: interpolate(scrollX.value, input, [0.35, 1, 0.35], "clamp"),
    };
  });
  return <Animated.View style={[style, { height: 8, borderRadius: 4, backgroundColor: c.accent }]} />;
}

function Slide({
  item,
  index,
  scrollX,
}: {
  item: (typeof SLIDES)[number];
  index: number;
  scrollX: SharedValue<number>;
}) {
  const c = useThemeColors();
  const iconStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    const scale: number = interpolate(scrollX.value, input, [0.6, 1, 0.6], "clamp");
    const translateY: number = interpolate(scrollX.value, input, [40, 0, 40], "clamp");
    return {
      transform: [{ scale }, { translateY }] as unknown as [],
      opacity: interpolate(scrollX.value, input, [0, 1, 0], "clamp"),
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return { opacity: interpolate(scrollX.value, input, [0, 1, 0], "clamp") };
  });

  return (
    <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 28 }}>
      <Animated.View
        style={[
          iconStyle,
          {
            width: 132,
            height: 132,
            borderRadius: 40,
            backgroundColor: item.tint + "1a",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Icon name={item.icon} size={56} color={item.tint} strokeWidth={1.75} />
      </Animated.View>
      <Animated.View style={[textStyle, { alignItems: "center", gap: 12 }]}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", textAlign: "center", letterSpacing: -0.5 }}>
          {item.title}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 15.5, textAlign: "center", lineHeight: 23, maxWidth: 320 }}>
          {item.body}
        </Text>
      </Animated.View>
    </View>
  );
}

export function OnboardingScreen({ onComplete }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const ref = useRef<Animated.ScrollView>(null);
  const [page, setPage] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const goTo = (p: number) => {
    haptics.selection();
    ref.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
  };

  const isLast = page === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ height: insets.top + 8 }} />

      <Pressable
        onPress={() => onComplete?.()}
        hitSlop={10}
        style={{ alignSelf: "flex-end", paddingHorizontal: 20, paddingVertical: 8 }}
      >
        <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "700" }}>Skip</Text>
      </Pressable>

      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((item, i) => (
          <Slide key={i} item={item} index={i} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20, gap: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 7 }}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        <Animated.View entering={FadeIn}>
          <Button
            label={isLast ? "Get started" : "Next"}
            size="lg"
            onPress={() => (isLast ? onComplete?.() : goTo(page + 1))}
          />
        </Animated.View>
      </View>
    </View>
  );
}
