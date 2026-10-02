/**
 * Đọc ô "Photo ref" của một phát hiện.
 *
 * Ô này chứa đường dẫn ảnh trong thư mục ảnh gốc của đội kiểm tra, do script
 * `backup/doi-chieu-anh.mjs` điền vào sau khi đối chiếu nội dung ảnh. Một
 * phát hiện có nhiều ảnh thì các đường dẫn ngăn nhau bằng dấu phẩy:
 *
 *   WTG 19/Tower/02_Top section/WTG 19 - Top section (23).jpg,
 *   WTG 19/Tower/02_Top section/WTG 19 - Top section (19).jpg
 *
 * Bảng ở mục 6 chỉ in tên file, bỏ phần thư mục: trụ và khu vực đã nằm ở
 * hai cột bên cạnh, in lại đường dẫn đầy đủ chỉ làm cột phình ra.
 *
 * Tên thứ n là của tấm ảnh thứ n (cả hai cùng xếp theo created_at). Tấm nào
 * không tìm được bản gốc trong thư mục thì chỗ đó ghi PHOTO_REF_MISSING, để
 * các tên sau nó vẫn đứng đúng vị trí.
 */
export const PHOTO_REF_MISSING = "—";

export const isMissingPhotoRef = (name: string) => name === PHOTO_REF_MISSING;

export interface PhotoRefs {
  /** Tên file, đã bỏ phần thư mục. */
  names: string[];
  /** Đường dẫn đầy đủ như đã ghi, giữ nguyên để không mất thông tin. */
  paths: string[];
}

export function parsePhotoRef(raw: string | undefined): PhotoRefs {
  const paths = (raw ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    paths,
    // Cắt ở cả hai kiểu dấu gạch: thư mục ghi trên Windows, nhưng script
    // chuẩn hoá về gạch xuôi khi ghi, nên gặp cả hai là chuyện bình thường.
    names: paths.map((p) => p.split(/[\\/]/).pop() ?? p),
  };
}

/** Một dòng trong ô Photo: hoặc một tên file, hoặc một dải tên liền số. */
export interface PhotoGroup {
  /** Chữ in ra, ví dụ "WTG16_HUB (1–8).jpg". */
  label: string;
  /** Số file dòng này gộp lại. */
  count: number;
}

/**
 * Gộp các tên file đánh số liền nhau thành một dải.
 *
 * Một phát hiện thường nhận cả chùm ảnh chụp liên tiếp — dấu Timemark chỉ in
 * tới phút nên không tách được từng tấm, và thật ra cả chùm đều là ảnh của
 * đúng lỗi đó. Đo trên trụ 16: giữa 8 ảnh một phát hiện, nhiều nhất 26. In
 * 26 dòng tên file vào một ô bảng thì không ai đọc nổi.
 *
 *   WTG16_HUB (1).jpg … WTG16_HUB (8).jpg  →  WTG16_HUB (1–8).jpg
 *
 * Gộp theo cụm số cuối cùng trong tên, nên "WTG 19 - Top section (23).jpg"
 * hay "IMG_0471.jpg" đều gộp được. Số rời rạc vẫn in riêng từng dòng, và số
 * 0 đứng đầu được giữ nguyên để tên còn tra ra được trong thư mục.
 */
export function groupPhotoNames(names: string[]): PhotoGroup[] {
  // Giữ thứ tự xuất hiện đầu tiên, để bảng không xáo lại so với lúc ghi.
  const nhom = new Map<string, { dau: string; cuoi: string; so: { n: number; chu: string }[] }>();
  const le: PhotoGroup[] = [];
  const thuTu: string[] = [];

  for (const ten of names) {
    const m = /^(.*?)(\d+)(\D*)$/.exec(ten);
    if (!m) {
      le.push({ label: ten, count: 1 });
      thuTu.push(`\u0001${le.length - 1}`);
      continue;
    }
    const [, dau, chu, cuoi] = m;
    const khoa = `${dau}\u0000${cuoi}`;
    if (!nhom.has(khoa)) {
      nhom.set(khoa, { dau, cuoi, so: [] });
      thuTu.push(khoa);
    }
    nhom.get(khoa)!.so.push({ n: Number(chu), chu });
  }

  const ra: PhotoGroup[] = [];
  for (const k of thuTu) {
    if (k.startsWith("\u0001")) { ra.push(le[Number(k.slice(1))]); continue; }
    const g = nhom.get(k)!;
    const so = [...g.so].sort((a, b) => a.n - b.n);
    for (let i = 0; i < so.length; ) {
      let j = i;
      while (j + 1 < so.length && so[j + 1].n === so[j].n + 1) j++;
      ra.push({
        label: i === j
          ? `${g.dau}${so[i].chu}${g.cuoi}`
          : `${g.dau}${so[i].chu}–${so[j].chu}${g.cuoi}`,
        count: j - i + 1,
      });
      i = j + 1;
    }
  }
  return ra;
}
