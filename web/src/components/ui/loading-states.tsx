/**
 * -----------------
 * A small set of reusable loading/feedback primitives:
 * - LoadingSpinner: lightweight Lucide-based spinner with ARIA status.
 * - LoadingProgress: Progress bar with optional label (uses ui/progress wrapper).
 * - LoadingButtonContent: Drop-in content for buttons (idle/pending/success/error labels + inline progress line).
 * - TimeoutNotice: Inline banner for timeouts with Retry/Cancel actions.
 * */

"use client";

import type React from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, XCircle, CircleAlert } from "lucide-react";
import type { LoadingPhase } from "../../hooks/use-loading-state";

/** Small inline spinner with accessible status semantics. */
type SpinnerProps = {
  size?: number;
  className?: string;
  "aria-label"?: string;
};
export function LoadingSpinner({
  size = 16,
  className = "",
  ...rest
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      {...rest}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
    </div>
  );
}

// Thin progress bar with optional label above it.

type LoadingProgressProps = {
  value?: number;
  label?: string;
  className?: string;
};
export function LoadingProgress({
  value,
  label,
  className = "",
}: LoadingProgressProps) {
  const val =
    typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="mb-1 text-xs text-gray-400" aria-live="polite">
          {label}
        </div>
      ) : null}
      <Progress value={val} />
    </div>
  );
}

/**
 * Button-friendly content that switches icon/text per phase.
 * Optionally shows a thin inline progress line when pending.
 */
type LoadingButtonContentProps = {
  phase: LoadingPhase;
  idleIcon?: React.ReactNode;
  pendingIcon?: React.ReactNode;
  successIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  idleLabel: string;
  pendingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  progress?: number;
};
export function LoadingButtonContent({
  phase,
  idleIcon,
  pendingIcon,
  successIcon,
  errorIcon,
  idleLabel,
  pendingLabel = "Working...",
  successLabel = "Done",
  errorLabel = "Try Again",
  progress,
}: LoadingButtonContentProps) {
  const showLine = phase === "pending" && typeof progress === "number";
  return (
    <span className="flex flex-col items-center justify-center">
      {/* Icon + label line */}
      <span className="flex items-center gap-2">
        {phase === "idle" && idleIcon}
        {phase === "pending" &&
          (pendingIcon ?? <LoadingSpinner size={16} aria-label="Loading" />)}
        {phase === "success" &&
          (successIcon ?? (
            <CheckCircle2 className="text-green-400" size={16} />
          ))}
        {phase === "error" &&
          (errorIcon ?? <XCircle className="text-red-400" size={16} />)}
        <span className="text-sm font-medium">
          {phase === "idle" && idleLabel}
          {phase === "pending" && pendingLabel}
          {phase === "success" && successLabel}
          {phase === "error" && errorLabel}
          {phase === "timeout" && "Taking longer..."}
        </span>
      </span>

      {/* Optional inline progress line for extra feedback while pending */}
      {showLine ? (
        <span className="mt-1 h-0.5 w-24 overflow-hidden rounded bg-gray-700">
          <span
            className="block h-full bg-purple-500 transition-all"
            style={{
              width: `${
                typeof progress === "number" && Number.isFinite(progress)
                  ? Math.max(10, Math.min(100, progress))
                  : 10
              }%`,
            }}
          />
        </span>
      ) : null}
    </span>
  );
}

/**
 * Inline notice specifically for timeouts with two clear actions:
 * - Retry: triggers the last runner again
 * - Cancel: resets the loading state
 */
type TimeoutNoticeProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onCancel?: () => void;
};
export function TimeoutNotice({
  title = "This is taking longer than expected",
  description = "Network latency or wallet interaction might be delaying the operation.",
  onRetry,
  onCancel,
}: TimeoutNoticeProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-md border border-amber-700/40 bg-amber-900/20 p-3 text-amber-200"
    >
      <CircleAlert size={18} className="mt-0.5 flex-shrink-0 text-amber-400" />
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-amber-300">{description}</div>
        <div className="mt-2 flex gap-2">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-500"
            >
              Retry
            </button>
          ) : null}
          {onCancel ? (
            <button
              onClick={onCancel}
              className="rounded border border-amber-600/60 px-3 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-600/10"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
