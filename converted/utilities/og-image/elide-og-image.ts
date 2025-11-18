/**
 * OG Image - Open Graph Image Generator
 *
 * Generate Open Graph images dynamically.
 * **POLYGLOT SHOWCASE**: One OG image generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/og-image (~20K+ downloads/week)
 *
 * Features:
 * - Generate OG images
 * - Customizable templates
 * - Text overlays
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export interface OGImageOptions {
  title: string;
  description?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
}

export class OGImageGenerator {
  generateUrl(options: OGImageOptions): string {
    const params = new URLSearchParams({
      title: options.title,
      description: options.description || '',
      width: (options.width || 1200).toString(),
      height: (options.height || 630).toString(),
      bg: options.backgroundColor || 'ffffff',
      color: options.textColor || '000000',
    });

    return `/api/og-image?${params.toString()}`;
  }

  generateSVG(options: OGImageOptions): string {
    const width = options.width || 1200;
    const height = options.height || 630;
    const bg = options.backgroundColor || '#ffffff';
    const color = options.textColor || '#000000';

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <text x="50%" y="40%" font-size="48" fill="${color}" text-anchor="middle">${options.title}</text>
  ${options.description ? `<text x="50%" y="60%" font-size="24" fill="${color}" text-anchor="middle">${options.description}</text>` : ''}
</svg>`.trim();
  }
}

export default new OGImageGenerator();

if (import.meta.url.includes("elide-og-image.ts")) {
  console.log("🖼️  OG Image - Open Graph Image Generator (POLYGLOT!)\n");

  const generator = new OGImageGenerator();
  
  const url = generator.generateUrl({
    title: 'Amazing Article',
    description: 'Read this now',
    width: 1200,
    height: 630,
  });

  console.log("URL:", url);
  console.log("\nSVG:");
  console.log(generator.generateSVG({
    title: 'Amazing Article',
    description: 'Read this now',
  }));

  console.log("\n~20K+ downloads/week on npm!");
}
