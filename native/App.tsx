import { useCallback, useEffect } from "react";
import { View, Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import { GeistMono_500Medium, GeistMono_600SemiBold } from "@expo-google-fonts/geist-mono";
import { ChakraPetch_600SemiBold } from "@expo-google-fonts/chakra-petch";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// @ts-nocheck — screens are .jsx, not yet typed
import { AppProvider } from "./src/state/store";
import { colors, fonts } from "./src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Applies the loaded Hanken Grotesk everywhere without touching every
// screen's <Text> — same trick real apps use to set a global type family.
// @ts-ignore — defaultProps still works for these RN class components.
Text.defaultProps = { ...(Text.defaultProps ?? {}), style: [{ fontFamily: fonts.regular, color: colors.textPrimary }] };
// @ts-ignore
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), style: [{ fontFamily: fonts.regular }], placeholderTextColor: colors.textTertiary };

const NavTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.surfaceScreen, card: colors.surfaceScreen, border: colors.borderSubtle, primary: colors.up },
};

import WelcomeScreen from "./src/screens/WelcomeScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MarketScreen from "./src/screens/MarketScreen";
import WatchlistScreen from "./src/screens/WatchlistScreen";
import AssetScreen from "./src/screens/AssetScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import CoinDetailScreen from "./src/screens/CoinDetailScreen";
import SwapScreen from "./src/screens/SwapScreen";
import CardScreen from "./src/screens/CardScreen";
import CardDetailScreen from "./src/screens/CardDetailScreen";
import RecentActivityScreen from "./src/screens/RecentActivityScreen";
import TransactionDetailScreen from "./src/screens/TransactionDetailScreen";
import AiChatScreen from "./src/screens/AiChatScreen";

import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import VerifyEmailScreen from "./src/screens/auth/VerifyEmailScreen";
import TermsScreen from "./src/screens/auth/TermsScreen";
import CreateWalletScreen from "./src/screens/auth/CreateWalletScreen";
import FaceIdScreen from "./src/screens/auth/FaceIdScreen";
import PasscodeScreen from "./src/screens/auth/PasscodeScreen";
import RestoreWalletScreen from "./src/screens/auth/RestoreWalletScreen";
import AppLockScreen from "./src/screens/auth/AppLockScreen";

import KycIntroScreen from "./src/screens/kyc/KycIntroScreen";
import KycDocumentsScreen from "./src/screens/kyc/KycDocumentsScreen";
import KycStatusScreen from "./src/screens/kyc/KycStatusScreen";

import SendScreen from "./src/screens/money/SendScreen";
import ScanQrScreen from "./src/screens/money/ScanQrScreen";
import ReceiveScreen from "./src/screens/money/ReceiveScreen";
import AddFundsScreen from "./src/screens/money/AddFundsScreen";
import PaymentMethodsScreen from "./src/screens/money/PaymentMethodsScreen";
import TradeFlowScreen from "./src/screens/money/TradeFlowScreen";

import FeedScreen from "./src/screens/social/FeedScreen";
import ComposeScreen from "./src/screens/social/ComposeScreen";
import PostDetailScreen from "./src/screens/social/PostDetailScreen";
import UserProfileScreen from "./src/screens/social/UserProfileScreen";
import FollowListScreen from "./src/screens/social/FollowListScreen";

import ThreadsScreen from "./src/screens/chat/ThreadsScreen";
import ConversationScreen from "./src/screens/chat/ConversationScreen";

import SettingsScreen from "./src/screens/settings/SettingsScreen";
import SecurityScreen from "./src/screens/settings/SecurityScreen";
import PrivacyScreen from "./src/screens/settings/PrivacyScreen";
import NotificationsScreen from "./src/screens/settings/NotificationsScreen";
import BlockedAccountsScreen from "./src/screens/settings/BlockedAccountsScreen";
import ReportsScreen from "./src/screens/settings/ReportsScreen";
import CurrencyScreen from "./src/screens/settings/CurrencyScreen";
import PriceAlertsScreen from "./src/screens/settings/PriceAlertsScreen";

