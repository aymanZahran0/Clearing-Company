import { describe, expect, it } from "vitest";
import { withServiceImageDelivery } from "./serviceImageDelivery";

describe("service image delivery URLs", () => {
  const blob = { id: "new-image", url: "https://store.public.blob.vercel-storage.com/services/s/new.png", altTextAr: "Service" };
  const local = { id: "local", url: "http://localhost:4000/uploads/services/s/photo.png" };

  it("uses the same origin for existing Blob images and preserves the selected image order", () => {
    const service = { id: "s", images: [blob, local] };
    const result = withServiceImageDelivery(service, "/api/v1");
    expect(result.images[0]).toEqual({ ...blob, url: "/api/v1/service-images/new-image/content" });
    expect(result.images[1]).toEqual(local);
    expect(service.images[0]).toEqual(blob);
  });

  it("supports the development API origin", () => {
    expect(withServiceImageDelivery({ images: [blob] }, "http://localhost:4000/api/v1/").images[0]?.url)
      .toBe("http://localhost:4000/api/v1/service-images/new-image/content");
  });

  it("keeps empty catalogs and non-Blob images usable", () => {
    expect(withServiceImageDelivery({ images: [] }, "/api/v1").images).toEqual([]);
    expect(withServiceImageDelivery({ images: [local] }, "/api/v1").images).toEqual([local]);
  });
});
