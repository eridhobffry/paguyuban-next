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

  // Section tracking: visibility dwell, scroll depth, and exit position
  useEffect(() => {
    if (!analyticsRef.current) return;

    type SectionState = {
      element: Element;
      id: string;
      isVisible: boolean;
      visibleSinceMs: number | null;
      totalVisibleMs: number;
    };

    const sectionStates = new Map<string, SectionState>();
    let rafPending = false;
    let maxScrollDepthPct = 0;

    function updateMaxScrollDepth() {
      rafPending = false;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const viewportH = window.innerHeight || doc.clientHeight || 0;
      const docH = Math.max(
        doc.scrollHeight,
        doc.offsetHeight,
        doc.clientHeight
      );
      const depth = docH > 0 ? ((scrollTop + viewportH) / docH) * 100 : 0;
      if (depth > maxScrollDepthPct) maxScrollDepthPct = Math.min(100, depth);
    }

    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(updateMaxScrollDepth);
    }

    // Build observer on current page content
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>("main section[id]")
    );
    for (const el of candidates) {
      const id = el.id || el.getAttribute("data-section") || "section";
      sectionStates.set(id, {
        element: el,
        id,
        isVisible: false,
        visibleSinceMs: null,
        totalVisibleMs: 0,
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const id =
            target.id || target.getAttribute("data-section") || "section";
          const state = sectionStates.get(id);
          if (!state) continue;
          const isNowVisible = entry.intersectionRatio >= 0.4;
          if (isNowVisible && !state.isVisible) {
            // Become visible
            state.isVisible = true;
            state.visibleSinceMs = now;
          } else if (!isNowVisible && state.isVisible) {
            // Became hidden: compute dwell and emit event chunk if meaningful
            state.isVisible = false;
            const start = state.visibleSinceMs ?? now;
            const delta = Math.max(0, now - start);
            state.visibleSinceMs = null;
            state.totalVisibleMs += delta;
            if (delta >= 1000) {
              void analyticsRef.current?.track("section_visible", {
                section: id,
                metadata: {
                  dwell_ms_chunk: Math.round(delta),
                  dwell_ms_total: Math.round(state.totalVisibleMs),
                  visibility: "hidden",
                },
              });
            }
          }
        }
      },
      { threshold: [0, 0.4, 1] }
    );

    // Observe candidates
    for (const s of sectionStates.values()) observer.observe(s.element);

    // Scroll depth listener
    const scrollOpts: AddEventListenerOptions & EventListenerOptions = {
      passive: true,
      capture: false,
    };
    window.addEventListener("scroll", onScroll, scrollOpts);
    // Initialize once
    updateMaxScrollDepth();

    // Flush on page hide/unload and route change
    function flushVisible(reason: "pagehide" | "visibilitychange" | "route") {
      const now = performance.now();
      for (const state of sectionStates.values()) {
        if (state.isVisible && state.visibleSinceMs !== null) {
          const delta = Math.max(0, now - state.visibleSinceMs);
          state.totalVisibleMs += delta;
          state.isVisible = false;
          state.visibleSinceMs = null;
          if (delta >= 250) {
            void analyticsRef.current?.track("section_visible", {
              section: state.id,
              metadata: {
                dwell_ms_chunk: Math.round(delta),
                dwell_ms_total: Math.round(state.totalVisibleMs),
                visibility: reason,
              },
            });
          }
        }
      }
      // Exit position once
      void analyticsRef.current?.track("exit_position", {
        metadata: {
          scroll_depth_pct_max: Math.round(maxScrollDepthPct),
          y: Math.round(window.scrollY || 0),
          viewport_h: Math.round(window.innerHeight || 0),
          doc_h: Math.round(document.documentElement.scrollHeight || 0),
        },
      });
    }

    function onVisibilityChange() {
      if (document.hidden) flushVisible("visibilitychange");
    }

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", () => flushVisible("pagehide"));

    return () => {
      // Cleanup
      window.removeEventListener(
        "scroll",
        onScroll,
        false as unknown as EventListenerOptions
      );
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", () => flushVisible("pagehide"));
      observer.disconnect();
    };
    // Rebuild when route changes so we observe new sections
  }, [pathname]);

  return null;
}
