import sharp from 'sharp';
import { ReviewError } from './review';

/** Longest edge sent to the model; larger images are scaled down by the API anyway. */
const MAX_EDGE = 1568;

/** Normalises a screenshot to a JPEG small enough for the model, as base64. */
export async function toModelImage(file: File): Promise<string> {
  try {
    const out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 85 })
      .toBuffer();
    return out.toString('base64');
  } catch {
    throw new ReviewError(`${file.name} couldn't be read as an image.`, 400);
  }
}
