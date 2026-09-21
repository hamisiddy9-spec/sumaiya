/**
 * The two shapes an account gate takes in this app, and the rule that both of
 * them follow:
 *
 *   A GUEST CAN ALWAYS GET OUT. Every gate here offers "create a free account"
 *   AND the guest's real work surface ("Jenga CV yako kwanza" / "Build my CV
 *   instead"), because the CV path — build, download, keep — needs no account
 *   at all and must never be made to look like it does.
 *
 *   `withAccountGate(Comp, gate)` is how a screen becomes account-only: the
 *   navigator keeps its screen list, and the guest who walks into that route
 *   meets the invitation instead of a broken screen. It is a wrapper *component*,
 *   never an early return inside the screen — a screen that returns before its
 *   hooks would change its hook count the moment the session lands, which React
 *   treats as a crash.
 *
 *   `offerGuestAccountOnce()` is the OTHER half (see lib/guest-invite.ts): the
 *   single invitation a guest sees after a deliverable, once ever.
 */
import React from "react";
import { View } from "react-native";
import { useAuthContext } from "../contexts/auth-context";
import { useLang, getLastKnownLang } from "../lib/i18n";
import { useAppNavigation } from "../hooks/use-app-navigation";
import {
  GUEST_DELIVERABLE_INVITE,
  GUEST_GATE_ACCEPT,
  GUEST_GATE_CONTINUE,
  GUEST_GATE_COPY,
  claimGuestInviteOnce,
  guestText,
  type GuestGateId,
} from "../lib/guest-invite";
import { openAuth } from "../navigation/root-nav";
import { EmptyState, Screen, ScreenTitle, dialog } from "./ui";

/**
 * The full-screen invitation a guest meets when they open an account-only
 * surface. Same frame as a pushed screen (title, body, two ways on) so it reads
 * as the screen answering them, not as an error.
 */
export function GuestAccountScreen({ gate, title }: { gate: GuestGateId; title?: string }) {
  const { t } = useLang();
  const navigation = useAppNavigation();
  const copy = GUEST_GATE_COPY[gate];

  return (
    <Screen scroll>
      <ScreenTitle>{title ?? t("Account needed", "Inahitaji akaunti")}</ScreenTitle>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}>
        <EmptyState
          icon="user-plus"
          title={t(copy.title.en, copy.title.sw)}
          body={t(copy.body.en, copy.body.sw)}
          actionLabel={t(GUEST_GATE_ACCEPT.en, GUEST_GATE_ACCEPT.sw)}
          onAction={() => openAuth()}
          secondaryLabel={t(GUEST_GATE_CONTINUE.en, GUEST_GATE_CONTINUE.sw)}
          onSecondary={() => navigation.navigate("CVsTab")}
        />
      </View>
    </Screen>
  );
}

/**
 * Make one screen account-only, without touching the screen itself.
 *
 *   <HomeStack.Screen name="Jobs" component={withAccountGate(JobsScreen, "jobs")} />
 *
 * Build the wrapped component ONCE at module scope: calling this inline in JSX
 * would hand the navigator a brand-new component type on every render, which
 * remounts the screen.
 */
export function withAccountGate<P extends object>(
  Inner: React.ComponentType<P>,
  gate: GuestGateId,
): React.ComponentType<P> {
  function AccountGated(props: P) {
    const { user } = useAuthContext();
    if (!user) return <GuestAccountScreen gate={gate} />;
    return <Inner {...props} />;
  }
  AccountGated.displayName = `AccountGated(${Inner.displayName ?? Inner.name ?? "Screen"})`;
  return AccountGated;
}

/**
 * A gate reached by a deliberate tap INSIDE a screen that otherwise works for
 * guests (the written review on the CV check screen), where replacing the whole
 * screen would throw away the local results the guest is reading.
 */
export function offerAccountForGate(gate: GuestGateId, lang: string = getLastKnownLang()): void {
  const copy = GUEST_GATE_COPY[gate];
  dialog.alert(guestText(copy.title, lang), guestText(copy.body, lang), [
    { text: guestText(GUEST_DELIVERABLE_INVITE.later, lang), style: "cancel" },
    { text: guestText(GUEST_GATE_ACCEPT, lang), onPress: () => openAuth() },
  ]);
}

/**
 * AFTER THE DELIVERABLE: the guest has a CV in hand (just saved, or just
 * downloaded), so this is the moment they can be told what an account EARNS
 * them. At most once in the life of the install — claimGuestInviteOnce records
 * it before the dialog appears — and a no-op for anyone with an account.
 */
export async function offerGuestAccountOnce({
  isGuest,
  onAccept = openAuth,
}: {
  isGuest: boolean;
  onAccept?: () => void;
}): Promise<boolean> {
  if (!isGuest) return false;
  const due = await claimGuestInviteOnce();
  if (!due) return false;

  const lang = getLastKnownLang();
  const invite = GUEST_DELIVERABLE_INVITE;
  dialog.alert(guestText(invite.title, lang), guestText(invite.body, lang), [
    { text: guestText(invite.later, lang), style: "cancel" },
    { text: guestText(invite.accept, lang), onPress: onAccept },
  ]);
  return true;
}
