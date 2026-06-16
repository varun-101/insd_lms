import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (cached !== undefined) return cached;
  const host = process.env.SMTP_HOST;
  if (!host) {
    cached = null;
    return cached;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return cached;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "Verdant LMS <no-reply@verdant.local>",
    ...opts,
  });
}
