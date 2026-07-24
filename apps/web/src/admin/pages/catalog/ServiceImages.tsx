import { useState } from "react";
import { Button, Image, Input, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      message.success(t("admin:serviceImages.uploaded"));
      refetch();
    } catch {
      // toast shown by the global RTK Query error middleware
    }
    return false; // prevent antd's default XHR upload; we drive it via RTK Query
  }

  if (isLoading || !serviceData) {
    return <div className="p-4 sm:p-6">{t("common.loading")}</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">
        {t("admin:serviceImages.title")} — {serviceData.nameAr}
      </h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          placeholder={t("admin:serviceImages.altTextEn")}
          value={altTextEn}
          onChange={(e) => setAltTextEn(e.target.value)}
          className="w-full sm:w-64"
        />
        <Input
          placeholder={t("admin:serviceImages.altTextAr")}
          value={altTextAr}
          onChange={(e) => setAltTextAr(e.target.value)}
          className="w-full sm:w-64"
        />
        <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/jpeg,image/png,image/webp">
          <Button icon={<UploadOutlined />} loading={isUploading} size="large">
            {t("admin:serviceImages.uploadImage")}
          </Button>
        </Upload>
      </div>

      <Image.PreviewGroup>
        <div className="flex flex-wrap gap-4">
          {serviceData.images.map((image) => (
            <div key={image.id} className="w-40">
              <Image src={image.url} alt={image.altTextEn ?? ""} className="rounded" />
              <Button danger size="small" block className="mt-2" onClick={() => deleteImage(image.id).then(() => refetch())}>
                {t("admin:serviceImages.delete")}
              </Button>
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
    </div>
  );
}
