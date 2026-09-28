import { NAVY } from "@/lib/theme";
import { SectionTitle } from "@/components/print/shared";
import { INSPECTION_COMPANY, PROJECT } from "@/lib/project-info";

export const REMINDER_ANCHOR = "reminder";

function Dieu({ children }: { children: React.ReactNode }) {
  return (
    <p className="prose-doc text-[11px] leading-relaxed text-justify text-slate-800 mt-2">
      {children}
    </p>
  );
}

/**
 * Lưu ý cuối báo cáo: khuyến nghị khắc phục và giới hạn trách nhiệm.
 *
 * Bộ khung lấy theo phần "Reminder" của báo cáo kiểm định UL/GIM, nhưng mọi
 * chỗ nêu tên đơn vị kiểm tra đều là MB WIND, và khách hàng là chủ đầu tư
 * BIM — không phải ngược lại. Đây là phần nói ai chịu trách nhiệm đến đâu,
 * nên nhầm tên là nhầm nghĩa.
 */
export default function ReminderNote({ issueDate }: { issueDate: string }) {
  const MB = INSPECTION_COMPANY.name;
  return (
    <section id={REMINDER_ANCHOR} className="scroll-mt-16">
      <SectionTitle en="Reminder" vi="Lưu ý" compact />

      <Dieu>
        It is recommended that the operator has all defects and nonconformities corrected, following
        the maintenance manuals and standards specific to the WTG model and to the components
        concerned.
      </Dieu>
      <Dieu>
        The defects and deviations described in this report have to be repaired in an appropriate
        way, and the major risks to the safe operation of the wind turbine must be effectively
        removed by appropriate actions.
      </Dieu>
      <Dieu>
        Repairs shall be carried out by the owner or the manufacturer of the wind turbine, or by a
        third party authorised by the manufacturer.
      </Dieu>
      <Dieu>
        {MB} does not assume any liability with respect to the safe operation of the inspected wind
        turbine at any time. The recommendations given in this report reflect {MB}&apos;s opinion,
        based on general and specific technical experience and on the state of the art of wind
        turbine technology. As far as it is possible to do so in compliance with safety
        requirements, the visual inspection is performed &ldquo;as seen&rdquo;, with the resources,
        tools and means available at the time of inspection. There is no guarantee that all relevant
        observations have been made.
      </Dieu>
      <Dieu>
        When taking corrective actions on the reported items, the performing party must carry out
        its own assessment with regard to the adequacy of each specific measure. {MB} cannot be held
        responsible for the implementation of any corrective measure by a third party.
      </Dieu>

      <p className="prose-doc text-[9.5px] italic text-slate-500 leading-relaxed text-justify mt-3">
        Khuyến nghị chủ đầu tư cho khắc phục toàn bộ khiếm khuyết và điểm không phù hợp nêu trong
        báo cáo, theo đúng tài liệu bảo trì và tiêu chuẩn của model tuabin cùng các cụm thiết bị
        liên quan. Việc sửa chữa do chủ đầu tư, nhà sản xuất, hoặc bên thứ ba được nhà sản xuất uỷ
        quyền thực hiện. {MB} không nhận trách nhiệm về việc vận hành an toàn của tuabin tại bất kỳ
        thời điểm nào; các khuyến nghị trong báo cáo là ý kiến chuyên môn của {MB} dựa trên kinh
        nghiệm kỹ thuật và hiện trạng công nghệ tuabin gió. Kiểm tra trực quan được thực hiện theo
        nguyên tắc &ldquo;thấy gì ghi nấy&rdquo;, trong phạm vi phương tiện và dụng cụ có được tại
        thời điểm kiểm tra, nên không bảo đảm đã ghi nhận được mọi điểm cần lưu ý. Khi khắc phục,
        bên thực hiện phải tự đánh giá mức độ phù hợp của từng biện pháp; {MB} không chịu trách
        nhiệm về việc bên thứ ba triển khai các biện pháp đó.
      </p>

      {/* Phần ký: đơn vị kiểm tra bên trái, khách hàng và ngày bên phải. */}
      <div
        className="avoid-break flex items-start justify-between gap-6 mt-5 pt-3"
        style={{ borderTop: `1px solid ${NAVY}` }}
      >
        <div>
          <div className="text-[11px] font-bold" style={{ color: NAVY }}>
            {INSPECTION_COMPANY.legalName}
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            Inspection company <span className="italic">/ Đơn vị kiểm tra</span>
          </div>
          <div className="mt-8 w-56 border-t border-slate-400" />
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold" style={{ color: NAVY }}>
            {PROJECT.owner}
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            Client <span className="italic">/ Khách hàng</span>
          </div>
          <div className="text-[9.5px] text-slate-600 mt-1.5">{issueDate}</div>
          <div className="mt-5 w-56 border-t border-slate-400 ml-auto" />
        </div>
      </div>
    </section>
  );
}
