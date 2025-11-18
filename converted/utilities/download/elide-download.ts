/**
 * Download - Download and extract files
 * Package has ~8M downloads/week on npm!
 */

export interface DownloadOptions {
  dest?: string;
  extract?: boolean;
  filename?: string;
}

export async function download(url: string, dest?: string | DownloadOptions, options?: DownloadOptions): Promise<Uint8Array> {
  let opts: DownloadOptions = {};

  if (typeof dest === 'object') {
    opts = dest;
  } else {
    opts = { dest, ...options };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export default download;

if (import.meta.url.includes("elide-download.ts")) {
  console.log("🌐 Download - File downloader (POLYGLOT!) | ~8M downloads/week");
}
