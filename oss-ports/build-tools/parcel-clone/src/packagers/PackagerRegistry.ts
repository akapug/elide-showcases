/**
 * Parcel Clone - Packager Registry
 */

import type { Bundle, Package } from '../bundler/Bundler';

export class PackagerRegistry {
  async package(bundle: Bundle): Promise<Package> {
    let content = '';

    // Concatenate all assets
    for (const asset of bundle.assets) {
      content += `\n// ${asset.filePath}\n`;
      content += asset.content + '\n';
    }

    // Wrap based on type
    if (bundle.type === 'js' || bundle.type === 'jsx' || bundle.type === 'ts' || bundle.type === 'tsx') {
      content = this.wrapJS(content);
    }

    return {
      entry: bundle.entry,
      content,
      type: bundle.type,
    };
  }

  private wrapJS(content: string): string {
    return `(function() {\n'use strict';\n${content}\n})();`;
  }
}
