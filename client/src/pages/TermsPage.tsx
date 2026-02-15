import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, AlertTriangle, Scale, Ban, Phone, MessageCircle, ExternalLink, ShieldCheck, Globe } from "lucide-react";
import { motion } from "framer-motion";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const termsSections = [
  {
    icon: AlertTriangle,
    title: "Entertainment Disclaimer",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    content: [
      "THE VOID is designed purely for entertainment purposes. All AI-generated responses are fictional and created by artificial intelligence algorithms.",
      "The AI personalities (Smart-ass, Calming, Therapist, Hype Man) are characters and do NOT provide real therapy, counseling, medical advice, or professional guidance of any kind.",
      "No licensed professional has reviewed or approved the AI-generated content. Users must not rely on any response as professional advice.",
    ],
  },
  {
    icon: Scale,
    title: "Limitation of Liability",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    content: [
      "DarkWave Studios, its affiliates, Trust Layer (dwtl.io), and TrustShield.tech shall not be held liable for any damages, losses, or consequences arising from the use of THE VOID.",
      "We are not responsible for any decisions, actions, or inactions taken based on AI-generated content.",
      "Use of the application is entirely at your own risk. We make no warranties, express or implied, regarding the accuracy, completeness, or usefulness of AI responses.",
    ],
  },
  {
    icon: Ban,
    title: "Prohibited Use",
    color: "text-red-400",
    bg: "bg-red-500/10",
    content: [
      "Users must not use THE VOID as a replacement for professional mental health services, emergency services, or crisis intervention.",
      "Users must not use the application for any illegal, harmful, or abusive purpose.",
      "Users must be at least 18 years of age to use THE VOID.",
      "Users must not attempt to reverse-engineer, exploit, or attack the application infrastructure.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Data & Privacy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    content: [
      "By using THE VOID, you consent to the collection and processing of audio data as described in our Privacy Policy.",
      "Audio recordings are processed via third-party AI services (OpenAI) and are subject to their data handling policies.",
      "We implement security measures through TrustShield.tech but cannot guarantee absolute security of data transmission.",
    ],
  },
  {
    icon: Globe,
    title: "Intellectual Property",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    content: [
      "THE VOID, its design, branding, and all associated content are the intellectual property of DarkWave Studios (DarkwaveStudios.io).",
      "Trust Layer and TrustShield.tech are proprietary technologies. Unauthorized use is prohibited.",
      "User-generated content (voice recordings, transcripts) remains the property of the user.",
    ],
  },
  {
    icon: FileText,
    title: "Changes & Governing Law",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    content: [
      "We reserve the right to modify these Terms at any time. Continued use constitutes acceptance of updated terms.",
      "These Terms shall be governed by and construed in accordance with applicable laws.",
      "Any disputes shall be resolved through binding arbitration where permitted by law.",
    ],
  },
];

export default function TermsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Scale className="w-3 h-3" />
              Legal
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: February 15, 2026 &middot; DarkWave Studios</p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 border-yellow-500/20 bg-yellow-950/10" hoverEffect>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">By Using THE VOID, You Agree</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    By accessing or using THE VOID, you acknowledge that you have read, understood, and agree
                    to be bound by these Terms of Service. If you do not agree, you must discontinue use
                    immediately. THE VOID is operated by DarkWave Studios (DarkwaveStudios.io), powered by
                    Trust Layer (dwtl.io), and protected by TrustShield.tech.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {termsSections.map((section) => (
              <motion.div key={section.title} variants={fadeUp}>
                <GlassCard className="p-6 h-full" hoverEffect>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${section.bg}`}>
                      <section.icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <ul className="space-y-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0 mt-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 md:p-8 border-red-500/20 bg-red-950/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-red-500/20">
                  <Phone className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-200 font-display">Need Real Help?</h2>
                  <p className="text-xs text-red-300/60">Free, confidential crisis support &ndash; 24/7</p>
                </div>
              </div>
              <p className="text-sm text-red-200/80 mb-5">
                THE VOID is not a crisis resource. If you are experiencing a mental health emergency
                or are in danger, please contact one of these services immediately:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: Phone, name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 (US) \u2014 24/7" },
                  { icon: MessageCircle, name: "Crisis Text Line", detail: "Text HELLO to 741741" },
                  { icon: Phone, name: "SAMHSA Helpline", detail: "1-800-662-4357 \u2014 Free, 24/7" },
                  { icon: MessageCircle, name: "IMAlive Chat", detail: "imalive.org", link: "https://www.imalive.org" },
                  { icon: Phone, name: "Veterans Crisis Line", detail: "Call 988, press 1 or text 838255" },
                  { icon: Phone, name: "Trevor Project (LGBTQ+)", detail: "1-866-488-7386 or text START to 678-678" },
                  { icon: Phone, name: "Childhelp Hotline", detail: "1-800-422-4453 \u2014 24/7" },
                  { icon: MessageCircle, name: "NAMI Helpline", detail: "1-800-950-6264 or text HelpLine to 62640" },
                ].map((r) => (
                  <div key={r.name} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/10">
                    <r.icon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-200">{r.name}</p>
                      <p className="text-xs text-red-300/60 mt-0.5">
                        {r.link ? (
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 inline-flex items-center gap-0.5">
                            {r.detail} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : r.detail}
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