const Stack = createNativeStackNavigator();

/**
 * Full route table, mirrored 1:1 from the web app's src/App.jsx — same
 * screen set, same names, React Navigation stack instead of react-router.
 * Buy and Sell both point at TradeFlowScreen (route.name picks the mode),
 * same as the web version's Buy.jsx/Sell.jsx wrapping one TradeFlow.
 */
// Custom fonts are fetched as separate assets over the network (part of
// the EAS Update bundle, not the JS bundle itself). Blocking the entire
// app's first render on that fetch — `if (!fontsLoaded) return null` —
// meant any network hiccup or CDN delay left the screen permanently blank,
// which is exactly what happened. Fonts now load in the background instead:
// text renders with the system font immediately and swaps to Hanken
// Grotesk/Geist Mono/Chakra Petch whenever loading finishes, same pattern
// as how a real iOS app never blocks its UI on a remote asset fetch.
export default function App() {
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

  // Belt-and-suspenders: hide the splash screen after 3s regardless of
  // whether onLayout fired, so nothing can strand the app on a blank/splash
  // screen indefinitely.
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
    <AppProvider>
      <NavigationContainer theme={NavTheme}>
        <View style={{ flex: 1 }} onLayout={onLayout}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            // Omitting `animation` (rather than forcing "slide_from_right")
            // is what actually gets the real OS transition — on iOS that's
            // the literal UINavigationController push, hardware-driven and
            // interruptible by the gesture, not a JS-timed approximation of
            // it. Edge-only swipe-back (fullScreenGestureEnabled: false) is
            // also the real default; full-screen swipe is an opt-in a few
            // apps use, not what "Apple's own animation" actually looks like.
            gestureEnabled: true,
            fullScreenGestureEnabled: false,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
          <Stack.Screen name="FaceId" component={FaceIdScreen} />
          <Stack.Screen name="Passcode" component={PasscodeScreen} />
          <Stack.Screen name="RestoreWallet" component={RestoreWalletScreen} />
          <Stack.Screen name="AppLock" component={AppLockScreen} />

          <Stack.Screen name="KycIntro" component={KycIntroScreen} />
          <Stack.Screen name="KycDocuments" component={KycDocumentsScreen} />
          <Stack.Screen name="KycStatus" component={KycStatusScreen} />

          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Market" component={MarketScreen} />
          <Stack.Screen name="CoinDetail" component={CoinDetailScreen} />
          <Stack.Screen name="Watchlist" component={WatchlistScreen} />
          <Stack.Screen name="Swap" component={SwapScreen} />
          <Stack.Screen name="Asset" component={AssetScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="RecentActivity" component={RecentActivityScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />

          <Stack.Screen name="Card" component={CardScreen} />
          <Stack.Screen name="CardDetail" component={CardDetailScreen} />

          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="ScanQr" component={ScanQrScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Buy" component={TradeFlowScreen} />
          <Stack.Screen name="Sell" component={TradeFlowScreen} />
          <Stack.Screen name="AddFunds" component={AddFundsScreen} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />

          <Stack.Screen name="Feed" component={FeedScreen} />
          <Stack.Screen name="Compose" component={ComposeScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="FollowList" component={FollowListScreen} />

          <Stack.Screen name="Threads" component={ThreadsScreen} />
          <Stack.Screen name="Conversation" component={ConversationScreen} />
          <Stack.Screen name="AiChat" component={AiChatScreen} />

          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Security" component={SecurityScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationsScreen} />
          <Stack.Screen name="BlockedAccounts" component={BlockedAccountsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Currency" component={CurrencyScreen} />
          <Stack.Screen name="PriceAlerts" component={PriceAlertsScreen} />
        </Stack.Navigator>
        </View>
      </NavigationContainer>
      <StatusBar style="light" />
    </AppProvider>
    </SafeAreaProvider>
  );
}
