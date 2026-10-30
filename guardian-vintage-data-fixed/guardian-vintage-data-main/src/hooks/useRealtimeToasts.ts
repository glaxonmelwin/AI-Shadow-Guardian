import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function useRealtimeToasts() {
  const events = useQuery(api.dlp.getRecentEvents, { limit: 5 });
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!events) return;
    if (prevCountRef.current === 0) {
      prevCountRef.current = events.length;
      return;
    }
    if (events.length > prevCountRef.current) {
      const newest = events[0];
      if (newest) {
        const decision = newest.decision.toUpperCase();
        const sev = newest.severity.toUpperCase();
        if (newest.decision === "block") {
          toast.error(`⛔ BLOCKED: ${newest.reasons[0] || "Sensitive content detected"}`, {
            description: `${newest.employeeName} → ${newest.destination || "unknown"}`,
            duration: 6000,
          });
        } else if (newest.decision === "warn") {
          toast.warning(`⚠️ WARNING: ${newest.reasons[0] || "Content flagged"}`, {
            description: `${newest.employeeName} → ${newest.destination || "unknown"}`,
            duration: 5000,
          });
        } else {
          toast(`✅ Allowed: ${newest.contentSummary?.substring(0, 60)}`, {
            description: `${newest.employeeName} → ${newest.destination}`,
            duration: 3000,
          });
        }
      }
      prevCountRef.current = events.length;
    }
  }, [events]);
}
