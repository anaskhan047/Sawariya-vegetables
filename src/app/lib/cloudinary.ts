// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Uploads an image to Cloudinary.
 * @param filePath - Path or base64 string of the image.
 * @param folder - Optional Cloudinary folder.
 */
export const uploadImage = async (filePath: string, folder?: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder || "default_uploads",
      resource_type: "image",
    });
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
