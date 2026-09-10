/** Keep local/S3 images intact; deliver Blob images through our API origin. */
export function withServiceImageDelivery<T extends { images: { id: string; url: string }[] }>(
  service: T,
  apiBaseUrl: string,
): T {
  return {
    ...service,
    images: service.images.map((image) => {
      let isBlob = false;
      try {
        const url = new URL(image.url);
        isBlob = url.protocol === "https:" &&
          /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname);
      } catch { /* Relative/local image URLs are already usable. */ }
      return isBlob
        ? { ...image, url: `${apiBaseUrl.replace(/\/$/, "")}/service-images/${encodeURIComponent(image.id)}/content` }
        : image;
    }),
  };
}
