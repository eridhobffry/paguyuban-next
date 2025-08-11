import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSafeImageSrc } from "@/lib/utils";

export const revalidate = 300; // optional ISR for public deep links

type PublicArtist = {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  slug?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  website?: string | null;
};

async function getArtistBySlug(slug: string): Promise<PublicArtist | null> {
  const res = await fetch(
    `/api/artists/public?slug=${encodeURIComponent(slug)}`,
    {
      next: { revalidate },
    }
  ).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json()) as { artists?: PublicArtist[] };
  const artist = (data.artists ?? []).find((a) => a.slug === slug) ?? null;
  return artist;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: "Artist not found" };
  return {
    title: `${artist.name} – Artist`,
    description: artist.bio ?? `${artist.name} at ${artist.company ?? ""}`,
  };
}

export default async function ArtistPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const image = getSafeImageSrc(
    artist.imageUrl ?? undefined,
    "/images/artists/dewa19.jpg"
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
              alt={artist.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {artist.name}
            </h1>
            {(artist.role || artist.company) && (
              <p className="text-purple-300 mb-4">
                {artist.role}
                {artist.role && artist.company ? " · " : ""}
                {artist.company}
              </p>
            )}
            {artist.bio && (
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {artist.bio}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {artist.instagram && (
                <a
                  href={artist.instagram}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  Instagram
                </a>
              )}
              {artist.youtube && (
                <a
                  href={artist.youtube}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  YouTube
                </a>
              )}
              {artist.twitter && (
                <a
                  href={artist.twitter}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  Twitter
                </a>
              )}
              {artist.linkedin && (
                <a
                  href={artist.linkedin}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-gray-200 hover:bg-white/15"
                >
                  LinkedIn
                </a>
              )}
              {artist.website && (
                <a
                  href={artist.website}
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
