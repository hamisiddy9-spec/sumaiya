import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Job } from "@sumaiya/types";
import { Button, Card, Screen, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";

export function JobDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useThemeColors();
  const job = route.params?.job as Job | undefined;

  if (!job) {
    return (
      <Screen scroll={false} keyboardAvoiding={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Icon name="briefcase" size={32} color={c.textMuted} />
          <Text style={{ color: c.textMuted }}>This job is no longer available.</Text>
          <Button label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const meta = [
    { icon: "map-pin", value: job.location },
    { icon: "briefcase", value: job.jobType?.replace("-", " ") },
    job.salary ? { icon: "badge", value: job.salary } : null,
  ].filter(Boolean) as { icon: string; value: string }[];

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      footer={
        <Button
          label="Tailor my CV for this"
          size="lg"
          onPress={() => navigation.navigate("Chat", { section: "tailor" })}
        />
      }
    >
      <Pressable
        hitSlop={10}
        onPress={() => {
          haptics.selection();
          navigation.goBack();
        }}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={{ color: c.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.4, lineHeight: 31 }}>
          {job.title}
        </Text>
        <Text style={{ color: c.accent, fontSize: 15.5, fontWeight: "700", marginTop: 4 }}>{job.company}</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {meta.map((m) => (
            <View
              key={m.icon}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: c.bgElevated,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Icon name={m.icon} size={12} color={c.textMuted} />
              <Text style={{ color: c.textBody, fontSize: 12.5, fontWeight: "600", textTransform: "capitalize" }}>
                {m.value}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(70)} style={{ marginTop: 22 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>About the role</Text>
        <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 22 }}>{job.description}</Text>
      </Animated.View>

      {job.requirements?.length ? (
        <Animated.View entering={FadeInDown.duration(300).delay(140)} style={{ marginTop: 22 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "700", marginBottom: 10 }}>Requirements</Text>
          <Card style={{ gap: 10 }}>
            {job.requirements.map((r, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 9 }}>
                <Icon name="check" size={15} color={c.success} />
                <Text style={{ flex: 1, color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{r}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>
      ) : null}
    </Screen>
  );
}
