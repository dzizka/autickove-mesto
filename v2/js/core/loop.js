// Guarded game loop (DESIGN-v2 §3). One failing frame must never freeze a game:
// the error is logged, the frame is skipped and the loop continues. After more than
// MAX_CONSECUTIVE_ERRORS failing frames in a row the loop stops and calls onCrash.

export const MAX_CONSECUTIVE_ERRORS = 30;
const MAX_DT = 0.05; // seconds; avoids huge jumps after a tab switch or a slow frame

/** Totals across all loops, read by tests via window.__game.loopStats. */
export const loopStats = { caughtErrors: 0, crashes: 0 };

/**
 * @param {object} opts
 * @param {(dt:number, time:number) => void} [opts.update]  dt in seconds, clamped
 * @param {(time:number) => void} [opts.draw]
 * @param {(lastError:Error) => void} [opts.onCrash]
 * @param {boolean} [opts.pauseWhenHidden=true]
 */
export function createLoop({ update, draw, onCrash, pauseWhenHidden = true } = {}) {
  let rafId = 0;
  let running = false;
  let last = 0;
  let consecutive = 0;
  let elapsed = 0;

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    let dt = last ? (now - last) / 1000 : 0;
    last = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, MAX_DT);
    elapsed += dt;
    try {
      update?.(dt, elapsed);
      draw?.(elapsed);
      consecutive = 0;
    } catch (err) {
      consecutive++;
      loopStats.caughtErrors++;
      console.error(`[loop] frame failed (${consecutive} in a row)`, err);
      if (consecutive > MAX_CONSECUTIVE_ERRORS) {
        loopStats.crashes++;
        stop();
        try {
          onCrash?.(err);
        } catch (crashErr) {
          console.error("[loop] onCrash failed", crashErr);
        }
      }
    }
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (running && !rafId) {
      last = 0;
      rafId = requestAnimationFrame(frame);
    }
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    consecutive = 0;
    if (pauseWhenHidden) document.addEventListener("visibilitychange", onVisibility);
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
    document.removeEventListener("visibilitychange", onVisibility);
  }

  return {
    start,
    stop,
    get running() {
      return running;
    },
    get elapsed() {
      return elapsed;
    },
  };
}
