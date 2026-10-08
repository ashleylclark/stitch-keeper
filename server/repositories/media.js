import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { orm } from '../db.js';
import { mediaAssets } from '../schema.js';

const sqlitePath =
  process.env.SQLITE_PATH ??
  path.join(process.cwd(), 'data', 'stitch-keeper.db');
const uploadRoot =
  process.env.MEDIA_UPLOAD_DIR ??
  path.join(path.dirname(sqlitePath), 'uploads');

const mimeExtensions = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const allowedImageMimeTypes = new Set(Object.keys(mimeExtensions));
export const maxImageUploadBytes = 8 * 1024 * 1024;

export function createMediaAsset(ownerContext, file) {
  const id = `media-${randomUUID()}`;
  const extension = mimeExtensions[file.mimeType] ?? '';
  const storagePath = `${id}${extension}`;
  const absolutePath = getMediaAbsolutePath(storagePath);
  const asset = {
    id,
    householdId: ownerContext.householdId,
    ownerUserId: ownerContext.userId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.buffer.length,
    storagePath,
    createdAt: new Date().toISOString(),
  };

  fs.mkdirSync(uploadRoot, { recursive: true });

  try {
    fs.writeFileSync(absolutePath, file.buffer, { flag: 'wx' });
    orm.insert(mediaAssets).values(asset).run();
  } catch (error) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (unlinkError) {
      if (unlinkError?.code !== 'ENOENT') {
        throw unlinkError;
      }
    }

    throw error;
  }

  return toMediaResponse(asset);
}

export function findMediaAsset(ownerContext, id) {
  const asset = orm
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.id, id),
        eq(mediaAssets.householdId, ownerContext.householdId),
      ),
    )
    .get();

  return asset
    ? { ...asset, absolutePath: getMediaAbsolutePath(asset.storagePath) }
    : null;
}

export function deleteMediaAsset(ownerContext, id) {
  const asset = findMediaAsset(ownerContext, id);

  if (!asset) {
    return false;
  }

  orm
    .delete(mediaAssets)
    .where(
      and(
        eq(mediaAssets.id, id),
        eq(mediaAssets.householdId, ownerContext.householdId),
      ),
    )
    .run();

  try {
    fs.unlinkSync(asset.absolutePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  return true;
}

function getMediaAbsolutePath(storagePath) {
  return path.join(uploadRoot, path.basename(storagePath));
}

function toMediaResponse(asset) {
  return {
    id: asset.id,
    url: `/api/media/${asset.id}`,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
  };
}
