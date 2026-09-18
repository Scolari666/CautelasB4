import crypto from "crypto";

export function parseDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { contentType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function shortHash(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 10);
}

export function itemPhotoUrl(item: { id: string; photo: string | null }): string | null {
  return item.photo ? `/api/items/${item.id}/photo?v=${shortHash(item.photo)}` : null;
}

export function userAvatarUrl(user: { id: string; avatarUrl: string | null }): string | null {
  return user.avatarUrl ? `/api/users/${user.id}/avatar?v=${shortHash(user.avatarUrl)}` : null;
}

export function serializeItem<T extends { id: string; photo: string | null }>(item: T): T {
  return { ...item, photo: itemPhotoUrl(item) };
}

export function serializeUser<T extends { id: string; avatarUrl: string | null }>(user: T): T {
  return { ...user, avatarUrl: userAvatarUrl(user) };
}

type ItemLike = { id: string; photo: string | null };

export function serializeLineItem<T extends { item: ItemLike }>(lineItem: T): T {
  return { ...lineItem, item: serializeItem(lineItem.item) };
}

export function serializeWithItems<T extends { items: { item: ItemLike }[] }>(record: T): T {
  return { ...record, items: record.items.map(serializeLineItem) };
}
