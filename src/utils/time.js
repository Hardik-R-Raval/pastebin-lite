// src/utils/time.js
export function getNowMs(req) {
  // If TEST_MODE is enabled and header is set, use that
  if (process.env.TEST_MODE === "1") {
    const header = req.headers["x-test-now-ms"];
    if (header) return Number(header);
  }
  // Otherwise use real system time
  return Date.now();
}

export function nowDate(req) {
  return new Date(getNowMs(req));
}
