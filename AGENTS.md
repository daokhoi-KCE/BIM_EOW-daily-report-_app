<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quy ước của dự án này

## Chỉ nhắm PC và bản in, không làm bố cục mobile

Người dùng làm việc trên máy tính để bàn, và sản phẩm cuối là file PDF khổ
A4. Đây là hai đích duy nhất cần quan tâm.

Vì vậy:

- **Không thêm lớp breakpoint** (`sm:`, `md:`, `lg:`, `xl:`) và không viết
  media query theo bề rộng màn hình. Hiện tại toàn bộ `src/` không có lớp
  nào như vậy — giữ nguyên tình trạng đó.
- **Không hy sinh bố cục PC để vừa màn hình hẹp**: không xếp chồng cột cho
  màn hình nhỏ, không thu nhỏ bảng, không tăng cỡ nút bấm cho ngón tay.
- `@media print` thì vẫn dùng bình thường — đó là khổ giấy, không phải
  kích thước màn hình.
- Khi cân nhắc cỡ chữ hay cỡ ảnh, lấy **màn hình máy tính và trang A4** làm
  chuẩn, đừng viện lý do "dễ đọc trên điện thoại".

## Sửa bố cục bản final thì phải chạy `npm run kiem-tra-in`

Lỗi ngắt trang không thấy được trên màn hình — chỉ lộ ra khi in. Đã hai lần
lọt lưới: phát hiện bị cắt đôi giữa hai trang, rồi dải tiêu đề hạng mục
đứng trơ trọi trên nửa trang trắng.

`scripts/kiem-tra-ban-in.tsx` dựng mục 5 từ chính các component thật, in ra
PDF bằng Chromium rồi đọc ngược file PDF. Nó chạy bốn kịch bản (ít ảnh,
nhiều ảnh, hạng mục ngắn, hạng mục dài) để dải tiêu đề rơi vào đủ mọi vị
trí trên trang, và kiểm ba điều:

1. Không phát hiện nào bị cắt ngang trang.
2. Không tiêu đề hạng mục nào lìa khỏi phát hiện đầu tiên của nó.
3. Khoảng trắng cuối trang phải nhỏ hơn khối đầu của trang kế — nếu trống
   còn nhiều hơn cả khối phải dời thì có thứ nhét vừa mà vẫn bị đẩy đi.

Điều 3 tự hiệu chỉnh theo nội dung, không dùng ngưỡng cố định tuỳ tiện.

Thoát mã khác 0 khi có lỗi, dùng được trong CI. Cần `pymupdf` (`pip install
pymupdf`) và Chromium; đường dẫn Chromium đổi qua biến `CHROME_PATH`.
