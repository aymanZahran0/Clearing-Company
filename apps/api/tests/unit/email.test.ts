import { afterEach, describe, expect, it, vi } from "vitest";
import { passwordResetEmailContent, sendPasswordResetEmail } from "../../src/lib/email.js";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
});

describe("password reset email", () => {
  it("contains bilingual instructions and the reset link", () => {
    const content = passwordResetEmailContent("Ayman", "https://example.com/reset-password?token=abc");
    expect(content.subject).toContain("إعادة تعيين");
    expect(content.html).toContain("https://example.com/reset-password?token=abc");
    expect(content.html).toContain("Reset your password");
    expect(content.text).toContain("ساعة واحدة");
  });

  it("escapes user-controlled HTML", () => {
    const content = passwordResetEmailContent("<script>alert(1)</script>", "https://example.com/?a=1&b=2");
    expect(content.html).not.toContain("<script>");
    expect(content.html).toContain("&lt;script&gt;");
    expect(content.html).toContain("a=1&amp;b=2");
  });

  it("sends through the Resend API without exposing the token in logs", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Nuqaa Asir <no-reply@example.com>";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendPasswordResetEmail({ email: "customer@example.com", fullName: "Customer", rawToken: "secret-token" })
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(String(request.body)).toContain("secret-token");
  });
});
