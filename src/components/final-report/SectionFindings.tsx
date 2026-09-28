import type { SectionGroup } from "@/lib/final-report";
import { NAVY } from "@/lib/theme";
import FindingCard from "@/components/final-report/FindingCard";

export function sectionAnchorId(id: string) {
  return `section-${id}`;
}

function Count({ n, label, color }: { n: number; label: string; color: string }) {
  if (n === 0) return null;
  return (
    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded" style={{ background: color, color: "white" }}>
      {n} {label}
    </span>
  );
}

export default function SectionFindings({
  group,
  multiTurbine,
}: {
  group: SectionGroup;
  multiTurbine: boolean;
}) {
  const { section, findings } = group;
  const empty = findings.length === 0;
  // Phát hiện đầu tiên đi cùng khối tiêu đề; số còn lại xếp bình thường.
  const [first, ...rest] = findings;

  return (
    <section id={sectionAnchorId(section.id)} className="mt-5 scroll-mt-16">
      {/* Khối mở đầu hạng mục: dải tiêu đề, dòng thống kê và phát hiện đầu
          tiên phải nằm cùng một trang khi in.

          Trước đây chỉ đặt "đừng ngắt ngay sau tiêu đề". Không đủ: thứ đi
          ngay sau tiêu đề là dòng thống kê, nên trình duyệt coi như đã làm
          xong việc — giữ tiêu đề với dòng thống kê ở cuối trang, rồi đẩy
          phát hiện đầu tiên sang trang kế. Kết quả là nửa trang bỏ trống
          dưới một cái tiêu đề trơ trọi. Gom cả ba vào một khối không được
          cắt thì trình duyệt buộc phải dời cả cụm sang trang sau. */}
      <div className="section-open">
        <div className="section-head rounded-md px-3 py-1.5" style={{ background: NAVY }}>
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="text-[14.5px] font-extrabold uppercase tracking-wide leading-tight text-white">
              {section.no} {section.en}
            </h3>
            <span className="text-[10px] font-bold text-white/80">
              {findings.length} {findings.length === 1 ? "finding" : "findings"}
            </span>
          </div>
          <div className="text-[9.5px] italic text-white/70 leading-tight">{section.vi}</div>
        </div>

        {empty ? (
          <p className="text-[10px] italic text-slate-400 mt-2 px-1">
            No findings recorded in this section.{" "}
            <span className="not-italic">/ Không ghi nhận phát hiện nào ở hạng mục này.</span>
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap mt-1.5 mb-2 px-1">
              <Count n={group.critical} label="critical" color="#B91C1C" />
              <Count n={group.medium} label="medium" color="#B45309" />
              <Count n={group.low} label="low" color="#047857" />
              <span className="text-[9.5px] text-slate-500">{group.photos} ảnh / photos</span>
              {multiTurbine && group.turbines.length > 0 && (
                <span className="text-[9.5px] text-slate-500">
                  · {group.turbines.length} trụ: {group.turbines.join(", ")}
                </span>
              )}
            </div>
            <FindingCard f={first} showTurbine={multiTurbine} />
          </>
        )}
      </div>

      {rest.length > 0 && (
        <div className="space-y-3 mt-3">
          {rest.map((f, i) => (
            <FindingCard key={`${f.id}-${i}`} f={f} showTurbine={multiTurbine} />
          ))}
        </div>
      )}
    </section>
  );
}
