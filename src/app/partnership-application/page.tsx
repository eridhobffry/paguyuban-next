import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { SITE } from "@/config/site";
import PartnershipForm from "./PartnershipForm";

export const dynamic = "force-static";

export default function PartnershipApplicationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Partnership Application</CardTitle>
          <CardDescription>
            Tell us a bit about your partnership interest. We’ll follow up
            within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For fastest response, call us directly at {SITE.contacts.phone}{" "}
                or WhatsApp us at {SITE.contacts.whatsapp}.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`tel:${SITE.contacts.phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-500"
                >
                  Call Now
                </a>
                <a
                  href="/calendar/event.ics"
                  download
                  className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                >
                  Add Event to Calendar
                </a>
                <Link
                  href="/request-access?type=sponsor"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2"
                >
                  Request Sponsorship Deck
                </Link>
              </div>
            </div>

            <PartnershipForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
