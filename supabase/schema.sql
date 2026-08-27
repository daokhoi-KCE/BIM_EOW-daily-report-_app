-- BIM EOW Daily Report — Supabase schema
-- Chạy toàn bộ file này trong Supabase SQL Editor (Project > SQL Editor > New query)

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  day_number int,
  planned_turbines text,
  actual_turbines text,
  prepared_by text,
  oem_rep text,
  sent_to text default 'BIM Wind Power JSC / GE / Site team MB',
  weather text,
  issues text,
  tomorrow_plan text,
  sign_prepared text,
  sign_oem text,
  sign_site text,
  safety_hazard_yn text, safety_hazard_detail text,
  safety_shutdown_yn text, safety_shutdown_detail text,
  safety_major_yn text, safety_major_detail text,
  progress_planned_today text,
  progress_actual_today text,
  progress_cumulative int,
  progress_on_schedule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists turbine_work (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  turbine text,
  blade_done text,       -- "A" / "A,B" / "A,B,C"
  hub text, nacelle text, tower text, drone text,  -- "Xong" / "Dở" / "Có" / "Không"
  pct_done int,
  notes text,
  sort_order int not null default 0
);

create table if not exists lock_schedule (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  turbine text,
  blade_position text,   -- A / B / C
  planned_time time,
  actual_time time,
  delay_minutes int generated always as (
    case when planned_time is not null and actual_time is not null
      then (extract(epoch from (actual_time - planned_time)) / 60)::int
      else null
    end
  ) stored,
  notes text,
  sort_order int not null default 0
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  turbine text,
  area text,
  description text,
  severity int check (severity between 1 and 5),
  photo_ref text,
  oem_notified text,
  time_notified time,
  sort_order int not null default 0
);

create table if not exists finding_photos (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references findings(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists site_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_turbine_work_report on turbine_work(report_id);
create index if not exists idx_lock_schedule_report on lock_schedule(report_id);
create index if not exists idx_findings_report on findings(report_id);
create index if not exists idx_finding_photos_finding on finding_photos(finding_id);
create index if not exists idx_site_photos_report on site_photos(report_id);
create index if not exists idx_reports_date on reports(report_date desc);

-- gợi ý lũy kế: đếm số trụ có report mới nhất pct_done = 100
create index if not exists idx_turbine_work_turbine_pct on turbine_work(turbine, pct_done);

-- ─────────────────────────────────────────────
-- View tổng hợp cho list view (đếm findings / ảnh mà không cần join phức tạp
-- ở client). security_invoker để view tôn trọng RLS của người gọi.
-- ─────────────────────────────────────────────

create or replace view report_list_view
with (security_invoker = true) as
select
  r.id,
  r.report_date,
  r.day_number,
  r.planned_turbines,
  r.prepared_by,
  r.progress_cumulative,
  r.safety_hazard_yn,
  r.safety_shutdown_yn,
  r.safety_major_yn,
  r.updated_at,
  (select count(*) from findings f where f.report_id = r.id) as findings_count,
  (select count(*) from site_photos sp where sp.report_id = r.id) as site_photos_count,
  (select count(*) from finding_photos fp
     join findings f2 on f2.id = fp.finding_id
     where f2.report_id = r.id) as finding_photos_count
from reports r;

-- ─────────────────────────────────────────────
-- updated_at auto-touch
-- ─────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_reports_updated_at on reports;
create trigger trg_reports_updated_at
  before update on reports
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- RLS — mọi người dùng đã đăng nhập (Supabase Auth) được đọc/ghi
-- Nếu sau này cần role chỉ-đọc cho BIM/GE, xem ghi chú cuối file.
-- ─────────────────────────────────────────────

alter table reports enable row level security;
alter table turbine_work enable row level security;
alter table lock_schedule enable row level security;
alter table findings enable row level security;
alter table finding_photos enable row level security;
alter table site_photos enable row level security;

drop policy if exists "authenticated read/write" on reports;
create policy "authenticated read/write" on reports
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read/write" on turbine_work;
create policy "authenticated read/write" on turbine_work
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read/write" on lock_schedule;
create policy "authenticated read/write" on lock_schedule
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read/write" on findings;
create policy "authenticated read/write" on findings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read/write" on finding_photos;
create policy "authenticated read/write" on finding_photos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read/write" on site_photos;
create policy "authenticated read/write" on site_photos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- Storage — bucket "evidence-photos" (tạo thủ công trong Storage UI, đặt Private)
-- Sau khi tạo bucket, chạy phần dưới để cho phép người đã đăng nhập đọc/ghi.
-- ─────────────────────────────────────────────

drop policy if exists "authenticated read evidence-photos" on storage.objects;
create policy "authenticated read evidence-photos" on storage.objects
  for select using (bucket_id = 'evidence-photos' and auth.role() = 'authenticated');

drop policy if exists "authenticated upload evidence-photos" on storage.objects;
create policy "authenticated upload evidence-photos" on storage.objects
  for insert with check (bucket_id = 'evidence-photos' and auth.role() = 'authenticated');

drop policy if exists "authenticated delete evidence-photos" on storage.objects;
create policy "authenticated delete evidence-photos" on storage.objects
  for delete using (bucket_id = 'evidence-photos' and auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- Realtime — cho phép nhiều người cùng chỉnh sửa 1 báo cáo (đồng bộ tức thời).
-- postgres_changes tôn trọng RLS, chỉ user đã đăng nhập nhận được event.
-- ─────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array['reports','turbine_work','lock_schedule','findings','finding_photos','site_photos']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────
-- (Tuỳ chọn) Role chỉ đọc cho BIM/GE:
-- 1. Tạo user Supabase Auth riêng cho họ.
-- 2. Thêm cột `role` vào bảng profiles liên kết auth.users, hoặc dùng
--    custom claim trong JWT (app_metadata.role = 'viewer').
-- 3. Thay policy "for all" ở trên bằng 2 policy tách biệt:
--    - select: cho mọi authenticated user
--    - insert/update/delete: chỉ khi auth.jwt() ->> 'role' <> 'viewer'
-- ─────────────────────────────────────────────
