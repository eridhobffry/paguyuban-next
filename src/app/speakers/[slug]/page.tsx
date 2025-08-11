import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSafeImageSrc } from "@/lib/utils";

export const revalidate = 300; // optional ISR for public deep links

type PublicSpeaker = {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  slug?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  website?: string | null;
};

async function getSpeakerBySlug(slug: string): Promise<PublicSpeaker | null> {
  const res = await fetch(
    `/api/speakers/public?slug=${encodeURIComponent(slug)}`,
    {
      next: { revalidate },
    }
  ).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json()) as { speakers?: PublicSpeaker[] };
  const speaker = (data.speakers ?? []).find((s) => s.slug === slug) ?? null;
  return speaker;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const speaker = await getSpeakerBySlug(params.slug);
  if (!speaker) return { title: "Speaker not found" };
  return {
    title: `${speaker.name} – Speaker`,
    description: speaker.bio ?? `${speaker.name} at ${speaker.company ?? ""}`,
  };
}

export default async function SpeakerPage({
  params,
}: {
  params: { slug: string };
}) {
  const speaker = await getSpeakerBySlug(params.slug);
  if (!speaker) notFound();

  const image = getSafeImageSrc(
    speaker.imageUrl ?? undefined,
    "/images/speakers/gita-wirjawan.jpg"
  );

  return (
    <section className="relative py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-slate-900/80 -z-10" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white underline-offset-4 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8">
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
            <Image
              src={image}
              alt={speaker.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {speaker.name}
            </h1>
            {(speaker.role || speaker.company) && (
              <p className="text-cyan-300 mb-4">
                {speaker.role}
                {speaker.role && speaker.company ? " · " : ""}
                {speaker.company}
              </p>
            )}
            {speaker.bio && (
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {speaker.bio}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {speaker.twitter && (
                <a
                  href={speaker.twitter}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  Twitter
                </a>
              )}
              {speaker.linkedin && (
                <a
                  href={speaker.linkedin}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  LinkedIn
                </a>
              )}
              {speaker.website && (
                <a
                  href={speaker.website}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
