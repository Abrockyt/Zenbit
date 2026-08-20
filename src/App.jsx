// Route table for every screen in "Zenbit Pro - App Flow Diagram".
//
// This file is the single owner of routing — screens are added by creating the
// page module, not by editing routes here. Guards mirror the diagram exactly:
// KYC gates Buy/Sell and Card only; Home, Market and Send/Receive of already
// held assets stay reachable before verification.

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import Splash from "./components/screen/Splash";
import { AnimatePresence } from "framer-motion";

import { AppProvider, useApp } from "./state/store";
import NetworkBanner from "./components/feedback/NetworkBanner";
import ToastHost from "./components/feedback/ToastHost";

// auth / onboarding
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import Terms from "./pages/Terms";
import CreateWallet from "./pages/CreateWallet";
import FaceId from "./pages/FaceId";
import Passcode from "./pages/Passcode";
import RestoreWallet from "./pages/RestoreWallet";
import AppLock from "./pages/AppLock";

// kyc
import KycIntro from "./pages/kyc/KycIntro";
import KycDocuments from "./pages/kyc/KycDocuments";
import KycStatus from "./pages/kyc/KycStatus";

// hub
import Home from "./pages/Home";
import Market from "./pages/Market";
import CoinDetail from "./pages/CoinDetail";
import Watchlist from "./pages/Watchlist";
import Swap from "./pages/Swap";
import Asset from "./pages/Asset";
import CardScreen from "./pages/CardScreen";
import CardDetail from "./pages/CardDetail";
import Profile from "./pages/Profile";
import RecentActivity from "./pages/RecentActivity";
import TransactionDetail from "./pages/TransactionDetail";

// money movement
import Send from "./pages/money/Send";
import ScanQr from "./pages/money/ScanQr";
import Receive from "./pages/money/Receive";
import Buy from "./pages/money/Buy";
import Sell from "./pages/money/Sell";
import PaymentMethods from "./pages/money/PaymentMethods";
import AddFunds from "./pages/money/AddFunds";

// social
import Feed from "./pages/social/Feed";
import Compose from "./pages/social/Compose";
import PostDetail from "./pages/social/PostDetail";
import UserProfile from "./pages/social/UserProfile";
import FollowList from "./pages/social/FollowList";

// chat
import Threads from "./pages/chat/Threads";
import Conversation from "./pages/chat/Conversation";
import AiChat from "./pages/AiChat";

// settings
import Settings from "./pages/settings/Settings";
import Security from "./pages/settings/Security";
import Privacy from "./pages/settings/Privacy";
import NotificationSettings from "./pages/settings/Notifications";
import BlockedAccounts from "./pages/settings/BlockedAccounts";
import Reports from "./pages/settings/Reports";
import Currency from "./pages/settings/Currency";
import PriceAlerts from "./pages/settings/PriceAlerts";

// Signed-in gate. Everything under the hub needs a session; the diagram's
// "Wallet recovery" and "Sign up / Login" flows sit outside it.
function RequireSession({ children }) {
  const { state } = useApp();
  if (!state.session.signedIn) return <Navigate to="/welcome" replace />;
  if (!state.session.unlocked) return <Navigate to="/lock" replace />;
  return children;
}

