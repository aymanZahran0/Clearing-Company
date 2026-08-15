import { prisma } from "./prisma.js";

const PASSWORD_RESET_TEMPLATE_KEY = "PASSWORD_RESET";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function passwordResetEmailContent(name: string, resetUrl: string) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "إعادة تعيين كلمة المرور | Nuqaa Asir",
    text: `مرحباً ${name}\n\nاستخدم الرابط التالي لإعادة تعيين كلمة المرور خلال ساعة واحدة:\n${resetUrl}\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة.\n\nHello ${name},\n\nUse the link above to reset your password within one hour. If you did not request this, ignore this email.`,
    html: `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;background:#f3f8f7;font-family:Arial,Tahoma,sans-serif;color:#0f172a">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px">
      <div style="background:#fff;border:1px solid #dbe7e5;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 20px;color:#00466b;font-size:24px">إعادة تعيين كلمة المرور</h1>
        <p>مرحباً ${safeName}،</p>
        <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في نقاء عسير. الرابط صالح لمدة ساعة واحدة.</p>
        <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#00466b;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:bold">إعادة تعيين كلمة المرور</a></p>
        <p style="font-size:13px;color:#64748b">إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.</p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0">
        <div dir="ltr" style="text-align:left">
          <h2 style="color:#00466b;font-size:18px">Reset your password</h2>
          <p>Hello ${safeName}, use the button above to reset your password. This link expires in one hour.</p>
          <p style="font-size:13px;color:#64748b">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    </div>
  </body>
</html>`,
  };
}

function publicWebUrl() {
  return (process.env.WEB_PUBLIC_URL ?? process.env.CORS_ALLOWED_ORIGIN ?? "http://localhost:5173")
    .split(",")[0]!
    .trim()
    .replace(/\/$/, "");
}

export async function sendPasswordResetEmail(input: {
  email: string;
  fullName: string;
  rawToken: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const resetUrl = `${publicWebUrl()}/reset-password?token=${encodeURIComponent(input.rawToken)}`;
  const content = passwordResetEmailContent(input.fullName, resetUrl);
  let status: "SENT" | "FAILED" = "FAILED";
  let failureReason: string | undefined;

  try {
    if (!apiKey || !from) throw new Error("Email delivery is not configured");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? `Resend returned HTTP ${response.status}`);
    }
    status = "SENT";
  } catch (error) {
    failureReason = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
  }

  try {
    await prisma.notificationTemplate.upsert({
      where: { key: PASSWORD_RESET_TEMPLATE_KEY },
      create: {
        key: PASSWORD_RESET_TEMPLATE_KEY,
        channel: "EMAIL",
        bodyAr: "رابط إعادة تعيين كلمة المرور صالح لمدة ساعة واحدة.",
        bodyEn: "The password reset link is valid for one hour.",
      },
      update: {},
    });
    await prisma.notificationLog.create({
      data: {
        channel: "EMAIL",
        templateKey: PASSWORD_RESET_TEMPLATE_KEY,
        recipient: input.email,
        payloadSnapshot: { purpose: "password_reset", expiresInMinutes: 60 },
        status,
        failureReason,
      },
    });
  } catch {
    // Logging must not change the privacy-preserving forgot-password response.
  }

  return status === "SENT";
}
