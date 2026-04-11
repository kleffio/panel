import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getHostingDetailPageData,
  hostingDetailSlugs,
} from "@/features/hosting/server/loaders";
import { HostingDetailView } from "./HostingDetailView";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return hostingDetailSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getHostingDetailPageData(slug);

  return {
    title: slug === "game-server" ? "Game Server" : data.section?.label ?? "Hosting Detail",
  };
}

export default async function HostingDetailRoute({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const data = await getHostingDetailPageData(slug);

  if (!data.section && !data.gameServerDetailData && slug !== "game-server") {
    notFound();
  }

  return (
    <HostingDetailView
      slug={slug}
      section={data.section}
      gameServerDetailData={data.gameServerDetailData}
    />
  );
}
