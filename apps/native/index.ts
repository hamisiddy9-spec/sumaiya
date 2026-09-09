// Must be the very first import in the app — sets up the native gesture handler
// module before anything from React Navigation loads.
import "react-native-gesture-handler";

import { registerRootComponent } from "expo";
import RootLayout from "./src/app/_layout";

registerRootComponent(RootLayout);
