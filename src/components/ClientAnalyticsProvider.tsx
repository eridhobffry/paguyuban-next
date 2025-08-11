"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { maybeCreateAnalytics } from "@/lib/analytics/client";

export default function ClientAnalyticsProvider() {
  const analyticsRef = useRef(maybeCreateAnalytics());
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Start session on first mount
  useEffect(() => {
    if (!analyticsRef.current) return;
    analyticsRef.current.startSession();
  }, []);

  // Track page_view on route changes
  useEffect(() => {
    if (!analyticsRef.current) return;
    analyticsRef.current.track("page_view", {
      metadata: { query: searchParams?.toString() || undefined },
    });
  }, [pathname, searchParams]);

  // Heartbeat every 15s while tab is visible; pause when hidden
  useEffect(() => {
    if (!analyticsRef.current) return;
    let interval: number | undefined;
    function start() {
      stop();
      interval = window.setInterval(() => {
        analyticsRef.current?.track("heartbeat");
      }, 15000);
    }
    function stop() {
      if (interval) window.clearInterval(interval);
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  // Minimal click tracking (sanitized)
  useEffect(() => {
    if (!analyticsRef.current) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const role = target.getAttribute("role") || undefined;
      const text = (target.textContent || "").trim().slice(0, 80) || undefined;
      analyticsRef.current?.track("click", {
        element: tag,
        metadata: { role, text },
      });
    }
    const options: AddEventListenerOptions = { capture: true };
    document.addEventListener("click", onClick, options);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  // Event bridge: allow other components to dispatch analytics events
  useEffect(() => {
    if (!analyticsRef.current) return;
    function onCustom(e: Event) {
      const ce = e as CustomEvent<{
        type: string;
        data?: Record<string, unknown>;
      }>;
      if (!ce?.detail?.type) return;
      analyticsRef.current?.track(ce.detail.type, ce.detail.data);
    }
    window.addEventListener(
      "analytics-track" as unknown as string,
      onCustom as EventListener
    );
    return () => {
      window.removeEventListener(
        "analytics-track" as unknown as string,
        onCustom as EventListener
      );
    };
  }, []);

  return null;
}
