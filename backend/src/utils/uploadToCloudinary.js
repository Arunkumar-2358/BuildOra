import cloudinary from "../config/cloudinary.js";

export const uploadBufferToCloudinary = (file, folder = "buildora") =>
  new Promise((resolve, reject) => {
    const meta = {
      mimeType: file.mimetype,
      originalName: file.originalname,
      bytes: file.size
    };

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      resolve({
        url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        publicId: `${folder}/local-${Date.now()}-${file.originalname}`,
        ...meta
      });
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id, ...meta, bytes: result.bytes });
      }
    );

    stream.end(file.buffer);
  });

export const uploadMany = async (files = [], folder) => {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadBufferToCloudinary(file, folder)));
};
