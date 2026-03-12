import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'THE VOID <noreply@dwsc.io>';

function getResendClient() {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY must be set in environment variables');
  }
  return {
    client: new Resend(RESEND_API_KEY),
    fromEmail: FROM_EMAIL,
  };
}

function generateVoidId(): string {
  const chars = '0123456789';
  let id = 'V-';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function buildSubscriptionEmailHtml(params: {
  userName: string;
  voidId: string;
  subscriptionId: string;
  planName: string;
  price: string;
  appUrl: string;
}): string {
  const { userName, voidId, subscriptionId, planName, price, appUrl } = params;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to THE VOID Premium</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,rgba(139,92,246,0.3),rgba(59,130,246,0.2));border:1px solid rgba(139,92,246,0.3);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
              <div style="font-size:32px;font-weight:800;letter-spacing:6px;color:#ffffff;margin-bottom:8px;">THE VOID</div>
              <div style="font-size:12px;letter-spacing:3px;color:rgba(167,139,250,0.8);text-transform:uppercase;">by DarkWave Studios</div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background:rgba(15,15,25,0.95);border-left:1px solid rgba(139,92,246,0.15);border-right:1px solid rgba(139,92,246,0.15);padding:40px 32px;">

              <!-- Welcome -->
              <div style="font-size:24px;font-weight:700;color:#ffffff;margin-bottom:8px;">Welcome to Premium, ${userName}</div>
              <div style="font-size:15px;color:rgba(255,255,255,0.6);margin-bottom:32px;line-height:1.6;">Your subscription is confirmed. You now have unlimited access to THE VOID.</div>

              <!-- Subscription Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-size:13px;letter-spacing:2px;color:rgba(167,139,250,0.7);text-transform:uppercase;margin-bottom:16px;">Subscription Details</div>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:14px;">Plan</td>
                        <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:right;font-weight:600;">${planName}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid rgba(139,92,246,0.1);color:rgba(255,255,255,0.5);font-size:14px;">Price</td>
                        <td style="padding:8px 0;border-top:1px solid rgba(139,92,246,0.1);color:#ffffff;font-size:14px;text-align:right;font-weight:600;">${price}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid rgba(139,92,246,0.1);color:rgba(255,255,255,0.5);font-size:14px;">Subscription ID</td>
                        <td style="padding:8px 0;border-top:1px solid rgba(139,92,246,0.1);color:rgba(167,139,250,0.9);font-size:13px;text-align:right;font-family:monospace;">${subscriptionId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Void ID Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.12));border:1px solid rgba(59,130,246,0.25);border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:11px;letter-spacing:3px;color:rgba(96,165,250,0.7);text-transform:uppercase;margin-bottom:12px;">Your Void ID</div>
                    <div style="font-size:28px;font-weight:800;letter-spacing:4px;color:#60a5fa;font-family:monospace;">${voidId}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:12px;line-height:1.5;">This is your unique member identifier.<br>Secured by Trust Layer blockchain verification.</div>
                  </td>
                </tr>
              </table>

              <!-- What You Get -->
              <div style="font-size:16px;font-weight:600;color:#ffffff;margin-bottom:16px;">What You Get</div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:28px;color:#a78bfa;font-size:16px;">&#10003;</td>
                  <td style="padding:10px 0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.5;"><strong style="color:#fff;">Unlimited Venting</strong> &mdash; No daily limits, vent as much as you need</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:28px;color:#a78bfa;font-size:16px;">&#10003;</td>
                  <td style="padding:10px 0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.5;"><strong style="color:#fff;">All AI Personalities</strong> &mdash; Smart-ass, Calming, Therapist, Hype Man, Roast Master</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:28px;color:#a78bfa;font-size:16px;">&#10003;</td>
                  <td style="padding:10px 0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.5;"><strong style="color:#fff;">Voice Responses</strong> &mdash; AI speaks back with personality-specific voices</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:28px;color:#a78bfa;font-size:16px;">&#10003;</td>
                  <td style="padding:10px 0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.5;"><strong style="color:#fff;">Trust Layer Verified</strong> &mdash; Blockchain-backed membership via dwtl.io</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:32px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:1px;">START VENTING</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security & Trust -->
          <tr>
            <td style="background:rgba(10,10,18,0.95);border-left:1px solid rgba(139,92,246,0.15);border-right:1px solid rgba(139,92,246,0.15);padding:24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:12px;">Secured & Verified By</div>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td style="padding:0 16px;text-align:center;">
                          <a href="https://trustshield.tech" style="color:#60a5fa;text-decoration:none;font-size:13px;font-weight:600;">TrustShield.tech</a>
                          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;">Security</div>
                        </td>
                        <td style="width:1px;background:rgba(139,92,246,0.2);"></td>
                        <td style="padding:0 16px;text-align:center;">
                          <a href="https://dwtl.io" style="color:#a78bfa;text-decoration:none;font-size:13px;font-weight:600;">dwtl.io</a>
                          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;">Trust Layer</div>
                        </td>
                        <td style="width:1px;background:rgba(139,92,246,0.2);"></td>
                        <td style="padding:0 16px;text-align:center;">
                          <a href="https://darkwavestudios.io" style="color:#c084fc;text-decoration:none;font-size:13px;font-weight:600;">DarkWave Studios</a>
                          <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;">Developer</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Page Links -->
          <tr>
            <td style="background:rgba(10,10,18,0.95);border-left:1px solid rgba(139,92,246,0.15);border-right:1px solid rgba(139,92,246,0.15);padding:16px 32px;text-align:center;">
              <a href="${appUrl}/privacy" style="color:rgba(167,139,250,0.7);text-decoration:none;font-size:12px;margin:0 12px;">Privacy Policy</a>
              <a href="${appUrl}/terms" style="color:rgba(167,139,250,0.7);text-decoration:none;font-size:12px;margin:0 12px;">Terms of Service</a>
              <a href="${appUrl}/contact" style="color:rgba(167,139,250,0.7);text-decoration:none;font-size:12px;margin:0 12px;">Contact Us</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(8,8,15,0.95);border:1px solid rgba(139,92,246,0.1);border-top:none;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
              <div style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;">
                &copy; ${year} DarkwaveStudios.io &mdash; All rights reserved.<br>
                Powered by Trust Layer &bull; Protected by TrustShield.tech<br>
                <span style="color:rgba(255,255,255,0.15);">team@dwsc.io</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendSubscriptionConfirmationEmail(params: {
  toEmail: string;
  userName: string;
  voidId: string;
  subscriptionId: string;
  appUrl: string;
}): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    const html = buildSubscriptionEmailHtml({
      userName: params.userName,
      voidId: params.voidId,
      subscriptionId: params.subscriptionId,
      planName: "THE VOID — Premium",
      price: "$9.99/month",
      appUrl: params.appUrl,
    });

    const result = await client.emails.send({
      from: fromEmail || "THE VOID <noreply@dwsc.io>",
      to: params.toEmail,
      subject: `Welcome to THE VOID Premium — Your Void ID: ${params.voidId}`,
      html,
    });

    console.log(`[Email] Subscription confirmation sent to ${params.toEmail}`, result);
    return true;
  } catch (err: any) {
    console.error("[Email] Failed to send subscription confirmation:", err?.message);
    return false;
  }
}

export { generateVoidId };
