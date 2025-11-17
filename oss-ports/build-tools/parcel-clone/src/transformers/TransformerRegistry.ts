/**
 * Parcel Clone - Transformer Registry
 */

import type { Asset } from '../bundler/Bundler';

export class TransformerRegistry {
  async transform(asset: Asset): Promise<void> {
    // Transform based on asset type
    switch (asset.type) {
      case 'ts':
      case 'tsx':
        await this.transformTypeScript(asset);
        break;
      case 'jsx':
        await this.transformJSX(asset);
        break;
      case 'scss':
      case 'sass':
      case 'less':
        await this.transformCSS(asset);
        break;
    }
  }

  private async transformTypeScript(asset: Asset): Promise<void> {
    // Simplified TypeScript transformation
    asset.content = asset.content
      .replace(/:\s*\w+(\[\])?/g, '')
      .replace(/interface\s+\w+\s*{[^}]*}/g, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
    asset.type = 'js';
  }

  private async transformJSX(asset: Asset): Promise<void> {
    // Simplified JSX transformation
    asset.type = 'js';
  }

  private async transformCSS(asset: Asset): Promise<void> {
    // Simplified CSS transformation
    asset.type = 'css';
  }
}
