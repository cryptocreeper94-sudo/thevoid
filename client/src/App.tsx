import { useState, useCallback } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PinGate } from "@/components/PinGate";
import { SplashScreen } from "@/components/SplashScreen";
import { useAppModeProvider } from "@/hooks/use-app-mode";
import NotFound from "@/pages/not-found";
import RecordPage from "@/pages/RecordPage";
import SettingsPage from "@/pages/SettingsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import DeveloperPage from "@/pages/DeveloperPage";
import ContactPage from "@/pages/ContactPage";
import ConversationsPage from "@/pages/ConversationsPage";
import SignalChatPage from "@/pages/SignalChatPage";
import MissionPage from "@/pages/MissionPage";
import GamificationPage from "@/pages/GamificationPage";
import BlogPage from "@/pages/BlogPage";
import ZenZonePage from "@/pages/ZenZonePage";
import CrisisToolkitPage from "@/pages/CrisisToolkitPage";
import SleepSoundsPage from "@/pages/SleepSoundsPage";
import JournalPage from "@/pages/JournalPage";
import MoodAnalyticsPage from "@/pages/MoodAnalyticsPage";
import VentLibraryPage from "@/pages/VentLibraryPage";
import AffirmationsPage from "@/pages/AffirmationsPage";
import RageRoomPage from "@/pages/RageRoomPage";
import LandingPage from "@/pages/LandingPage";
import VoiceJournalPage from "@/pages/VoiceJournalPage";
import VoiceFingerprintPage from "@/pages/VoiceFingerprintPage";
import MoodPortraitPage from "@/pages/MoodPortraitPage";
import VoidEchoPage from "@/pages/VoidEchoPage";
import OnboardingPage from "@/pages/OnboardingPage";

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
        <Route component={NotFound} />
      </Switch>
    </PinGate>
  );
}

function Router() {
  return (
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
      <Route>
        <ProtectedRoutes />
      </Route>
    </Switch>
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
