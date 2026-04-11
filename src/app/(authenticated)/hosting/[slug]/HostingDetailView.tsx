import { GameServerDetailPage } from "@/features/hosting/ui/GameServerDetailPage";
import { HostingDetailPage } from "@/features/hosting/ui/HostingDetailPage";
import type {
  DetailSection,
  GameServerDetailData,
} from "@/features/hosting/model/types";

export function HostingDetailView({
  slug,
  section,
  gameServerDetailData,
}: {
  slug: string;
  section: DetailSection | null;
  gameServerDetailData: GameServerDetailData | null;
}) {
  if (slug === "game-server") {
    return gameServerDetailData ? <GameServerDetailPage data={gameServerDetailData} /> : null;
  }

  if (!section) {
    return null;
  }

  return <HostingDetailPage section={section} />;
}
