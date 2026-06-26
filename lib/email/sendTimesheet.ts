import nodemailer from "nodemailer";
import { getAppDisplayName } from "@/lib/env";

type SendTimesheetEmailInput = {
  to: string;
  toName?: string;
  cc?: string;
  subject: string;
  message: string;
  pdfBuffer: Buffer;
  periodLabel: string;
};

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) throw new Error("SMTP_HOST is not configured");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendTimesheetEmail(input: SendTimesheetEmailInput) {
  const from = process.env.SMTP_FROM;
  if (!from) throw new Error("SMTP_FROM is not configured");

  const transport = createTransport();
  const appName = getAppDisplayName();

  await transport.sendMail({
    from: `${appName} <${from}>`,
    to: input.toName ? `"${input.toName}" <${input.to}>` : input.to,
    cc: input.cc,
    subject: input.subject,
    text: `${input.message}\n\n—\nSent via ${appName}`,
    attachments: [
      {
        filename: `timesheet-${input.periodLabel.replace(/\s/g, "-")}.pdf`,
        content: input.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
