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
