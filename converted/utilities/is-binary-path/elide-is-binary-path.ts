/**
 * is-binary-path - Check if File Path is Binary
 *
 * Check if a file path points to a binary file based on extension.
 * **POLYGLOT SHOWCASE**: Binary path detection across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-binary-path (~10M+ downloads/week)
 *
 * Package has ~10M+ downloads/week on npm!
 */

const binaryExts = new Set([
  '3dm', '3ds', '3g2', '3gp', '7z', 'a', 'aac', 'adp', 'ai', 'aif', 'apk', 'ar', 'asf',
  'au', 'avi', 'bmp', 'bz2', 'cab', 'caf', 'cgm', 'class', 'cmx', 'cpio', 'cur', 'dat',
  'deb', 'dll', 'dmg', 'doc', 'docx', 'dra', 'dsk', 'dts', 'dvb', 'dwg', 'dxf', 'eot',
  'epub', 'exe', 'f4v', 'fla', 'flac', 'fli', 'flv', 'fpx', 'gif', 'gz', 'gzip', 'h261',
  'h263', 'h264', 'ico', 'ief', 'img', 'ipa', 'iso', 'jar', 'jpeg', 'jpg', 'jpgv', 'jxr',
  'ktx', 'lha', 'lz', 'lzh', 'lzma', 'lzo', 'm4a', 'm4v', 'mdi', 'mid', 'midi', 'mj2',
  'mka', 'mkv', 'mmr', 'mng', 'mov', 'mp3', 'mp4', 'mpeg', 'mpg', 'mpga', 'nef', 'npx',
  'o', 'odp', 'ods', 'odt', 'oga', 'ogg', 'ogv', 'otf', 'pbm', 'pcx', 'pdf', 'pgm', 'pic',
  'png', 'pnm', 'ppm', 'ppt', 'pptx', 'psd', 'pya', 'pyc', 'pyo', 'qt', 'rar', 'ras',
  'raw', 'rgb', 'rip', 'rlc', 'rmvb', 'rpm', 'rtf', 's3m', 's7z', 'sgi', 'sil', 'sketch',
  'smv', 'so', 'stl', 'sub', 'swf', 'tar', 'tbz', 'tbz2', 'tga', 'tgz', 'tif', 'tiff',
  'tlz', 'ttc', 'ttf', 'txz', 'udf', 'vob', 'war', 'wav', 'wbmp', 'webm', 'webp', 'whl',
  'wim', 'wm', 'wma', 'wmv', 'woff', 'woff2', 'xbm', 'xls', 'xlsx', 'xpm', 'xz', 'z',
  'zip', 'zipx'
]);

export function isBinaryPath(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext ? binaryExts.has(ext) : false;
}

export default isBinaryPath;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔍 is-binary-path (POLYGLOT!)\\n");
  console.log("isBinaryPath('image.png'):", isBinaryPath('image.png'));
  console.log("isBinaryPath('script.js'):", isBinaryPath('script.js'));
  console.log("isBinaryPath('archive.zip'):", isBinaryPath('archive.zip'));
  console.log("isBinaryPath('readme.md'):", isBinaryPath('readme.md'));
  console.log("\\n🚀 ~10M+ downloads/week on npm!");
}
