/** Nén ảnh xuống JPEG cỡ nhỏ trước khi upload (chỉ chạy ở client). */
export function compressImage(file: File, maxW = 1000, quality = 0.62): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không tạo được canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Không nén được ảnh"))),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Không đọc được ảnh"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}
