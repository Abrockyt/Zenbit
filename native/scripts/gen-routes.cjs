// One-off generator for the expo-router migration: writes a thin shim file
// per screen under app/, each rendering the existing, UNMODIFIED screen
// component from src/screens with navigation/route props reconstructed via
// routerShim. Route names match the old React Navigation screen names
// exactly, so screen-internal navigate("X") calls keep working unchanged.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const APP = path.join(ROOT, "app");

// name -> import path (relative to app/<Name>.tsx, i.e. one level up from app/)
const ROOT_ROUTES = {
  Welcome: "../src/screens/WelcomeScreen",
  Login: "../src/screens/auth/LoginScreen",
  SignUp: "../src/screens/auth/SignUpScreen",
  VerifyEmail: "../src/screens/auth/VerifyEmailScreen",
  Terms: "../src/screens/auth/TermsScreen",
  Country: "../src/screens/auth/CountryScreen",
  CreateWallet: "../src/screens/auth/CreateWalletScreen",
  PickWatchlist: "../src/screens/auth/PickWatchlistScreen",
  FaceId: "../src/screens/auth/FaceIdScreen",
  Passcode: "../src/screens/auth/PasscodeScreen",
  RestoreWallet: "../src/screens/auth/RestoreWalletScreen",
  AppLock: "../src/screens/auth/AppLockScreen",

  KycIntro: "../src/screens/kyc/KycIntroScreen",
  KycDocuments: "../src/screens/kyc/KycDocumentsScreen",
  KycStatus: "../src/screens/kyc/KycStatusScreen",

  CoinDetail: "../src/screens/CoinDetailScreen",
  Watchlist: "../src/screens/WatchlistScreen",
  Asset: "../src/screens/AssetScreen",
  RecentActivity: "../src/screens/RecentActivityScreen",
  TransactionDetail: "../src/screens/TransactionDetailScreen",

  CardDetail: "../src/screens/CardDetailScreen",

  Send: "../src/screens/money/SendScreen",
  ScanQr: "../src/screens/money/ScanQrScreen",
  Receive: "../src/screens/money/ReceiveScreen",
  Buy: "../src/screens/money/TradeFlowScreen",
  Sell: "../src/screens/money/TradeFlowScreen",
  AddFunds: "../src/screens/money/AddFundsScreen",
  PaymentMethods: "../src/screens/money/PaymentMethodsScreen",

  Compose: "../src/screens/social/ComposeScreen",
  PostDetail: "../src/screens/social/PostDetailScreen",
  UserProfile: "../src/screens/social/UserProfileScreen",
  FollowList: "../src/screens/social/FollowListScreen",
  Communities: "../src/screens/social/CommunitiesScreen",
  Community: "../src/screens/social/CommunityScreen",

  Threads: "../src/screens/chat/ThreadsScreen",
  Conversation: "../src/screens/chat/ConversationScreen",
  AiChat: "../src/screens/AiChatScreen",

  Settings: "../src/screens/settings/SettingsScreen",
  Security: "../src/screens/settings/SecurityScreen",
  Privacy: "../src/screens/settings/PrivacyScreen",
  NotificationSettings: "../src/screens/settings/NotificationsScreen",
  BlockedAccounts: "../src/screens/settings/BlockedAccountsScreen",
  Reports: "../src/screens/settings/ReportsScreen",
  Currency: "../src/screens/settings/CurrencyScreen",
  PriceAlerts: "../src/screens/settings/PriceAlertsScreen",
};

// name -> import path (relative to app/(tabs)/<Name>.tsx, i.e. two levels up)
const TAB_ROUTES = {
  Home: "../../src/screens/HomeScreen",
  Market: "../../src/screens/MarketScreen",
  Swap: "../../src/screens/SwapScreen",
  Card: "../../src/screens/CardScreen",
  Feed: "../../src/screens/social/FeedScreen",
  Profile: "../../src/screens/ProfileScreen",
};

function shimSource(componentImportPath, shimImportPath) {
  return `import Screen from "${componentImportPath}";
import { useShimNavigation, useShimRoute } from "${shimImportPath}";

export default function Route() {
  const navigation = useShimNavigation();
  const route = useShimRoute();
  return <Screen navigation={navigation} route={route} />;
}
`;
}

let written = 0;
for (const [name, importPath] of Object.entries(ROOT_ROUTES)) {
  const file = path.join(APP, `${name}.tsx`);
  fs.writeFileSync(file, shimSource(importPath, "../src/lib/routerShim"));
  written++;
}

const tabsDir = path.join(APP, "(tabs)");
for (const [name, importPath] of Object.entries(TAB_ROUTES)) {
  const file = path.join(tabsDir, `${name}.tsx`);
  fs.writeFileSync(file, shimSource(importPath, "../../src/lib/routerShim"));
  written++;
}

console.log(`Wrote ${written} route shim files.`);
