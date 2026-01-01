// Small helper for optional performance timing logs.
// Enabled when SPLITRAIL_UPLOAD_TIMING=1.
export function timingEnabled() {
  return process.env.SPLITRAIL_UPLOAD_TIMING === "1";
}

export function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