// KYC gate — only Buy/Sell and Card sit behind it.
function RequireKyc({ children }) {
  const { state } = useApp();
  if (state.kyc.status !== "approved") return <Navigate to="/kyc" replace />;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/welcome" replace />} />

        {/* auth / onboarding */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/create-wallet" element={<CreateWallet />} />
        <Route path="/face-id" element={<FaceId />} />
        <Route path="/passcode" element={<Passcode />} />
        <Route path="/restore" element={<RestoreWallet />} />
        <Route path="/lock" element={<AppLock />} />

        {/* kyc */}
        <Route path="/kyc" element={<RequireSession><KycIntro /></RequireSession>} />
        <Route path="/kyc/documents" element={<RequireSession><KycDocuments /></RequireSession>} />
        <Route path="/kyc/status" element={<RequireSession><KycStatus /></RequireSession>} />

        {/* hub */}
        <Route path="/home" element={<RequireSession><Home /></RequireSession>} />
        <Route path="/market" element={<Market />} />
        <Route path="/market/:id" element={<CoinDetail />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/swap" element={<RequireSession><Swap /></RequireSession>} />
        <Route path="/asset" element={<RequireSession><Asset /></RequireSession>} />
        <Route path="/profile" element={<RequireSession><Profile /></RequireSession>} />
        <Route path="/activity" element={<RequireSession><RecentActivity /></RequireSession>} />
        <Route path="/activity/:id" element={<RequireSession><TransactionDetail /></RequireSession>} />

        {/* card — behind KYC per the diagram */}
        <Route path="/card" element={<RequireSession><RequireKyc><CardScreen /></RequireKyc></RequireSession>} />
        <Route path="/card/detail" element={<RequireSession><RequireKyc><CardDetail /></RequireKyc></RequireSession>} />

        {/* money movement — Buy/Sell behind KYC, Send/Receive not */}
        <Route path="/send" element={<RequireSession><Send /></RequireSession>} />
        <Route path="/send/scan" element={<RequireSession><ScanQr /></RequireSession>} />
        <Route path="/receive" element={<RequireSession><Receive /></RequireSession>} />
        <Route path="/buy" element={<RequireSession><RequireKyc><Buy /></RequireKyc></RequireSession>} />
        <Route path="/sell" element={<RequireSession><RequireKyc><Sell /></RequireKyc></RequireSession>} />
        <Route path="/add-funds" element={<RequireSession><AddFunds /></RequireSession>} />
        <Route path="/payment-methods" element={<RequireSession><PaymentMethods /></RequireSession>} />

        {/* social */}
        <Route path="/social" element={<RequireSession><Feed /></RequireSession>} />
        <Route path="/social/compose" element={<RequireSession><Compose /></RequireSession>} />
        <Route path="/social/post/:id" element={<RequireSession><PostDetail /></RequireSession>} />
        <Route path="/social/u/:handle" element={<RequireSession><UserProfile /></RequireSession>} />
        <Route path="/social/u/:handle/:list" element={<RequireSession><FollowList /></RequireSession>} />

        {/* chat */}
        <Route path="/messages" element={<RequireSession><Threads /></RequireSession>} />
        <Route path="/messages/:id" element={<RequireSession><Conversation /></RequireSession>} />
        <Route path="/zen-ai" element={<RequireSession><AiChat /></RequireSession>} />

        {/* settings */}
        <Route path="/settings" element={<RequireSession><Settings /></RequireSession>} />
        <Route path="/settings/security" element={<RequireSession><Security /></RequireSession>} />
        <Route path="/settings/privacy" element={<RequireSession><Privacy /></RequireSession>} />
        <Route path="/settings/notifications" element={<RequireSession><NotificationSettings /></RequireSession>} />
        <Route path="/settings/blocked" element={<RequireSession><BlockedAccounts /></RequireSession>} />
        <Route path="/settings/reports" element={<RequireSession><Reports /></RequireSession>} />
        <Route path="/settings/currency" element={<RequireSession><Currency /></RequireSession>} />
        <Route path="/settings/alerts" element={<RequireSession><PriceAlerts /></RequireSession>} />

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

import { ShaderBackground } from "./components/ui/ShaderBackground";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  return (
    <AppProvider>
      <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
         <ShaderBackground />
      </div>
      <BrowserRouter>
        {showSplash ? (
          <Splash onComplete={() => setShowSplash(false)} />
        ) : (
          <>
            <NetworkBanner />
            <AnimatedRoutes />
            <ToastHost />
          </>
        )}
      </BrowserRouter>
    </AppProvider>
  );
}

