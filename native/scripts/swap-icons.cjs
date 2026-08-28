// One-off: redirect every `import { Feather, ... } from "@expo/vector-icons"`
// to pull Feather from src/ui/IconCompat instead (Ionicons-backed, see that
// file), keeping any other named imports (Ionicons, AntDesign, ...) coming
// from the real package unchanged. Every call site's JSX is untouched.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COMPAT_FILE = path.join(ROOT, "src/ui/IconCompat.jsx");

const files = [
  "src/navigation/MainTabs.jsx",
  "src/screens/AssetScreen.jsx",
  "src/screens/auth/AppLockScreen.jsx",
  "src/screens/auth/CountryScreen.jsx",
  "src/screens/auth/CreateWalletScreen.jsx",
  "src/screens/auth/FaceIdScreen.jsx",
  "src/screens/auth/LoginScreen.jsx",
  "src/screens/auth/PickWatchlistScreen.jsx",
  "src/screens/auth/TermsScreen.jsx",
  "src/screens/auth/VerifyEmailScreen.jsx",
  "src/screens/CardScreen.jsx",
  "src/screens/chat/ThreadsScreen.jsx",
  "src/screens/CoinDetailScreen.jsx",
  "src/screens/HomeScreen.jsx",
  "src/screens/kyc/KycIntroScreen.jsx",
  "src/screens/kyc/KycStatusScreen.jsx",
  "src/screens/MarketScreen.jsx",
  "src/screens/money/PaymentMethodsScreen.jsx",
  "src/screens/money/ScanQrScreen.jsx",
  "src/screens/money/SendScreen.jsx",
  "src/screens/money/TradeFlowScreen.jsx",
  "src/screens/ProfileScreen.jsx",
  "src/screens/settings/CurrencyScreen.jsx",
  "src/screens/settings/SettingsScreen.jsx",
  "src/screens/social/CommunitiesScreen.jsx",
  "src/screens/social/CommunityScreen.jsx",
  "src/screens/social/FeedScreen.jsx",
  "src/screens/social/PostCard.jsx",
  "src/screens/social/PostDetailScreen.jsx",
  "src/screens/SwapScreen.jsx",
  "src/screens/TransactionDetailScreen.jsx",
  "src/screens/WatchlistScreen.jsx",
  "src/ui/kit.jsx",
  "src/ui/SyncStatus.jsx",
  "src/ui/ToastHost.jsx",
];

const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*"@expo\/vector-icons";/;

let changed = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, "utf8");
  const m = src.match(IMPORT_RE);
  if (!m) {
    console.log(`SKIP (no matching import): ${rel}`);
    continue;
  }
  const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  if (!names.includes("Feather")) {
    console.log(`SKIP (no Feather): ${rel}`);
    continue;
  }
  const rest = names.filter((n) => n !== "Feather");

  const relImportPath = path
    .relative(path.dirname(abs), COMPAT_FILE)
    .replace(/\\/g, "/")
    .replace(/\.jsx$/, "");
  const compatSpecifier = relImportPath.startsWith(".") ? relImportPath : `./${relImportPath}`;

  const restLine = rest.length ? `import { ${rest.join(", ")} } from "@expo/vector-icons";\n` : "";
  const replacement = `${restLine}import { Feather } from "${compatSpecifier}";`;

  const next = src.replace(IMPORT_RE, replacement);
  fs.writeFileSync(abs, next);
  changed++;
  console.log(`OK: ${rel}  ->  ${compatSpecifier}`);
}

console.log(`\nDone. ${changed} files updated.`);
