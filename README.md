# BIM EOW — Báo cáo công việc hằng ngày

Web app Next.js (App Router) + Supabase cho đội kiểm tra tuabin gió BIM Wind
Farm EOW inspection. Chuyển thể từ artifact React gốc
(`BIM-EOW-Daily-Report-App.jsx`) — giữ nguyên UI/UX, thay `window.storage`
bằng Postgres + Storage thật trên Supabase.

## 1. Tạo project Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com) (free tier đủ dùng cho đội vài chục người).
2. Vào **SQL Editor** → New query → dán toàn bộ nội dung [`supabase/schema.sql`](supabase/schema.sql) → Run.
   File này tạo bảng `reports`, `turbine_work`, `lock_schedule`, `findings`,
   `finding_photos`, `site_photos`, view `report_list_view`, và bật RLS cho
   người dùng đã đăng nhập đọc/ghi.
3. Vào **Storage** → New bucket → tên `evidence-photos` → **Private**.
   (Phần policy cho bucket này đã nằm trong `schema.sql`, chạy sau khi tạo bucket.)
4. Vào **Authentication** → Users → tạo tài khoản email/password cho từng
   thành viên đội (hoặc bật mời qua email). App dùng Supabase Auth
   email/password, không có trang tự đăng ký.
5. Vào **Settings → API**, copy `Project URL` và khoá `anon public`.

## 2. Chạy local

```bash
npm install
cp .env.local.example .env.local
# điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — sẽ được chuyển tới
`/login`. Đăng nhập bằng tài khoản đã tạo ở bước 1.4.

## 3. Deploy lên Vercel

1. Push repo này lên GitHub.
2. Vào [vercel.com/new](https://vercel.com/new), import repo.
3. Thêm biến môi trường (Project Settings → Environment Variables):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   (`SUPABASE_SERVICE_ROLE_KEY` chưa được app dùng tới — mọi thao tác đọc/ghi
   đều đi qua RLS bằng session của người dùng đăng nhập. Chỉ thêm biến này
   nếu sau này cần tác vụ admin bỏ qua RLS.)
4. Deploy. Mỗi lần push sẽ có preview deploy riêng.

## Kiến trúc

- **Next.js App Router**, Server Components cho list/detail, Server Actions
  (`src/lib/actions/reports.ts`) cho mọi thao tác ghi bảng `reports` và các
  bảng con — chạy dưới quyền session người dùng (RLS enforce quyền, không
  dùng service role key).
- **Ảnh bằng chứng**: nén ở client (resize ~1000px, JPEG q~0.62, giữ đúng
  logic từ file gốc — xem [`src/lib/compress-image.ts`](src/lib/compress-image.ts)),
  upload thẳng từ trình duyệt lên Supabase Storage bucket `evidence-photos`
  (không qua server, tránh giới hạn body 1MB của Server Actions). Bucket
  private, hiển thị qua signed URL.
- **Autosave**: debounce 700ms giống bản gốc — mọi thay đổi trường text/số
  gọi `saveReport()` (server action) ghi đè toàn bộ báo cáo + đồng bộ
  turbines/locks/findings (thêm/xoá dòng). Ảnh lưu ngay lập tức khi upload,
  không đợi debounce.
- **Auth**: Supabase Auth email/password. `src/proxy.ts` (Next.js 16 đổi tên
  từ `middleware.ts`) refresh session mỗi request và chặn truy cập khi chưa
  đăng nhập.
- **Khác biệt so với artifact gốc**: đã bỏ cảnh báo giới hạn 5MB/báo cáo
  (`sizeKB > 3500`) vì ảnh giờ lưu ở Supabase Storage, không nhồi base64 vào
  JSON nữa — không còn giới hạn dung lượng thực tế.

## Cấu trúc thư mục

```
src/
  app/
    page.tsx                 # danh sách báo cáo
    login/                    # trang đăng nhập + server actions
    reports/[id]/page.tsx     # trang chỉnh sửa 1 báo cáo
  components/
    AppHeader.tsx, SaveStateBadge.tsx, DeleteReportButton.tsx
    ReportEditor.tsx           # toàn bộ form accordion (client component)
    form/                      # Field, SectionCard, RowCard, QuickPick,
                                # YesNoToggle, PhotoGrid, Lightbox
  lib/
    types.ts, db-types.ts, db-mappers.ts   # kiểu dữ liệu + map DB <-> UI
    actions/reports.ts        # server actions: list/get/save/delete/cumulative hint
    client-photos.ts          # upload/xoá ảnh trực tiếp từ browser lên Storage
    report-text.ts            # buildText() — xuất text song ngữ để copy
    compress-image.ts, blank-report.ts, utils.ts, theme.ts
    supabase/client.ts         # browser client
    supabase/server.ts         # server client (cookies)
  proxy.ts                    # bảo vệ route + refresh session (ex-middleware.ts)
supabase/schema.sql            # toàn bộ schema + RLS + storage policy
```

## Ghi chú Next.js 16

Project scaffold bằng `create-next-app` phiên bản mới nhất tại thời điểm
build (Next.js 16 / React 19). Next 16 có vài breaking changes so với các
bản trước:

- `middleware.ts` đã đổi tên thành `proxy.ts` (export `proxy` thay vì
  `middleware`) — hành vi giữ nguyên.
- `cookies()`, `params`, `searchParams` đều là async (phải `await`).

Nếu nâng cấp Next.js sau này, đọc `node_modules/next/dist/docs/` (hoặc
`AGENTS.md` ở gốc repo) trước khi sửa code liên quan tới các API trên.
