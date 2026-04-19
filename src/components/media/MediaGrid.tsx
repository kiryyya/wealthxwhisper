import type { MediaAssetWithPosts } from "@/types";

import { MediaCard } from "./MediaCard";

type Props = {
  media: MediaAssetWithPosts[];
  onOpen: (asset: MediaAssetWithPosts) => void;
  onDelete: (assetId: string) => void;
};

export function MediaGrid({ media, onOpen, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {media.map((asset) => (
        <MediaCard key={asset.id} asset={asset} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </div>
  );
}
