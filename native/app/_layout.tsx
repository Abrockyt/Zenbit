import { useCallback, useEffect } from "react";
import { View, Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import { GeistMono_500Medium, GeistMono_600SemiBold } from "@expo-google-fonts/geist-mono";
import { ChakraPetch_600SemiBold } from "@expo-google-fonts/chakra-petch";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
// @ts-nocheck — screens are .jsx, not yet typed
import { AppProvider } from "../src/state/store";
import { ThemeProvider, useTheme } from "../src/state/ThemeProvider";
import { useAppLock } from "../src/state/useAppLock";
import ToastHost from "../src/ui/ToastHost";
import { colors, fonts, onThemeChange } from "../src/theme";
import RadialBackground from "../src/ui/RadialBackground";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppLockGate() {
  useAppLock();
  return null;
}

// @ts-ignore
Text.defaultProps = { ...(Text.defaultProps ?? {}), style: [{ fontFamily: fonts.regular, color: colors.textPrimary }] };
// @ts-ignore
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), style: [{ fontFamily: fonts.regular }], placeholderTextColor: colors.textTertiary };

onThemeChange(() => {
  // @ts-ignore
  Text.defaultProps.style = [{ fontFamily: fonts.regular, color: colors.textPrimary }];
  // @ts-ignore
  TextInput.defaultProps.placeholderTextColor = colors.textTertiary;
});

export default function RootLayout() {
  useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    ChakraPetch_600SemiBold,
  });

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
    <ThemeProvider>
    <AppProvider>
      <View style={{ flex: 1, backgroundColor: colors.surfaceScreen }}>
      <RadialBackground />
      <AppLockGate />
      <ToastHost />
      <View style={{ flex: 1 }} onLayout={onLayout}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* No swipe-back and no header gesture: AppLock is pushed on top of
            the tabs when the app resumes, so with the default gesture you
            could simply swipe it away without ever entering the passcode. */}
        <Stack.Screen name="AppLock" options={{ gestureEnabled: false }} />
      </Stack>
      </View>
      </View>
      <ThemedStatusBar />
    </AppProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { isLight } = useTheme();
  return <StatusBar style={isLight ? "dark" : "light"} />;
}
