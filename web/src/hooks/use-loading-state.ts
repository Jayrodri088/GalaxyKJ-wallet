/**
 * -----------------
 * A small, opinionated state machine hook for long-running operations.
 * It provides:
 * - Phased states: idle, pending, success, error, timeout
 * - Descriptive labels/sub-labels for ARIA-friendly feedback
 * - Determinate progress (0–100) with optional indeterminate simulation
 * - Absolute timeout handling with retry support
 *
 * Usage:
 * const loading = useLoadingState(15000);
 * await loading.withTimeout(async () => { ... }, {
 *   labels: { pending: "Submitting...", success: "Done" },
 *   onSuccess: () => loading.update({ progress: 100 }),
 *   onTimeout: () => console.log("Slow network"),
 *   mapError: (e) => "Friendly message for UI"
 * });
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Discrete phases for an operation lifecycle. */
export type LoadingPhase = "idle" | "pending" | "success" | "error" | "timeout";

/** Public state exposed by the hook. */
export type LoadingState = {
  phase: LoadingPhase;
  label?: string;
  sublabel?: string;
  progress: number; // 0-100; determinate. You can simulate indeterminate by ticking in start().
  error?: string | null;
  timedOut: boolean;
};

/** Options passed when starting an operation. */
export type StartOptions = {
  label?: string;
  sublabel?: string;
  indeterminate?: boolean; // Simulate progress climbing toward ~90% while waiting
};

/** Options for incremental updates during an operation. */
export type UpdateOptions = {
  progress?: number;
  label?: string;
  sublabel?: string;
};

/** Options used by withTimeout to wrap your async runner. */
export type WithTimeoutOptions<T = unknown> = {
  timeoutMs?: number;
  onTimeout?: () => void;
  mapError?: (err: unknown) => string;
  onSuccess?: (result: T) => void | Promise<void>;
  labels?: {
    starting?: string;
    pending?: string;
    success?: string;
    timeout?: string;
    error?: string;
  };
};

/**
 * useLoadingState
 * ---------------
 * The defaultTimeoutMs applies when withTimeout is used without an explicit timeoutMs.
 */
export function useLoadingState(defaultTimeoutMs = 15000) {
  // Central state for the lifecycle and progress.
  const [state, setState] = useState<LoadingState>({
    phase: "idle",
    label: undefined,
    sublabel: undefined,
    progress: 0,
    error: null,
    timedOut: false,
  });

  // We store the last async runner so we can retry it later (e.g., after a timeout).
  const lastRunnerRef = useRef<null | (() => Promise<unknown>)>(null);

  // Timers for indeterminate progress ticking and absolute timeout enforcement.
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  // Clean up timers when unmounted to avoid state updates on unmounted components.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimers();
    };
  }, []);

  /** Clear any pending timers (progress tick or timeout). */
  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Don't clear tickIntervalRef here - it should only be cleared when operation completes
  };

  /**
   * Move to "pending" and optionally start simulated indeterminate progress.
   * Use this if you manually orchestrate phases; otherwise withTimeout calls this for you.
   */
  const start = useCallback((opts?: StartOptions) => {
    clearTimers();
    setState((s) => ({
      ...s,
      phase: "pending",
      label: opts?.label ?? s.label,
      sublabel: opts?.sublabel ?? s.sublabel,
      progress: 0,
      error: null,
      timedOut: false,
    }));

    if (opts?.indeterminate) {
      // Simulate smooth progress toward ~90% while we wait.
      tickIntervalRef.current = setInterval(() => {
        setState((s) => {
          if (s.phase !== "pending") return s;
          const next = Math.min(90, s.progress + Math.random() * 7 + 1);
          return { ...s, progress: next };
        });
      }, 350);
    }
  }, []);

  /** Update label/sublabel and/or determinate progress. */
  const update = useCallback((opts: UpdateOptions) => {
    setState((s) => ({
      ...s,
      label: opts.label ?? s.label,
      sublabel: opts.sublabel ?? s.sublabel,
      progress:
        typeof opts.progress === "number" && Number.isFinite(opts.progress)
          ? Math.max(0, Math.min(100, opts.progress))
          : s.progress,
    }));
  }, []);

  /** Transition to success; progress becomes 100. */
  const succeed = useCallback((label?: string) => {
    clearTimers();
    setState((s) => ({
      ...s,
      phase: "success",
      label: label ?? s.label,
      progress: 100,
      error: null,
      timedOut: false,
    }));
  }, []);

  /** Transition to error; message is captured for UI. */
  const fail = useCallback((errorMessage?: string, label?: string) => {
    clearTimers();
    setState((s) => ({
      ...s,
      phase: "error",
      label: label ?? s.label,
      error: errorMessage ?? "Something went wrong",
      timedOut: false,
    }));
  }, []);

  /** Transition to timeout; used when an operation exceeds time budget. */
  const timeout = useCallback((label?: string) => {
    clearTimers();
    setState((s) => ({
      ...s,
      phase: "timeout",
      label: label ?? s.label,
      timedOut: true,
    }));
  }, []);

  /** Reset to initial state; clears retry pointer as well. */
  const reset = useCallback(() => {
    clearTimers();
    setState({
      phase: "idle",
      label: undefined,
      sublabel: undefined,
      progress: 0,
      error: null,
      timedOut: false,
    });
    lastRunnerRef.current = null;
  }, []);

  /**
   * Wrap any async function with:
   * - start() + indeterminate simulation
   * - an absolute timeout that moves to "timeout" phase
   * - success/error labeling and progress behavior
   * - retry persistence
   */
  const withTimeout = useCallback(
    async <T>(runner: () => Promise<T>, options?: WithTimeoutOptions<T>) => {
      const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;

      // Persist the runner to support retry()
      lastRunnerRef.current = async () => withTimeout(runner, options);

      // Move into pending state with gentle simulated progress
      start({
        label: options?.labels?.starting ?? "Starting...",
        indeterminate: true,
      });

      // Enforce an absolute timeout that flips to "timeout" phase
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        timeout(options?.labels?.timeout ?? "Taking longer than usual");
        try {
          options?.onTimeout?.();
        } catch {
          // no-op: isolate onTimeout errors from breaking the flow
        }
      }, timeoutMs);

      try {
        // Provide a default pending label and a small determinate bump
        update({
          label: options?.labels?.pending ?? "Working...",
          progress: 15,
        });

        const result = await runner();

        if (!isMounted.current) return result;
        await options?.onSuccess?.(result);
        succeed(options?.labels?.success ?? "Done");
        return result;
      } catch (err) {
        if (!isMounted.current) throw err;
        const message =
          options?.mapError?.(err) ??
          (err instanceof Error ? err.message : "Unexpected error");
        fail(message, options?.labels?.error ?? "Error");
        throw err;
      } finally {
        // Always clear timers whether success or failure
        clearTimers();
      }
    },
    [defaultTimeoutMs, fail, start, succeed, timeout, update]
  );

  /**
   * Re-run the last async operation (if any). Useful after timeout or error.
   */
  const retry = useCallback(() => {
    if (lastRunnerRef.current) return lastRunnerRef.current();
    return Promise.resolve();
  }, []);

  // Return the public API; memoize for stable references in child components.
  return useMemo(
    () => ({
      ...state,
      start,
      update,
      succeed,
      fail,
      timeout,
      reset,
      withTimeout,
      retry,
    }),
    [fail, reset, retry, start, state, succeed, timeout, update, withTimeout]
  );
}

export type UseLoadingStateReturn = ReturnType<typeof useLoadingState>;
