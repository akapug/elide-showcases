/**
 * end-of-stream - Detect Stream End/Error
 *
 * Call a callback when a stream ends or errors.
 *
 * Package has ~120M+ downloads/week on npm!
 */

type Callback = (error?: Error) => void;

interface EndOfStreamOptions {
  readable?: boolean;
  writable?: boolean;
  error?: boolean;
}

function endOfStream(stream: any, options: EndOfStreamOptions | Callback, callback?: Callback): () => void {
  const opts = typeof options === 'function' ? {} : options;
  const cb = typeof options === 'function' ? options : callback;

  let ended = false;

  const cleanup = () => {
    if (ended) return;
    ended = true;

    if (stream.removeListener) {
      stream.removeListener('end', onEnd);
      stream.removeListener('finish', onFinish);
      stream.removeListener('error', onError);
      stream.removeListener('close', onClose);
    }
  };

  const onEnd = () => {
    cleanup();
    if (cb) cb();
  };

  const onFinish = () => {
    cleanup();
    if (cb) cb();
  };

  const onError = (error: Error) => {
    cleanup();
    if (cb) cb(error);
  };

  const onClose = () => {
    cleanup();
    if (cb) cb();
  };

  if (stream.on) {
    if (opts.readable !== false) {
      stream.on('end', onEnd);
    }
    if (opts.writable !== false) {
      stream.on('finish', onFinish);
    }
    if (opts.error !== false) {
      stream.on('error', onError);
    }
    stream.on('close', onClose);
  }

  return cleanup;
}

export default endOfStream;
export { endOfStream };

if (import.meta.url.includes("elide-end-of-stream.ts")) {
  console.log("📦 end-of-stream - Detect Stream End/Error\n");
  console.log("Call a callback when a stream ends or errors");
  console.log("\n🚀 ~120M+ downloads/week on npm");
}
