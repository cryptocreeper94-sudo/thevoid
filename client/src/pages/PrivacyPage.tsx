import { useState, useRef } from "react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Phone, MessageCircle, ExternalLink, Lock, Eye, Trash2, UserX, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useMeta } from "@/hooks/use-meta";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import collectionImg from "@/assets/images/privacy-collection.webp";
import usageImg from "@/assets/images/privacy-usage.webp";
import securityImg from "@/assets/images/privacy-security.webp";
import retentionImg from "@/assets/images/privacy-retention.webp";
import childrenImg from "@/assets/images/privacy-children.webp";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const sections = [
  {
    icon: Eye,
    title: "Information We Collect",
    img: collectionImg,
    items: [
      { label: "Audio Recordings", text: "Temporarily processed for transcription. Not permanently stored unless you opt in to saving vent history." },
      { label: "Transcripts & Responses", text: "Text transcripts and AI-generated responses may be stored to provide session history." },
      { label: "Usage Data", text: "Anonymous analytics such as feature usage and session duration to improve the app." },
      { label: "Account Information", text: "Basic profile information provided through authentication, if you create an account." },
    ],
  },
  {
    icon: Lock,
    title: "How We Use Your Information",
    img: usageImg,
    items: [
      { label: "Voice Processing", text: "To process recordings and generate AI personality responses." },
      { label: "History", text: "To maintain your vent history if you opt in." },
      { label: "Improvements", text: "To improve AI quality and application performance." },
    ],
  },
  {
    icon: Shield,
    title: "Third-Party Services & Security",
    img: securityImg,
    items: [
      { label: "OpenAI", text: "Audio and text data is transmitted to OpenAI for speech-to-text and AI response generation." },
      { label: "TrustShield.tech", text: "Industry-standard encryption and security measures protect your data." },
      { label: "Trust Layer", text: "Infrastructure powered by Trust Layer (dwtl.io) for secure data handling." },
    ],
  },
  {
    icon: Trash2,
    title: "Data Retention & Deletion",
    img: retentionImg,
    items: [
      { label: "Audio", text: "Processed in real-time and not permanently stored unless you opt in." },
      { label: "Your Rights", text: "Request deletion of your data at any time. Transcripts can be deleted through the app." },
    ],
  },
  {
    icon: UserX,
    title: "Children's Privacy",
    img: childrenImg,
    items: [
      { label: "Age Restriction", text: "THE VOID is not intended for individuals under 18. We do not knowingly collect data from minors." },
    ],
  },
];

