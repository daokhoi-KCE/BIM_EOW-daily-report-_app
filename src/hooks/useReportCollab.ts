"use client";

// Cộng tác nhiều người trên 1 báo cáo:
// - Presence (Supabase Realtime): ai đang mở báo cáo, ai đang sửa finding nào.
//   Lock tự giải phóng khi đóng tab / mất kết nối — không cần cột DB.
// - postgres_changes: merge thay đổi của người khác vào state cục bộ theo từng row.
//   Finding đang được chính mình sửa (focus) không bao giờ bị ghi đè.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  rowToFinding,
  rowToLock,
  rowToTurbine,
  reportRowToScalars,
} from "@/lib/db-mappers";
import type {
  ReportRow,
  TurbineWorkRow,
  LockScheduleRow,
  FindingRow,
  FindingPhotoRow,
  SitePhotoRow,
} from "@/lib/db-types";
import type { ReportDraft, Photo } from "@/lib/types";
import { signPhotoPath } from "@/lib/actions/reports";

export type Peer = {
  clientId: string;
  email: string;
  editing: string | null; // finding id đang sửa
};

type PresencePayload = { email: string; editing: string | null };

export function useReportCollab({
  reportId,
  setRep,
  dirtyRef,
}: {
  reportId: string;
  setRep: Dispatch<SetStateAction<ReportDraft>>;
  // true khi đang có thay đổi cục bộ chưa lưu — chặn merge các trường ngoài findings
  dirtyRef: { current: boolean };
}) {
  const supabase = useMemo(() => createClient(), []);
  const clientId = useMemo(() => crypto.randomUUID(), []);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [connected, setConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const editingRef = useRef<string | null>(null);
  const emailRef = useRef<string>("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Merge helpers ───────────────────────────────────────────

  const applyFindingUpsert = useCallback(
    (row: FindingRow) => {
      if (row.report_id !== reportId) return;
      if (editingRef.current === row.id) return; // mình đang sửa → không ghi đè
      setRep((r) => {
        const existing = r.findings.find((f) => f.id === row.id);
        const mapped = rowToFinding(row, existing?.photos ?? []);
        if (existing) {
          return { ...r, findings: r.findings.map((f) => (f.id === row.id ? mapped : f)) };
        }
        return { ...r, findings: [...r.findings, mapped] };
      });
    },
    [reportId, setRep],
  );

  const applyFindingDelete = useCallback(
    (id: string) => {
      setRep((r) =>
        r.findings.some((f) => f.id === id)
          ? { ...r, findings: r.findings.filter((f) => f.id !== id) }
          : r,
      );
    },
    [setRep],
  );

  const applyFindingPhotoInsert = useCallback(
    async (row: FindingPhotoRow) => {
      const url = await signPhotoPath(row.storage_path);
      if (!url) return;
      const photo: Photo = { id: row.id, storagePath: row.storage_path, url };
      setRep((r) => {
        const f = r.findings.find((x) => x.id === row.finding_id);
        if (!f || f.photos.some((p) => p.id === row.id)) return r; // finding khác báo cáo / ảnh đã có
        return {
          ...r,
          findings: r.findings.map((x) =>
            x.id === row.finding_id ? { ...x, photos: [...x.photos, photo] } : x,
          ),
        };
      });
    },
    [setRep],
  );

  const applyFindingPhotoDelete = useCallback(
    (id: string) => {
      setRep((r) =>
        r.findings.some((f) => f.photos.some((p) => p.id === id))
          ? {
              ...r,
              findings: r.findings.map((f) => ({
                ...f,
                photos: f.photos.filter((p) => p.id !== id),
              })),
            }
          : r,
      );
    },
    [setRep],
  );

  const applySitePhotoInsert = useCallback(
    async (row: SitePhotoRow) => {
      if (row.report_id !== reportId) return;
      const url = await signPhotoPath(row.storage_path);
      if (!url) return;
      setRep((r) =>
        r.photos.some((p) => p.id === row.id)
          ? r
          : { ...r, photos: [...r.photos, { id: row.id, storagePath: row.storage_path, url }] },
      );
    },
    [reportId, setRep],
  );

  const applySitePhotoDelete = useCallback(
    (id: string) => {
      setRep((r) =>
        r.photos.some((p) => p.id === id)
          ? { ...r, photos: r.photos.filter((p) => p.id !== id) }
          : r,
      );
    },
    [setRep],
  );

  // Các phần ngoài findings vẫn lưu theo kiểu "bản lưu cuối thắng"; chỉ merge
  // khi cục bộ không có thay đổi chưa lưu để tránh ghi đè lúc đang gõ.
  const applyReportUpdate = useCallback(
    (row: ReportRow) => {
      if (row.id !== reportId || dirtyRef.current) return;
      setRep((r) => ({ ...r, ...reportRowToScalars(row) }));
    },
    [reportId, setRep, dirtyRef],
  );

  const applyTurbineUpsert = useCallback(
    (row: TurbineWorkRow) => {
      if (row.report_id !== reportId || dirtyRef.current) return;
      setRep((r) => {
        const mapped = rowToTurbine(row);
        return r.turbines.some((t) => t.id === row.id)
          ? { ...r, turbines: r.turbines.map((t) => (t.id === row.id ? mapped : t)) }
          : { ...r, turbines: [...r.turbines, mapped] };
      });
    },
    [reportId, setRep, dirtyRef],
  );

  const applyTurbineDelete = useCallback(
    (id: string) => {
      if (dirtyRef.current) return;
      setRep((r) =>
        r.turbines.some((t) => t.id === id)
          ? { ...r, turbines: r.turbines.filter((t) => t.id !== id) }
          : r,
      );
    },
    [setRep, dirtyRef],
  );

  const applyLockUpsert = useCallback(
    (row: LockScheduleRow) => {
      if (row.report_id !== reportId || dirtyRef.current) return;
      setRep((r) => {
        const mapped = rowToLock(row);
        return r.locks.some((l) => l.id === row.id)
          ? { ...r, locks: r.locks.map((l) => (l.id === row.id ? mapped : l)) }
          : { ...r, locks: [...r.locks, mapped] };
      });
    },
    [reportId, setRep, dirtyRef],
  );

  const applyLockDelete = useCallback(
    (id: string) => {
      if (dirtyRef.current) return;
      setRep((r) =>
        r.locks.some((l) => l.id === id)
          ? { ...r, locks: r.locks.filter((l) => l.id !== id) }
          : r,
      );
    },
    [setRep, dirtyRef],
  );

  // ─── Channel lifecycle ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      emailRef.current = user?.email ?? "Người dùng khác";

      const filter = `report_id=eq.${reportId}`;
      const channel = supabase.channel(`report:${reportId}`, {
        config: { presence: { key: clientId } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<PresencePayload>();
          const others: Peer[] = [];
          for (const [key, metas] of Object.entries(state)) {
            if (key === clientId || metas.length === 0) continue;
            const m = metas[metas.length - 1];
            others.push({ clientId: key, email: m.email, editing: m.editing });
          }
          setPeers(others);
        })
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "findings", filter },
          (payload) => {
            if (payload.eventType === "DELETE") {
              applyFindingDelete((payload.old as { id: string }).id);
            } else {
              applyFindingUpsert(payload.new as FindingRow);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "finding_photos" },
          (payload) => {
            if (payload.eventType === "DELETE") {
              applyFindingPhotoDelete((payload.old as { id: string }).id);
            } else {
              void applyFindingPhotoInsert(payload.new as FindingPhotoRow);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_photos", filter },
          (payload) => {
            if (payload.eventType === "DELETE") {
              applySitePhotoDelete((payload.old as { id: string }).id);
            } else {
              void applySitePhotoInsert(payload.new as SitePhotoRow);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${reportId}` },
          (payload) => applyReportUpdate(payload.new as ReportRow),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "turbine_work", filter },
          (payload) => {
            if (payload.eventType === "DELETE") {
              applyTurbineDelete((payload.old as { id: string }).id);
            } else {
              applyTurbineUpsert(payload.new as TurbineWorkRow);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lock_schedule", filter },
          (payload) => {
            if (payload.eventType === "DELETE") {
              applyLockDelete((payload.old as { id: string }).id);
            } else {
              applyLockUpsert(payload.new as LockScheduleRow);
            }
          },
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            await channel.track({
              email: emailRef.current,
              editing: editingRef.current,
            } satisfies PresencePayload);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnected(false);
          }
        });

      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      if (blurTimer.current) clearTimeout(blurTimer.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, clientId, supabase]);

  // ─── Editing (lock) tracking ─────────────────────────────────

  const trackEditing = useCallback(
    (id: string | null) => {
      if (editingRef.current === id) return;
      editingRef.current = id;
      const ch = channelRef.current;
      if (ch && ch.state === "joined") {
        void ch.track({ email: emailRef.current, editing: id } satisfies PresencePayload);
      }
    },
    [],
  );

  // Gọi khi focus vào 1 finding card
  const onFindingFocus = useCallback(
    (id: string) => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      trackEditing(id);
    },
    [trackEditing],
  );

  // Gọi khi focus rời finding card — chờ 1.5s phòng khi chuyển giữa các ô trong cùng card
  const onFindingBlur = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => trackEditing(null), 1500);
  }, [trackEditing]);

  // finding id → email người khác đang sửa (null nếu không ai giữ)
  const lockedBy = useCallback(
    (findingId: string): string | null => {
      const p = peers.find((x) => x.editing === findingId);
      return p ? p.email : null;
    },
    [peers],
  );

  return { peers, connected, lockedBy, onFindingFocus, onFindingBlur };
}
