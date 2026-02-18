import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { GlassCard } from "@/components/ui/GlassCard";
import { Mail, Send, MessageSquare, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import contactFormImg from "@/assets/images/contact-form.png";
import contactEmailImg from "@/assets/images/contact-email.png";
import contactSupportImg from "@/assets/images/contact-support.png";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ContactPage() {
  useDocumentTitle("Contact Us");
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await apiRequest("POST", "/api/contact", form);
      setSent(true);
      toast({ title: "Message sent", description: "We'll get back to you as soon as possible." });
    } catch {
      toast({ title: "Error", description: "Could not send your message. Please email us directly at team@dwsc.io", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Layout>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Contact Us</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-2">Get in Touch</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Questions, feedback, or just want to say hi — we'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <motion.div variants={fadeUp}>
              <GlassCard className="overflow-hidden" hoverEffect>
                <div className="relative h-32 overflow-hidden">
                  <img src={contactFormImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Send a Message</h3>
                  </div>
                </div>
                <div className="p-5">
                  {sent ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                        <Send className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Message Sent</h2>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Thanks for reaching out. We typically respond within 24-48 hours.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "general", message: "" }); }}
                        data-testid="button-send-another"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs text-muted-foreground">Name *</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            className="bg-white/5 border-white/10"
                            data-testid="input-contact-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-xs text-muted-foreground">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            className="bg-white/5 border-white/10"
                            data-testid="input-contact-email"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
                        <Select value={form.subject} onValueChange={(v) => update("subject", v)}>
                          <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-contact-subject">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="billing">Billing / Subscription</SelectItem>
                            <SelectItem value="privacy">Privacy / Data Request</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-xs text-muted-foreground">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="How can we help?"
                          value={form.message}
                          onChange={(e) => update("message", e.target.value)}
                          rows={5}
                          className="bg-white/5 border-white/10 resize-none"
                          data-testid="input-contact-message"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={sending}
                        className="w-full"
                        data-testid="button-send-contact"
                      >
                        {sending ? "Sending..." : "Send Message"}
                        {!sending && <Send className="w-4 h-4 ml-2" />}
                      </Button>
                    </form>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <motion.div variants={fadeUp}>
              <GlassCard className="overflow-hidden" hoverEffect>
                <div className="relative h-24 overflow-hidden">
                  <img src={contactEmailImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Direct Email</h3>
                  </div>
                </div>
                <div className="p-5">
                  <a
                    href="mailto:team@dwsc.io"
                    className="flex items-center gap-3 group"
                    data-testid="link-contact-email"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">team@dwsc.io</p>
                      <p className="text-[10px] text-muted-foreground">For all inquiries</p>
                    </div>
                  </a>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard className="overflow-hidden" hoverEffect>
                <div className="relative h-24 overflow-hidden">
                  <img src={contactSupportImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 backdrop-blur-sm">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">What to Expect</h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">We typically respond within 24-48 hours.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">Bug reports and billing issues are prioritized.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">Privacy and data requests are handled in accordance with our Privacy Policy.</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeUp}>
              <GlassCard className="overflow-hidden">
                <div className="p-5">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    DarkWave Studios is committed to providing a safe, supportive platform.
                    If you are in crisis, please reach out to the{" "}
                    <span className="text-foreground font-medium">988 Suicide & Crisis Lifeline</span>{" "}
                    (call or text 988) or the{" "}
                    <span className="text-foreground font-medium">Crisis Text Line</span>{" "}
                    (text HOME to 741741).
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