const crisisResources = [
  { icon: Phone, name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 (US) \u2014 Available 24/7", highlight: "988" },
  { icon: MessageCircle, name: "Crisis Text Line", detail: "Text HELLO to 741741 (US, UK, Canada)", highlight: "741741" },
  { icon: Phone, name: "SAMHSA National Helpline", detail: "1-800-662-4357 \u2014 Free, confidential, 24/7 treatment referral", highlight: "1-800-662-4357" },
  { icon: MessageCircle, name: "IMAlive Online Crisis Chat", detail: "imalive.org \u2014 Online chat support", highlight: "imalive.org", link: "https://www.imalive.org" },
  { icon: Phone, name: "Veterans Crisis Line", detail: "Call 988 then press 1, or text 838255", highlight: "838255" },
  { icon: Phone, name: "Trevor Project (LGBTQ+)", detail: "Call 1-866-488-7386 or text START to 678-678", highlight: "1-866-488-7386" },
  { icon: Phone, name: "Childhelp National Child Abuse Hotline", detail: "1-800-422-4453 \u2014 24/7 crisis support", highlight: "1-800-422-4453" },
  { icon: MessageCircle, name: "NAMI Helpline", detail: "Call 1-800-950-6264 or text HelpLine to 62640", highlight: "1-800-950-6264" },
];

export default function PrivacyPage() {
  useDocumentTitle("Privacy Policy");
  useMeta({ description: "How THE VOID collects, uses, and safeguards your information. Privacy policy by DarkWave Studios.", ogTitle: "Privacy Policy — THE VOID", ogDescription: "Your privacy matters. Learn how we protect your data.", canonicalPath: "/privacy" });
  const [sIdx, setSIdx] = useState(0);
  const touchRef = useRef<{ x: number } | null>(null);
  const pageSize = 2;
  const totalPages = Math.ceil(sections.length / pageSize);
  const currentSections = sections.slice(sIdx * pageSize, (sIdx + 1) * pageSize);

  const prev = () => setSIdx((i) => Math.max(0, i - 1));
  const next = () => setSIdx((i) => Math.min(totalPages - 1, i + 1));
  const onTouchStart = (e: React.TouchEvent) => { touchRef.current = { x: e.touches[0].clientX }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchRef.current = null;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Shield className="w-3 h-3" />
              Privacy & Safety
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: February 15, 2026 &middot; DarkWave Studios</p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard className="p-6" hoverEffect>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    THE VOID ("we," "us," or "our"), operated by DarkWave Studios (DarkwaveStudios.io),
                    is committed to protecting your privacy. This Privacy Policy explains how we collect,
                    use, and safeguard your information when you use our application. Our security
                    infrastructure is powered by Trust Layer (dwtl.io) and protected by TrustShield.tech.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={sIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {currentSections.map((section) => (
                    <GlassCard key={section.title} className="h-full overflow-hidden" hoverEffect>
                      <div className="relative h-32 overflow-hidden">
                        <img src={section.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <section.icon className="w-5 h-5 text-white" />
                          </div>
                          <h2 className="text-lg font-semibold text-white font-display">{section.title}</h2>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3">
                          {section.items.map((item) => (
                            <li key={item.label} className="text-sm">
                              <span className="text-foreground font-medium">{item.label}:</span>{" "}
                              <span className="text-muted-foreground">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </GlassCard>
                  ))}
                </motion.div>
              </AnimatePresence>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button size="icon" variant="ghost" onClick={prev} disabled={sIdx === 0} data-testid="button-privacy-prev"><ChevronLeft className="w-4 h-4" /></Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setSIdx(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === sIdx ? "bg-primary w-6" : "bg-white/20 hover:bg-white/40"}`} data-testid={`button-privacy-dot-${i}`} />
                    ))}
                  </div>
                  <Button size="icon" variant="ghost" onClick={next} disabled={sIdx >= totalPages - 1} data-testid="button-privacy-next"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 md:p-8 border-red-500/20 bg-red-950/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-red-500/20">
                  <Phone className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-200 font-display">Important Disclaimer</h2>
                  <p className="text-xs text-red-300/60">Crisis Resources &ndash; Available 24/7</p>
                </div>
              </div>

              <div className="mb-6 space-y-3 text-sm text-red-200/80">
                <p>
                  THE VOID is a <strong className="text-red-200">safe, cathartic entertainment product</strong> designed
                  to let you blow off steam without hurting, offending, or negatively impacting anyone or anything —
                  people, animals, or otherwise. Our AI is built with strict safety guardrails and will never
                  encourage harm of any kind. It is NOT a substitute for professional mental health care, therapy,
                  counseling, or crisis intervention. AI-generated responses are for entertainment purposes and
                  should not be considered medical, psychological, or professional advice of any kind.
                </p>
                <p className="font-medium text-red-200">
                  If you or someone you know is struggling or in crisis, please reach out immediately:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {crisisResources.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/10"
                  >
                    <r.icon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-200">{r.name}</p>
                      <p className="text-xs text-red-300/60 mt-0.5">
                        {r.link ? (
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 inline-flex items-center gap-0.5"
                            data-testid={`link-crisis-${r.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {r.detail} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          r.detail
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Powered by Trust Layer &ndash; dwtl.io &middot; Protected by TrustShield.tech &middot; DarkwaveStudios.io &copy; 2026
            </p>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
