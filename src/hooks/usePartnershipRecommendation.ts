import { useCallback, useRef, useState } from "react";
import type {
  PartnershipRecommendationResponse,
  RecommendOptions,
} from "@/lib/partnership";
import { recommendPartnership } from "@/lib/partnership";

export type UsePartnershipRecommendation = {
  data: PartnershipRecommendationResponse | null;
  loading: boolean;
  error: Error | null;
  generate: (
    opts?: Omit<RecommendOptions, "signal">
  ) => Promise<PartnershipRecommendationResponse | null>;
  abort: () => void;
  reset: () => void;
};

export function usePartnershipRecommendation(
  applicationId: string | null | undefined,
  defaultOptions: Omit<RecommendOptions, "signal"> = {}
): UsePartnershipRecommendation {
  const [data, setData] = useState<PartnershipRecommendationResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback<
    UsePartnershipRecommendation["generate"]
  >(async (opts = {}) => {
    if (!applicationId) {
      const err = new Error("applicationId is required");
      setError(err);
      return null;
    }

    // Cancel any inflight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await recommendPartnership(applicationId, {
        ...defaultOptions,
        ...opts,
        signal: controller.signal,
      });
      setData(result);
      return result;
    } catch (e: unknown) {
      // Handle aborts from fetch/AbortController in browsers
      if (e instanceof DOMException && e.name === "AbortError") return null;
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applicationId, defaultOptions]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, generate, abort, reset };
}
