import type { DatedFinding } from "@/lib/final-report";
import { severityTier, TIER } from "@/components/print/shared";

/**
 * Chiều cao khung ảnh trong mục phát hiện.
 *
 * Đặt bằng mm vì đích đến là bản in A4: ba ảnh một hàng, cao 34mm, nên một
 * phát hiện có 3 ảnh chiếm khoảng một phần tư chiều cao trang thay vì cả
 * trang như trước. Đây là con số duy nhất cần sửa nếu muốn ảnh to hay nhỏ
 * hơn; quy tắc khi in nằm ở `.fr-photo-item` trong globals.css.
 */
const PHOTO_BOX_HEIGHT = "34mm";

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
    /* Nền trắng như giấy, chỉ còn vạch màu ở mép trái báo mức độ. Trước đây
       cả khung tô nền đỏ/cam/xanh theo mức, cộng với ô diễn giải bôi vàng —
       một trang mười phát hiện là mười mảng màu, trông như trang web chứ
       không như báo cáo kỹ thuật. */
    <div className={`avoid-break rounded-sm border border-slate-300 bg-white ${tone.border} border-l-4 overflow-hidden`}>
      <div className="grid grid-cols-3 gap-0 print:gap-0">
        <div className="col-span-1 p-3 border-r" style={{ borderRightColor: "rgba(0,0,0,0.08)" }}>
          <div className="mb-2">
            {showTurbine && f.turbine && (
              <div className="text-[9.5px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                {f.turbine}
              </div>
            )}
            <div className="text-[12.5px] font-extrabold text-slate-900 mb-1">
              {f.date} — {f.area || "?"}
            </div>
            <div
              className={`inline-block text-[9.5px] font-bold px-2.5 py-1 rounded border bg-white ${tone.border} ${tone.text}`}
            >
              M{f.severity || "?"} · {tone.en}
            </div>
          </div>
          <p className="prose-doc text-[12px] leading-snug text-slate-900 mb-2">
            {f.desc || "—"}
          </p>
          {f.photo && (
            <div className="text-[9px] text-slate-600">
              <span className="font-semibold">Photo ref:</span> {f.photo}
            </div>
          )}
          {tier === "high" && (
            <div className="mt-2 text-[8.5px] font-bold uppercase tracking-wide text-red-700 leading-tight">
              Requires immediate attention
            </div>
          )}
        </div>

        <div className="col-span-2 p-3">
          {f.photos && f.photos.length > 0 ? (
            /* Lưới ảnh nhỏ, 3 ảnh một hàng: một phát hiện thường có 2-5 ảnh,
               để cỡ lớn thì mỗi ảnh chiếm gần một trang và người đọc phải lật
               mới thấy hết. Ảnh dùng object-contain trong khung cao cố định
               nên không bị cắt xén — vẫn là ảnh chứng cứ, chỉ nhỏ lại. */
            <div className="fr-photo-list">
              {f.photos.map((p) =>
                // URL rỗng nghĩa là ảnh có trong CSDL nhưng ký URL hỏng. Nếu
                // vẫn dựng thẻ <img> thì nó hiện ra khoảng trắng và người đọc
                // tưởng phát hiện này vốn không có ảnh.
                p.url ? (
                  <div key={p.id} className="fr-photo-item avoid-break">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt="evidence"
                      className="w-full rounded block bg-slate-100"
                      style={{ height: PHOTO_BOX_HEIGHT, objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="fr-photo-item avoid-break rounded border border-dashed border-red-300 bg-red-50 text-center px-1 flex flex-col justify-center"
                    style={{ height: PHOTO_BOX_HEIGHT }}
                  >
                    <div className="text-[9.5px] font-bold text-red-700">Không tải được ảnh</div>
                    <div className="text-[8.5px] text-red-500 italic">Photo failed to load</div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-slate-400 italic text-[9.5px] text-center py-4">
              No photos attached / Không có ảnh
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
