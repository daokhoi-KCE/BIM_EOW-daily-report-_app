"use client";

export default function SelectAllToggle() {
  return (
    <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
      <input
        type="checkbox"
        defaultChecked
        onChange={(e) => {
          const form = e.currentTarget.closest("form");
          form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((cb) => {
            cb.checked = e.currentTarget.checked;
          });
        }}
      />
      Chọn tất cả / Select all
    </label>
  );
}
