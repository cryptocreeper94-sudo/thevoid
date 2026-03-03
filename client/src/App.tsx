import { useState, useCallback, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PinGate } from "@/components/PinGate";
import { SplashScreen } from "@/components/SplashScreen";
import { useAppModeProvider } from "@/hooks/use-app-mode";
import NotFound from "@/pages/not-found";

const RecordPage = lazy(() => import("@/pages/RecordPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const DeveloperPage = lazy(() => import("@/pages/DeveloperPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ConversationsPage = lazy(() => import("@/pages/ConversationsPage"));
const SignalChatPage = lazy(() => import("@/pages/SignalChatPage"));
const MissionPage = lazy(() => import("@/pages/MissionPage"));
const GamificationPage = lazy(() => import("@/pages/GamificationPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const ZenZonePage = lazy(() => import("@/pages/ZenZonePage"));
const CrisisToolkitPage = lazy(() => import("@/pages/CrisisToolkitPage"));
const SleepSoundsPage = lazy(() => import("@/pages/SleepSoundsPage"));
const JournalPage = lazy(() => import("@/pages/JournalPage"));
const MoodAnalyticsPage = lazy(() => import("@/pages/MoodAnalyticsPage"));
const VentLibraryPage = lazy(() => import("@/pages/VentLibraryPage"));
const AffirmationsPage = lazy(() => import("@/pages/AffirmationsPage"));
const RageRoomPage = lazy(() => import("@/pages/RageRoomPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const VoiceJournalPage = lazy(() => import("@/pages/VoiceJournalPage"));
const VoiceFingerprintPage = lazy(() => import("@/pages/VoiceFingerprintPage"));
const MoodPortraitPage = lazy(() => import("@/pages/MoodPortraitPage"));
const VoidEchoPage = lazy(() => import("@/pages/VoidEchoPage"));
const TrustVaultLibraryPage = lazy(() => import("@/pages/TrustVaultLibraryPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const EcosystemPage = lazy(() => import("@/pages/EcosystemPage"));
const AffiliateDashboardPage = lazy(() => import("@/pages/AffiliateDashboardPage"));
const ReferralLandingPage = lazy(() => import("@/pages/ReferralLandingPage"));

function LazyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoutes() {
  return (
    <PinGate>
      <Switch>
        <Route path="/home" component={RecordPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/conversations" component={ConversationsPage} />
        <Route path="/progress" component={GamificationPage} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/voice-journal" component={VoiceJournalPage} />
        <Route path="/mood-analytics" component={MoodAnalyticsPage} />
        <Route path="/vent-library" component={VentLibraryPage} />
        <Route path="/affirmations" component={AffirmationsPage} />
        <Route path="/rage-room" component={RageRoomPage} />
        <Route path="/voice-fingerprint" component={VoiceFingerprintPage} />
        <Route path="/mood-portrait" component={MoodPortraitPage} />
        <Route path="/void-echo" component={VoidEchoPage} />
        <Route path="/vault" component={TrustVaultLibraryPage} />
        <Route path="/affiliate" component={AffiliateDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    </PinGate>
  );
}

function Router() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/developer" component={DeveloperPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/signal" component={SignalChatPage} />
        <Route path="/mission" component={MissionPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/zen" component={ZenZonePage} />
        <Route path="/crisis" component={CrisisToolkitPage} />
        <Route path="/sleep-sounds" component={SleepSoundsPage} />
        <Route path="/ecosystem" component={EcosystemPage} />
        <Route path="/ref/:hash" component={ReferralLandingPage} />
        <Route>
          <ProtectedRoutes />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  const { mode, setMode, toggle, isPlayMode, Provider } = useAppModeProvider();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Provider value={{ mode, setMode, toggle, isPlayMode }}>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Router />
          <Toaster />
        </Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
