import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicBlobImage, isPublicBlobImageUrl } from "../../src/lib/storage/publicImage.js";

const imageUrl = "https://store123.public.blob.vercel-storage.com/services/service-id/image.png";
afterEach(() => vi.unstubAllGlobals());

describe("public service image delivery", () => {
  it("restricts upstream requests to public Blob service images", () => {
    expect(isPublicBlobImageUrl(imageUrl)).toBe(true);
    for (const url of [
      "http://localhost/image.png",
      imageUrl.replace("https:", "http:"),
      imageUrl.replace(".com/", ".com.evil.test/"),
      imageUrl.replace("https://", "https://user:password@"),
      imageUrl.replace("/services/", "/private/"),
    ]) expect(isPublicBlobImageUrl(url)).toBe(false);
  });

  it("returns the image stream with its content type and disables redirects", async () => {
    const response = new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { "Content-Type": "image/png" },
    });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublicBlobImage(imageUrl);
    expect(result.contentType).toBe("image/png");
    expect(new Uint8Array(await result.response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(fetchMock).toHaveBeenCalledWith(imageUrl, expect.objectContaining({ redirect: "error" }));
  });

  it.each([
    [404, "image/png"],
    [200, "text/html"],
    [200, "image/svg+xml"],
  ])("rejects invalid upstream responses (%s, %s)", async (status, contentType) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid", {
      status, headers: { "Content-Type": contentType },
    })));
    await expect(fetchPublicBlobImage(imageUrl)).rejects.toThrow("invalid response");
  });

  it("does not fetch untrusted URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPublicBlobImage("http://127.0.0.1/secret")).rejects.toThrow("Unsupported");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
