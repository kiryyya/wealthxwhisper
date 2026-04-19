import Image from "next/image";
import type { MediaAssetWithPosts } from "@/types";
import { formatBytes, joinTags } from "@/lib/format";
import { Button } from "@/components/ui/Button";

type Props = {
  asset: MediaAssetWithPosts;
  onOpen: (asset: MediaAssetWithPosts) => void;
  onDelete: (assetId: string) => void;
};

export function MediaCard({ asset, onOpen, onDelete }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <button className="relative block aspect-square w-full" onClick={() => onOpen(asset)}>
        <Image src={asset.url} alt={asset.altText || asset.title || "Media"} fill className="object-cover" />
      </button>
      <div className="space-y-1.5 p-3 text-xs">
        <p className="truncate text-sm font-semibold text-zinc-100">{asset.title || asset.storagePath}</p>
        <p className="text-zinc-400">
          {asset.format.toUpperCase()} · {formatBytes(asset.sizeBytes)}
        </p>
        <p className="line-clamp-2 text-zinc-500">{joinTags(asset.tags) || "Без тегов"}</p>
        <p className="text-zinc-500">{new Date(asset.createdAt).toLocaleDateString()}</p>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="w-full" onClick={() => onOpen(asset)}>
            Редактировать
          </Button>
          <Button variant="danger" className="w-full" onClick={() => onDelete(asset.id)}>
            Удалить
          </Button>
        </div>
      </div>
    </article>
  );
}
