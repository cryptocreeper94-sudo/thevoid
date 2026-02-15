import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Phone, MessageCircle, ExternalLink } from "lucide-react";

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <GlassCard className="p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-display">Privacy Policy</h1>
          </div>
          <p className="text-xs text-muted-foreground mb-8">Last updated: February 15, 2026</p>

          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Overview</h2>
              <p>
                THE VOID ("we," "us," or "our"), operated by DarkWave Studios (DarkwaveStudios.io), 
                is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, and safeguard your information when you use our application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-foreground">Audio Recordings:</strong> When you use the voice recording feature, your audio is temporarily processed to generate a text transcript. Audio data is not permanently stored on our servers unless you explicitly opt in to saving your vent history.</li>
                <li><strong className="text-foreground">Transcripts & Responses:</strong> Text transcripts of your recordings and the AI-generated responses may be stored to provide you with a history of your sessions.</li>
                <li><strong className="text-foreground">Usage Data:</strong> We may collect anonymous usage analytics such as feature usage frequency and session duration to improve the application.</li>
                <li><strong className="text-foreground">Account Information:</strong> If you create an account, we collect basic profile information provided through the authentication service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>To process your voice recordings and generate AI responses</li>
                <li>To maintain your vent history (if you opt in)</li>
                <li>To improve the quality and accuracy of our AI personalities</li>
                <li>To maintain and improve the application</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Third-Party Services</h2>
              <p>
                We use OpenAI's API for speech-to-text transcription and AI response generation. 
                Your audio and text data is transmitted to OpenAI for processing. Please review 
                <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">
                  OpenAI's Privacy Policy <ExternalLink className="w-2.5 h-2.5" />
                </a> for information on how they handle data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
              <p>
                Your data is protected by TrustShield.tech security infrastructure. We implement 
                industry-standard encryption and security measures to protect your information. 
                However, no method of electronic transmission or storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Retention & Deletion</h2>
              <p>
                Audio recordings are processed in real-time and are not permanently stored unless 
                you opt in. You may request deletion of your data at any time by contacting us. 
                Transcripts and AI responses in your vent history can be deleted through the application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Children's Privacy</h2>
              <p>
                THE VOID is not intended for use by individuals under the age of 18. We do not 
                knowingly collect personal information from children. If we learn that we have 
                collected data from a minor, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of any 
                material changes by updating the "Last updated" date at the top of this page.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Contact Us</h2>
              <p>
                For questions about this Privacy Policy or your data, please contact us at 
                DarkwaveStudios.io.
              </p>
              <p className="mt-2">
                Powered by Trust Layer &ndash; dwtl.io
              </p>
            </section>

            <div className="mt-10 p-5 rounded-xl bg-red-500/10 border border-red-500/20">
              <h2 className="text-lg font-semibold text-red-200 mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Important Disclaimer &ndash; Crisis Resources
              </h2>
              <p className="text-red-200/80 mb-4">
                THE VOID is an <strong>entertainment product only</strong>. It is NOT a substitute for 
                professional mental health care, therapy, counseling, or crisis intervention. 
                The AI-generated responses are for entertainment purposes and should not be 
                considered medical, psychological, or professional advice of any kind.
              </p>
              <p className="text-red-200/80 font-medium mb-3">
                If you or someone you know is struggling or in crisis, please reach out to these free, 
                confidential resources available 24/7:
              </p>
              <ul className="space-y-3 text-red-200/80">
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-red-200">988 Suicide & Crisis Lifeline:</strong> Call or text <strong>988</strong> (US) &ndash; Available 24/7
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-red-200">Crisis Text Line:</strong> Text <strong>HELLO</strong> to <strong>741741</strong> (US, UK, Canada)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-red-200">SAMHSA National Helpline:</strong> <strong>1-800-662-4357</strong> &ndash; Free, confidential, 24/7 treatment referral
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-red-200">IMAlive Online Crisis Chat:</strong>{" "}
                    <a href="https://www.imalive.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 inline-flex items-center gap-0.5">
                      imalive.org <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-red-200">Veterans Crisis Line:</strong> Call <strong>988</strong> then press <strong>1</strong>, or text <strong>838255</strong>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-red-200">Trevor Project (LGBTQ+):</strong> Call <strong>1-866-488-7386</strong> or text <strong>START</strong> to <strong>678-678</strong>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
