/**
 * Genome Visualizer
 *
 * Interactive genome visualization and plotting tools using matplotlib.
 */

// @ts-ignore
import matplotlib from 'python:matplotlib';
// @ts-ignore
import numpy from 'python:numpy';

import {
  BrowserOptions,
  Browser,
  Track,
  RenderOptions,
  Variant,
  Gene,
  Tree,
  AnalysisError
} from '../types';

export class GenomeVisualizer {
  private readonly matplotlib: any;
  private readonly numpy: any;
  private readonly plt: any;

  constructor() {
    this.matplotlib = matplotlib;
    this.numpy = numpy;
    this.plt = matplotlib.pyplot;

    // Set non-interactive backend
    this.matplotlib.use('Agg');
  }

  createBrowser(options: BrowserOptions): Browser {
    const { reference, region, width = 1200, height = 600 } = options;

    const tracks: Track[] = [];
    let currentRegion = region || 'chr1:1-1000000';

    const browser: Browser = {
      addTrack: (track: Track) => {
        tracks.push(track);
      },

      removeTrack: (index: number) => {
        tracks.splice(index, 1);
      },

      setRegion: (newRegion: string) => {
        currentRegion = newRegion;
      },

      render: async (output: string, renderOptions?: RenderOptions) => {
        await this.renderBrowser(
          tracks,
          currentRegion,
          output,
          { width, height, ...renderOptions }
        );
      }
    };

    return browser;
  }

  private async renderBrowser(
    tracks: Track[],
    region: string,
    output: string,
    options: RenderOptions
  ): Promise<void> {
    const { width = 1200, height = 600, dpi = 300, format = 'png' } = options;

    try {
      // Parse region
      const [chr, range] = region.split(':');
      const [start, end] = range.split('-').map(Number);

      // Create figure
      const fig = this.plt.figure(figsize: [width / dpi, height / dpi], dpi: dpi);

      // Create subplots for each track
      const numTracks = tracks.length;
      for (let i = 0; i < numTracks; i++) {
        const track = tracks[i];
        const ax = fig.add_subplot(numTracks, 1, i + 1);

        await this.renderTrack(ax, track, chr, start, end);
      }

      this.plt.tight_layout();
      this.plt.savefig(output, format: format, dpi: dpi);
      this.plt.close();
    } catch (error) {
      throw new AnalysisError(`Browser rendering failed: ${error}`);
    }
  }

  private async renderTrack(
    ax: any,
    track: Track,
    chr: string,
    start: number,
    end: number
  ): Promise<void> {
    const { type, data, color = 'blue', height = 100, label } = track;

    switch (type) {
      case 'gene':
        this.renderGeneTrack(ax, data, chr, start, end, color);
        break;
      case 'variant':
        this.renderVariantTrack(ax, data, chr, start, end, color);
        break;
      case 'coverage':
        this.renderCoverageTrack(ax, data, chr, start, end, color);
        break;
      case 'alignment':
        this.renderAlignmentTrack(ax, data, chr, start, end, color);
        break;
    }

    if (label) {
      ax.set_ylabel(label);
    }

    ax.set_xlim(start, end);
  }

  private renderGeneTrack(
    ax: any,
    genes: Gene[],
    chr: string,
    start: number,
    end: number,
    color: string
  ): void {
    for (const gene of genes) {
      if (gene.chromosome === chr && gene.end >= start && gene.start <= end) {
        // Draw gene body
        ax.barh(
          0.5,
          gene.end - gene.start,
          left: gene.start,
          height: 0.3,
          color: color,
          alpha: 0.7
        );

        // Draw exons if available
        if (gene.exons) {
          for (const exon of gene.exons) {
            ax.barh(
              0.5,
              exon.end - exon.start,
              left: exon.start,
              height: 0.5,
              color: color
            );
          }
        }

        // Add gene name
        ax.text(
          gene.start,
          0.9,
          gene.name,
          fontsize: 8,
          verticalalignment: 'bottom'
        );
      }
    }

    ax.set_ylim(0, 1);
    ax.set_yticks([]);
  }

  private renderVariantTrack(
    ax: any,
    variants: Variant[],
    chr: string,
    start: number,
    end: number,
    color: string
  ): void {
    const positions: number[] = [];
    const qualities: number[] = [];

    for (const variant of variants) {
      if (variant.chromosome === chr && variant.position >= start && variant.position <= end) {
        positions.push(variant.position);
        qualities.push(variant.quality);
      }
    }

    if (positions.length > 0) {
      ax.scatter(positions, qualities, c: color, alpha: 0.6, s: 20);
      ax.set_ylabel('Quality');
    }
  }

  private renderCoverageTrack(
    ax: any,
    data: number[],
    chr: string,
    start: number,
    end: number,
    color: string
  ): void {
    const positions = Array.from({ length: data.length }, (_, i) => start + i);
    ax.fill_between(positions, data, color: color, alpha: 0.6);
    ax.set_ylabel('Coverage');
  }

