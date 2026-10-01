import type { DatedFinding } from "@/lib/final-report";
import { severityTier, TIER } from "@/components/print/shared";
import { displayArea } from "@/lib/area-label";
import { PHOTO_SIZES } from "@/lib/project-info";
import { parsePhotoRef } from "@/lib/photo-ref";

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
  photoSize = PHOTO_SIZES.default,
}: {
  f: DatedFinding & { turbine?: string };
  showTurbine?: boolean;
  /** Cỡ ảnh của cả bản in, do FinalReportView quyết định theo trụ. */
  photoSize?: { cols: number; height: string };
}) {
  const tier = severityTier(f.severity);
  // Tên file trong thư mục ảnh gốc, ghép 1-1 và xếp cùng thứ tự với f.photos
  // (cả hai đều theo created_at), nên tên thứ n là của tấm thứ n.
  const tenAnh = parsePhotoRef(f.photo).names;
  const tone = TIER[tier];

  return (
    /* Nền trắng như giấy, chỉ còn vạch màu ở mép trái báo mức độ. Trước đây
       cả khung tô nền đỏ/cam/xanh theo mức, cộng với ô diễn giải bôi vàng —
       một trang mười phát hiện là mười mảng màu, trông như trang web chứ
       không như báo cáo kỹ thuật. */
    /* `overflow-hidden` đã bỏ: nó tạo một ngữ cảnh định dạng riêng khiến
       Chrome bỏ qua break-inside khi in, và phát hiện bị cắt đôi giữa hai
       trang. Bo góc mất một chút, đổi lại khối luôn nằm trọn một trang. */
    <div className={`finding-card avoid-break rounded-sm border border-slate-300 bg-white ${tone.border} border-l-4`}>
      <div className="grid grid-cols-3 gap-0 print:gap-0">
        <div className="col-span-1 p-2.5 border-r" style={{ borderRightColor: "rgba(0,0,0,0.08)" }}>
          <div className="mb-2">
            {showTurbine && f.turbine && (
              <div className="text-[9.5px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                {f.turbine}
              </div>
            )}
            <div className="text-[12.5px] font-extrabold text-slate-900 mb-1">
              {f.date} — {displayArea(f.area) || "?"}
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
          {/* Tên file gốc in dưới từng tấm ảnh bên phải, nên ở đây chỉ còn
              việc báo khi số tên không khớp số ảnh — lúc đó không biết tên
              nào ứng với tấm nào, và người đọc cần biết điều đó. */}
          {tenAnh.length > 0 && tenAnh.length !== (f.photos?.length ?? 0) && (
            <div className="text-[9px] italic text-amber-700">
              Photo ref: {tenAnh.length} tên cho {f.photos?.length ?? 0} ảnh — chưa đối chiếu đủ
            </div>
          )}
          {tier === "high" && (
            <div className="mt-2 text-[8.5px] font-bold uppercase tracking-wide text-red-700 leading-tight">
              Requires immediate attention
            </div>
          )}
        </div>

        <div className="col-span-2 p-2.5">
          {f.photos && f.photos.length > 0 ? (
            /* Lưới ảnh nhỏ, 3 ảnh một hàng: một phát hiện thường có 2-5 ảnh,
               để cỡ lớn thì mỗi ảnh chiếm gần một trang và người đọc phải lật
               mới thấy hết. Ảnh dùng object-contain trong khung cao cố định
               nên không bị cắt xén — vẫn là ảnh chứng cứ, chỉ nhỏ lại. */
            /* Số cột đặt qua tên lớp vì khi in phải đổi cả bề rộng ô và
               ô nào kết thúc hàng; chiều cao đặt qua biến CSS. */
            <div
              className={`fr-photo-list cols-${photoSize.cols}`}
              style={{ ["--fr-photo-h" as string]: photoSize.height }}
            >
              {f.photos.map((p, i) =>
                // URL rỗng nghĩa là ảnh có trong CSDL nhưng ký URL hỏng. Nếu
                // vẫn dựng thẻ <img> thì nó hiện ra khoảng trắng và người đọc
                // tưởng phát hiện này vốn không có ảnh.
                p.url ? (
                  <div key={p.id} className="fr-photo-item avoid-break">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt="evidence"
                      /* Nền trắng bằng màu giấy: ảnh nằm trong khung cao cố
                         định nên ảnh đứng hay ảnh ngang đều thừa ra hai bên;
                         trước đây chỗ thừa tô xám, in ra thành những mảng xám
                         lạc lõng giữa trang giấy trắng. Viền mảnh thay cho
                         mảng xám để vẫn thấy rõ mép ảnh. */
                      className="w-full rounded-sm block bg-white border border-slate-200"
                      style={{ height: photoSize.height, objectFit: "contain" }}
                    />
                    {tenAnh[i] && (
                      <div className="font-mono text-[7.5px] leading-tight text-slate-500 break-all">
                        {tenAnh[i]}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="fr-photo-item avoid-break rounded border border-dashed border-red-300 bg-red-50 text-center px-1 flex flex-col justify-center"
                    style={{ height: photoSize.height }}
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
