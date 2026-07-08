import type { Metadata } from "next";
import { SmsOptIn } from "@/components/home/sms-optin";

// Dedicated SMS opt-in page. This is the canonical Call-to-Action URL
// referenced in our Twilio A2P 10DLC campaign registration (End User
// Consent / message_flow). Keep this page in sync with the registered
// campaign description — TCR reviewers verify it directly.
export const metadata: Metadata = {
  title: "Get SMS Drops - Nazaara Live",
  description:
    "Sign up for text messages from Nazaara Live. Event announcements, presales, and ticket drops. Typically 2-6 SMS per month. Msg & data rates may apply.",
};

export default function SmsPage() {
  return (
    <main>
      <SmsOptIn source="sms_page" />
    </main>
  );
}
