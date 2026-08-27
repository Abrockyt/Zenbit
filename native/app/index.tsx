import { Redirect } from "expo-router";

// The app's actual first screen is "Welcome" (app/Welcome.tsx) — kept as
// its own named route (not "index") so every existing
// navigation.navigate("Welcome") / navigation.navigate("SignUp") etc. call
// site in the screen components keeps working unchanged. This file only
// exists to give expo-router something to resolve "/" to.
export default function Index() {
  return <Redirect href="/Welcome" />;
}
