"use client";

import { useEffect, useRef, useState } from "react";
import { getWorkloadLogs, type LogLineDTO } from "@/lib/api/logs";

const LOG_POLL_MS = 5_000;

function streamColor(stream: "stdout" | "stderr" | string) {
  return stream === "stderr" ? "text-red-400/80" : "text-white/70";
}

export function LogViewer({
  workloadId,
  projectID,
}: {
  workloadId: string;
  projectID: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LogLineDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const autoScroll = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLines([]);
    autoScroll.current = true;

    const fetch = () => {
      getWorkloadLogs(projectID, workloadId)
        .then((res) => {
          if (cancelled) return;
          setLines(res.lines ?? []);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetch();
    const id = setInterval(fetch, LOG_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [workloadId, projectID]);

  useEffect(() => {
    if (autoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [lines]);

  return (
    <div
      className="h-full overflow-y-auto bg-[#0a0c10] font-mono text-[11px] leading-5"
      onScroll={(e) => {
        const el = e.currentTarget;
        autoScroll.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      }}
    >
      <div className="p-4 pb-6">
        {loading && (
          <p className="animate-pulse text-white/25">Loading logs…</p>
        )}
        {!loading && lines.length === 0 && (
          <p className="text-white/25">
            No logs yet. Logs appear within ~5 seconds of output.
          </p>
        )}
        {lines.map((l) => (
          <div key={l.id} className="flex gap-3 py-[1px]">
            <span className="w-16 shrink-0 select-none text-white/25">
              {new Date(l.ts).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className={streamColor(l.stream)}>{l.line}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