  private renderAlignmentTrack(
    ax: any,
    data: any,
    chr: string,
    start: number,
    end: number,
    color: string
  ): void {
    // Simplified alignment rendering
    ax.text(
      (start + end) / 2,
      0.5,
      'Alignments',
      horizontalalignment: 'center',
      verticalalignment: 'center'
    );
  }

  async plotCoverage(data: number[], output: string): Promise<void> {
    try {
      const fig = this.plt.figure(figsize: [12, 4]);
      const ax = fig.add_subplot(1, 1, 1);

      const positions = Array.from({ length: data.length }, (_, i) => i);
      ax.plot(positions, data, linewidth: 1);
      ax.fill_between(positions, data, alpha: 0.3);

      ax.set_xlabel('Position');
      ax.set_ylabel('Coverage');
      ax.set_title('Read Coverage');

      this.plt.tight_layout();
      this.plt.savefig(output, dpi: 300);
      this.plt.close();
    } catch (error) {
      throw new AnalysisError(`Coverage plot failed: ${error}`);
    }
  }

  async plotVariants(variants: Variant[], output: string): Promise<void> {
    try {
      const fig = this.plt.figure(figsize: [12, 6]);
      const ax = fig.add_subplot(1, 1, 1);

      const positions = variants.map(v => v.position);
      const qualities = variants.map(v => v.quality);
      const colors = variants.map(v =>
        v.type === 'SNP' ? 'blue' : v.type === 'INSERTION' ? 'green' : 'red'
      );

      ax.scatter(positions, qualities, c: colors, alpha: 0.6, s: 30);

      ax.set_xlabel('Position');
      ax.set_ylabel('Quality');
      ax.set_title('Variant Quality Distribution');

      // Add legend
      const handles = [
        { label: 'SNP', color: 'blue' },
        { label: 'Insertion', color: 'green' },
        { label: 'Deletion', color: 'red' }
      ];

      this.plt.legend(handles);
      this.plt.tight_layout();
      this.plt.savefig(output, dpi: 300);
      this.plt.close();
    } catch (error) {
      throw new AnalysisError(`Variant plot failed: ${error}`);
    }
  }

  async plotGenes(genes: Gene[], output: string): Promise<void> {
    try {
      const fig = this.plt.figure(figsize: [12, 8]);
      const ax = fig.add_subplot(1, 1, 1);

      for (let i = 0; i < genes.length; i++) {
        const gene = genes[i];
        const y = i;

        // Draw gene
        ax.barh(
          y,
          gene.end - gene.start,
          left: gene.start,
          height: 0.5,
          color: 'blue',
          alpha: 0.7
        );

        // Add label
        ax.text(gene.start, y, gene.name, fontsize: 8, verticalalignment: 'center');
      }

      ax.set_yticks([]);
      ax.set_xlabel('Genomic Position');
      ax.set_title('Gene Structure');

      this.plt.tight_layout();
      this.plt.savefig(output, dpi: 300);
      this.plt.close();
    } catch (error) {
      throw new AnalysisError(`Gene plot failed: ${error}`);
    }
  }

  async plotPhylogeny(tree: Tree, output: string): Promise<void> {
    try {
      const fig = this.plt.figure(figsize: [10, 10]);
      const ax = fig.add_subplot(1, 1, 1);

      // Simple tree rendering
      this.drawTree(ax, tree.root, 0, 1, 0);

      ax.set_xlim(-0.1, 1.1);
      ax.set_ylim(-0.1, 1.1);
      ax.axis('off');
      ax.set_title('Phylogenetic Tree');

      this.plt.tight_layout();
      this.plt.savefig(output, dpi: 300);
      this.plt.close();
    } catch (error) {
      throw new AnalysisError(`Phylogeny plot failed: ${error}`);
    }
  }

  private drawTree(ax: any, node: any, x: number, y: number, level: number): void {
    if (node.children.length === 0) {
      // Leaf node
      ax.plot([x], [y], 'o', color: 'blue');
      if (node.name) {
        ax.text(x + 0.02, y, node.name, fontsize: 8);
      }
    } else {
      // Internal node
      const childY = y - 0.1;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childX = x + 0.1;
        const offsetY = (i - node.children.length / 2) * 0.05;

        // Draw branch
        ax.plot([x, childX], [y, childY + offsetY], 'k-', linewidth: 1);

        // Recurse
        this.drawTree(ax, child, childX, childY + offsetY, level + 1);
      }
    }
  }

  async plotHeatmap(matrix: number[][], output: string): Promise<void> {
    try {
      const fig = this.plt.figure(figsize: [10, 8]);
      const ax = fig.add_subplot(1, 1, 1);

      const data = this.numpy.array(matrix);
      const im = ax.imshow(data, cmap: 'viridis', aspect: 'auto');

      this.plt.colorbar(im, ax: ax);
      ax.set_title('Expression Heatmap');

      this.plt.tight_layout();
      this.plt.savefig(output, dpi: 300);
      this.plt.close();
    } catch (error) {
      throw new AnalysisError(`Heatmap plot failed: ${error}`);
    }
  }
}

export function createBrowser(options: BrowserOptions): Browser {
  const viz = new GenomeVisualizer();
  return viz.createBrowser(options);
}
