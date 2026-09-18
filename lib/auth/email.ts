import { Resend } from "resend";

export async function sendVerificationEmail(input: {
  email: string;
  url: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and AUTH_EMAIL_FROM are required.");
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n🔗 [DAWH Auth] Verification link for ${input.email}:\n${input.url}\n`
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: "Verify your DAWH email",
    html: `<p>Verify your DAWH email address.</p><p><a href="${input.url}">Verify email</a></p>`,
  });

  if (error) {
    console.error(`[Resend Error]: ${error.message}`);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Resend could not send verification email: ${error.message}`);
    }
  }
}
