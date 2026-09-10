const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function isPublicBlobImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) &&
      !url.port && !url.username && !url.password &&
      url.pathname.startsWith("/services/");
  } catch {
    return false;
  }
}

/** Only fetch catalog images from public Blob storage; never follow redirects. */
export async function fetchPublicBlobImage(url: string) {
  if (!isPublicBlobImageUrl(url)) throw new Error("Unsupported service image URL");
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!response.ok || !response.body || !IMAGE_TYPES.has(contentType)) {
    await response.body?.cancel();
    throw new Error("Service image storage returned an invalid response");
  }
  return { response, contentType };
}
