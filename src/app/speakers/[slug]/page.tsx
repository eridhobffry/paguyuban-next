import Image from "next/image";
import { notFound } from "next/navigation";
import { getSafeImageSrc } from "@/lib/utils";

type Params = { params: { slug: string } };

async function fetchSpeaker(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/speakers/public?slug=${encodeURIComponent(slug)}`, {
    // Server component fetch; allow caching for a bit
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { speakers?: Array<any> };
  const item = data.speakers?.[0] ?? null;
  return item;
}

export default async function SpeakerDetailPage({ params }: Params) {
  const speaker = await fetchSpeaker(params.slug);
  if (!speaker) return notFound();
  const imageUrl = getSafeImageSrc(
    speaker.image_url ?? speaker.imageUrl ?? "",
    "/images/speakers/gita-wirjawan.jpg"
  );
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-white/10">
            <Image src={imageUrl} alt={speaker.name} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{speaker.name}</h1>
            {speaker.role && (
              <p className="text-cyan-300 mb-1">{speaker.role}</p>
            )}
            {speaker.company && (
              <p className="text-gray-400 mb-4">{speaker.company}</p>
            )}
            {speaker.bio && (
              <p className="text-gray-300 whitespace-pre-wrap">{speaker.bio}</p>
            )}
            <div className="mt-4 flex gap-3 text-sm">
              {speaker.website && (
                <a
                  href={speaker.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Website
                </a>
              )}
              {speaker.linkedin && (
                <a
                  href={speaker.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  LinkedIn
                </a>
              )}
              {speaker.twitter && (
                <a
                  href={speaker.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Twitter
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


