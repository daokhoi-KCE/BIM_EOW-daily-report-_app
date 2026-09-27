import type { DatedFinding } from "@/lib/final-report";
import { severityTier, TIER } from "@/components/print/shared";

/**
 * Một phát hiện: cột trái là diễn giải, cột phải là ảnh chứng cứ.
 *
 * Dùng chung cho hai cách trình bày — gom theo cụm thiết bị (mục 5.x) và gom
 * theo tuabin — nên có `showTurbine` để bật nhãn trụ khi các phát hiện trong
 * cùng một khối đến từ nhiều trụ khác nhau.
 */
export default function FindingCard({
  f,
  showTurbine = false,
}: {
  f: DatedFinding & { turbine?: string };
  showTurbine?: boolean;
}) {
  const tier = severityTier(f.severity);
  const tone = TIER[tier];

  return (
    <div className={`avoid-break rounded-md border ${tone.border} ${tone.bg} border-l-4 overflow-hidden`}>
      <div className="grid grid-cols-3 gap-0 print:gap-0">
        <div className="col-span-1 p-3 border-r" style={{ borderRightColor: "rgba(0,0,0,0.08)" }}>
          <div className="mb-2">
            {showTurbine && f.turbine && (
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                {f.turbine}
              </div>
            )}
            <div className="text-[15px] font-extrabold text-slate-900 mb-1">
              {f.date} — {f.area || "?"}
            </div>
            <div
              className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded border bg-white ${tone.border} ${tone.text}`}
            >
              M{f.severity || "?"} · {tone.en}
            </div>
          </div>
          <p className="text-[14px] leading-snug text-slate-900 rounded px-3 py-2 bg-yellow-100/70 border-l-4 border-yellow-500 mb-2 font-semibold">
            {f.desc || "—"}
          </p>
          {f.photo && (
            <div className="text-[10.5px] text-slate-600">
              <span className="font-semibold">Photo ref:</span> {f.photo}
            </div>
          )}
          {tier === "high" && (
            <div className="mt-2 text-[10px] font-bold text-red-700 leading-tight">
              ⚠ REQUIRES
              <br />
              IMMEDIATE
              <br />
              ATTENTION
            </div>
          )}
        </div>

        <div className="col-span-2 p-3">
          {f.photos && f.photos.length > 0 ? (
            <div className="photo-list flex flex-wrap gap-2">
              {f.photos.map((p) =>
                // URL rỗng nghĩa là ảnh có trong CSDL nhưng ký URL hỏng. Nếu
                // vẫn dựng thẻ <img> thì nó hiện ra khoảng trắng và người đọc
                // tưởng phát hiện này vốn không có ảnh.
                p.url ? (
                  <div key={p.id} className="photo-item avoid-break flex-1 min-w-[200px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt="evidence"
                      className="w-full h-auto rounded block"
                      style={{ maxHeight: "150mm", objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="photo-item avoid-break flex-1 min-w-[200px] rounded border border-dashed border-red-300 bg-red-50 text-center py-6 px-2"
                  >
                    <div className="text-[11px] font-bold text-red-700">Không tải được ảnh</div>
                    <div className="text-[10px] text-red-500 italic">Photo failed to load</div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-slate-400 italic text-[11px] text-center py-8">
              No photos attached / Không có ảnh
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
