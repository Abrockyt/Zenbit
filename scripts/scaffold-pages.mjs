// One-shot scaffolder: creates a placeholder for every page in the app flow
// diagram that doesn't exist yet, so App.jsx can import the full route table
// while the real screens are still being written. Never overwrites a real file.
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "..", "src", "pages");

const pages = [
  // auth / onboarding
  "Login", "Terms", "RestoreWallet", "AppLock",
  // kyc
  "kyc/KycIntro", "kyc/KycDocuments", "kyc/KycStatus",
  // money movement
  "money/Send", "money/ScanQr", "money/Receive", "money/Buy", "money/Sell", "money/PaymentMethods",
  // social
  "social/Feed", "social/Compose", "social/PostDetail", "social/UserProfile", "social/FollowList",
  // chat
  "chat/Threads", "chat/Conversation",
  // card
  "CardDetail",
  // activity
  "TransactionDetail",
  // settings
  "settings/Settings", "settings/Security", "settings/Privacy", "settings/Notifications",
  "settings/BlockedAccounts", "settings/Reports", "settings/Currency", "settings/PriceAlerts",
];

let made = 0;
for (const p of pages) {
  const file = join(root, `${p}.jsx`);
  if (existsSync(file)) continue;
  mkdirSync(dirname(file), { recursive: true });
  const name = p.split("/").pop();
  writeFileSync(
    file,
    `// Placeholder — real screen pending.
export default function ${name}() {
  return null;
}
`,
    "utf8"
  );
  made++;
}
console.log(`scaffolded ${made} placeholder page(s)`);
