/**
 * Client-Side Image Compression Utility
 * Resizes and compresses images to WebP format before uploading.
 * Reduces file sizes dramatically while maintaining visual clarity.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxDimension: number = 1400,
  quality: number = 0.8
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas rendering context"));
          return;
        }

        // Fill background with clean white for transparent PNGs
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/webp", quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed to produce a blob"));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp" }
            );
            const compressedSizeKb = Math.round(blob.size / 1024);

            resolve({
              file: compressedFile,
              dataUrl,
              originalSizeKb,
              compressedSizeKb,
              width,
              height,
            });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load source image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
