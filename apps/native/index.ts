// Must be the very first import in the app — sets up the native gesture handler
// module before anything from React Navigation loads.
import "react-native-gesture-handler";

// Initialize Sentry as early as possible — before any other module can throw —
// so the global JS error handler and native crash handlers are in place for
// everything that follows. The import itself runs Sentry.init(...).
import "./src/lib/sentry";

import { registerRootComponent } from "expo";
import * as Sentry from "@sentry/react-native";
import RootLayout from "./src/app/_layout";

// Sentry.wrap adds a top-level error boundary so an uncaught render/lifecycle
// error is captured before it reaches the dev redbox or a production crash.
registerRootComponent(Sentry.wrap(RootLayout));
