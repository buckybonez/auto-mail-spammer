import "dotenv/config";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const contents = [
 ""
];

const titles = [
""
];

const getRandomItem = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const ROOT = process.cwd();
const LOG_FILE = path.join(ROOT, "logs.txt");

function loadRecipients(): string[] {
  const p = path.join(ROOT, "emails.json");
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as { mails: string[] };
  return data.mails;
}

function appendLog(line: string): void {
  fs.appendFileSync(LOG_FILE, line + "\n", "utf-8");
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const FIVE_MINUTES_MS = 5 * 60 * 1000;

async function sendToOne(to: string): Promise<{ ok: boolean; subject: string; error?: string }> {
  const subject = getRandomItem(titles);
  const textContent = getRandomItem(contents);
  const html = textContent
    .split("\n")
    .map((line) => (line.trim() ? `<p>${line.trim()}</p>` : ""))
    .join("\n");

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
    return { ok: true, subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, subject, error: message };
  }
}

async function runCampaign(): Promise<void> {
  const recipients = loadRecipients();
  const ts = () => new Date().toISOString();

  appendLog(`--- Campaign started ${ts()} | ${recipients.length} recipients ---`);

  for (let i = 0; i < recipients.length; i++) {
    const to = recipients[i];
    const result = await sendToOne(to);

    const logLine = `${ts()} | to=${to} | subject="${result.subject}" | ${result.ok ? "sent" : "failed"}${result.error ? ` | ${result.error}` : ""}`;
    appendLog(logLine);

    if (i < recipients.length - 1) {
      await delay(FIVE_MINUTES_MS);
    }
  }

  appendLog(`--- Campaign finished ${ts()} ---`);
}

runCampaign();