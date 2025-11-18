/**
 * React Dropzone - File Upload Component
 *
 * Simple React hook to create a HTML5-compliant drag'n'drop zone for files.
 * **POLYGLOT SHOWCASE**: File uploads for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-dropzone (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class useDropzone {
  static create(options?: { accept?: string; multiple?: boolean }): {
    getRootProps: () => { className: string };
    getInputProps: () => { type: string; accept?: string; multiple?: boolean };
    isDragActive: boolean;
  } {
    return {
      getRootProps: () => ({ className: 'dropzone' }),
      getInputProps: () => ({ type: 'file', accept: options?.accept, multiple: options?.multiple }),
      isDragActive: false
    };
  }
}

export function renderDropzone(options?: { accept?: string; multiple?: boolean }): string {
  return `<div class="dropzone" style="border: 2px dashed #ccc; padding: 20px; text-align: center">
  <input type="file" ${options?.accept ? `accept="${options.accept}"` : ''} ${options?.multiple ? 'multiple' : ''} />
  <p>Drag & drop files here, or click to select files</p>
</div>`;
}

export default { useDropzone, renderDropzone };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Dropzone - File Upload (POLYGLOT!)\n");
  console.log(renderDropzone({ accept: 'image/*', multiple: true }));
  console.log("\n🚀 ~1M+ downloads/week!");
}
