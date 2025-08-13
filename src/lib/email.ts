import * as brevo from "@getbrevo/brevo";

interface EmailSender {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  sender?: EmailSender;
}

const apiInstance = new brevo.TransactionalEmailsApi();

const apiKey = process.env.BREVO_API_KEY;
if (apiKey) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
} else {
  console.warn("BREVO_API_KEY is not set. Emails will be skipped.");
}

export async function sendEmailBrevo(
  params: SendEmailParams
): Promise<boolean> {
  if (!apiKey) return false;

  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .filter(Boolean)
    .map((email) => ({ email }));

  if (recipients.length === 0) {
    console.warn("sendEmailBrevo called without recipients");
    return false;
  }

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL ||
    params.sender?.email ||
    "no-reply@paguyuban.local";
  const senderName =
    process.env.BREVO_SENDER_NAME || params.sender?.name || "Paguyuban";

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.to = recipients;
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.html;
    if (params.text) sendSmtpEmail.textContent = params.text;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Brevo email send error:", error);
    return false;
  }
}

// Domain-specific helpers and templates
type AccessDecision = "approved" | "rejected";

function templateNewAccessRequestAdmin(requesterEmail: string) {
  const subject = "New access request submitted";
  const html = `<p>A new access request was submitted.</p><p><strong>Email:</strong> ${requesterEmail}</p>`;
  const text = `New access request submitted for ${requesterEmail}`;
  return { subject, html, text };
}

function templateUpdatedAccessRequestAdmin(requesterEmail: string) {
  const subject = "Access request updated and re-submitted";
  const html = `<p>An existing access request was updated and re-submitted.</p><p><strong>Email:</strong> ${requesterEmail}</p>`;
  const text = `Access request updated and re-submitted for ${requesterEmail}`;
  return { subject, html, text };
}

function templateDecisionToRequester(decision: AccessDecision) {
  if (decision === "approved") {
    return {
      subject: "Your access request has been approved",
      html: `<p>Your access request has been approved. You can now log in using your email and the password you provided during the request.</p>`,
      text: "Your access request has been approved. You can now log in.",
    };
  }
  return {
    subject: "Your access request has been rejected",
    html: `<p>Your access request has been rejected. If you believe this is an error, please reply to this email.</p>`,
    text: "Your access request has been rejected.",
  };
}

import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

export async function notifyAdminNewAccessRequest(requesterEmail: string) {
  const { subject, html, text } = templateNewAccessRequestAdmin(requesterEmail);
  return sendEmailBrevo({ to: SUPER_ADMIN_EMAIL, subject, html, text });
}

export async function notifyAdminUpdatedAccessRequest(requesterEmail: string) {
  const { subject, html, text } =
    templateUpdatedAccessRequestAdmin(requesterEmail);
  return sendEmailBrevo({ to: SUPER_ADMIN_EMAIL, subject, html, text });
}

export async function notifyRequesterDecision(
  requesterEmail: string,
  decision: AccessDecision
) {
  const { subject, html, text } = templateDecisionToRequester(decision);
  return sendEmailBrevo({ to: requesterEmail, subject, html, text });
}
