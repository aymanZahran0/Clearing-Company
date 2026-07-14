import { useState } from "react";
import { Button, Image, Input, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import type { UploadFile } from "antd/es/upload/interface";
import {
  useDeleteServiceImageMutation,
  useGetServiceBySlugQuery,
  useUploadServiceImageMutation,
} from "../../../api/servicesApi";

// T057/T173: catalog image management. Stands alone at
// /admin/catalog/services/:slug/images, ready to be linked from a catalog
// list once one ships — same pattern as ChecklistTemplateEditor.tsx.
export default function ServiceImages() {
  const { slug } = useParams<{ slug: string }>();
  const { data: serviceData, isLoading, refetch } = useGetServiceBySlugQuery(slug ?? "", { skip: !slug });
  const [uploadImage, { isLoading: isUploading }] = useUploadServiceImageMutation();
  const [deleteImage] = useDeleteServiceImageMutation();
  const [altTextEn, setAltTextEn] = useState("");
  const [altTextAr, setAltTextAr] = useState("");

  async function handleUpload(file: UploadFile) {
    if (!serviceData) return false;
    try {
      await uploadImage({
        serviceId: serviceData.id,
        file: file as unknown as File,
        altTextEn: altTextEn || undefined,
        altTextAr: altTextAr || undefined,
      }).unwrap();
      message.success("Image uploaded");
      refetch();
    } catch {
      message.error("Could not upload the image — check file type (JPEG/PNG/WebP) and size (max 5MB)");
    }
    return false; // prevent antd's default XHR upload; we drive it via RTK Query
  }

  if (isLoading || !serviceData) {
    return <div className="p-4 sm:p-6">Loading…</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Images — {serviceData.nameEn}</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          placeholder="Alt text (English)"
          value={altTextEn}
          onChange={(e) => setAltTextEn(e.target.value)}
          className="w-full sm:w-64"
        />
        <Input
          placeholder="Alt text (Arabic)"
          value={altTextAr}
          onChange={(e) => setAltTextAr(e.target.value)}
          className="w-full sm:w-64"
        />
        <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/jpeg,image/png,image/webp">
          <Button icon={<UploadOutlined />} loading={isUploading} size="large">
            Upload Image
          </Button>
        </Upload>
      </div>

      <Image.PreviewGroup>
        <div className="flex flex-wrap gap-4">
          {serviceData.images.map((image) => (
            <div key={image.id} className="w-40">
              <Image src={image.url} alt={image.altTextEn ?? ""} className="rounded" />
              <Button danger size="small" block className="mt-2" onClick={() => deleteImage(image.id).then(() => refetch())}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
    </div>
  );
}
