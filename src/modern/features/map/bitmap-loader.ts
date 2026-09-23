export async function decodeBitmap(
  blob: Blob,
  signal: AbortSignal,
  decode: (blob: Blob, options?: ImageBitmapOptions) => Promise<ImageBitmap> = createImageBitmap,
): Promise<ImageBitmap> {
  const bitmap = await decode(blob, { premultiplyAlpha: 'premultiply' })
  if (signal.aborted) {
    bitmap.close()
    throw signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')
  }
  return bitmap
}
