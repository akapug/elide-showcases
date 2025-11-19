/**
 * Real-Time Plotting and Visualization
 *
 * Comprehensive visualization system using Matplotlib through Elide's Python bridge.
 * Provides 2D/3D plotting, animations, interactive plots, and export capabilities.
 *
 * Features:
 * - 2D plots (line, scatter, bar, histogram, etc.)
 * - 3D visualizations (surface, wireframe, scatter)
 * - Statistical plots (box, violin, heatmap)
 * - Animations and real-time updates
 * - Multiple subplots and figure management
 * - Export to various formats (PNG, PDF, SVG)
 * - Customizable styles and themes
 */

import Python from 'python';

// Type definitions
export interface PlotOptions {
  title?: string;
  xlabel?: string;
  ylabel?: string;
  zlabel?: string;
  color?: string | string[];
  linewidth?: number;
  linestyle?: '-' | '--' | '-.' | ':';
  marker?: string;
  markersize?: number;
  alpha?: number;
  label?: string;
  grid?: boolean;
  legend?: boolean;
  xlim?: [number, number];
  ylim?: [number, number];
  zlim?: [number, number];
  xscale?: 'linear' | 'log' | 'symlog' | 'logit';
  yscale?: 'linear' | 'log' | 'symlog' | 'logit';
  aspect?: 'auto' | 'equal' | number;
  tight_layout?: boolean;
}

export interface ScatterOptions extends PlotOptions {
  s?: number | number[];
  c?: string | number[];
  cmap?: string;
  vmin?: number;
  vmax?: number;
  edgecolors?: string;
  regression?: boolean;
}

export interface BarOptions extends PlotOptions {
  width?: number;
  bottom?: number | number[];
  orientation?: 'vertical' | 'horizontal';
  edgecolor?: string;
}

export interface HistogramOptions extends PlotOptions {
  bins?: number | number[] | string;
  range?: [number, number];
  density?: boolean;
  cumulative?: boolean;
  histtype?: 'bar' | 'barstacked' | 'step' | 'stepfilled';
  orientation?: 'vertical' | 'horizontal';
}

export interface HeatmapOptions {
  title?: string;
  xlabel?: string;
  ylabel?: string;
  cmap?: string;
  vmin?: number;
  vmax?: number;
  center?: number;
  annot?: boolean;
  fmt?: string;
  linewidths?: number;
  cbar?: boolean;
  square?: boolean;
}

export interface ContourOptions extends PlotOptions {
  levels?: number | number[];
  cmap?: string;
  filled?: boolean;
  vmin?: number;
  vmax?: number;
}

export interface Surface3DOptions {
  title?: string;
  xlabel?: string;
  ylabel?: string;
  zlabel?: string;
  cmap?: string;
  alpha?: number;
  rstride?: number;
  cstride?: number;
  linewidth?: number;
  antialiased?: boolean;
  shade?: boolean;
}

export interface AnimationOptions {
  frames?: number;
  interval?: number;
  repeat?: boolean;
  blit?: boolean;
}

export interface SubplotConfig {
  nrows: number;
  ncols: number;
  figsize?: [number, number];
  sharex?: boolean;
  sharey?: boolean;
}

/**
 * Plotter Class
 */
export class Plotter {
  private numpy: any;
  private plt: any;
  private mpl: any;
  private currentFigure: any;
  private currentAxes: any;
  private figures: Map<string, any>;
  private animations: Map<string, any>;

  constructor() {
    this.numpy = Python.import('numpy');
    this.plt = Python.import('matplotlib.pyplot');
    this.mpl = Python.import('matplotlib');

    // Configure matplotlib for non-interactive backend if needed
    this.mpl.use('Agg');

    this.figures = new Map();
    this.animations = new Map();
  }

  // ============================================================================
  // Figure Management
  // ============================================================================

  /**
   * Create a new figure
   */
  figure(
    figsize: [number, number] = [10, 6],
    dpi: number = 100,
    facecolor: string = 'white',
    edgecolor: string = 'white'
  ): string {
    const fig = this.plt.figure({ figsize, dpi, facecolor, edgecolor });
    const figId = this.generateId('fig');
    this.figures.set(figId, fig);
    this.currentFigure = fig;
    return figId;
  }

  /**
   * Create subplots
   */
  subplots(config: SubplotConfig): {
    figId: string;
    axes: any[];
  } {
    const { nrows, ncols, figsize = [12, 8], sharex = false, sharey = false } = config;

    const [fig, axes] = this.plt.subplots(nrows, ncols, {
      figsize,
      sharex,
      sharey
    });

    const figId = this.generateId('fig');
    this.figures.set(figId, fig);
    this.currentFigure = fig;

    return {
      figId,
      axes: Array.isArray(axes) ? axes : [axes]
    };
  }

  /**
   * Set current figure
   */
  setCurrentFigure(figId: string): void {
    const fig = this.figures.get(figId);
    if (fig) {
      this.plt.figure(fig.number);
      this.currentFigure = fig;
    }
  }

  /**
   * Clear current figure
   */
  clear(): void {
    this.plt.clf();
  }

  /**
   * Close figure
   */
  close(figId?: string): void {
    if (figId) {
      const fig = this.figures.get(figId);
      if (fig) {
        this.plt.close(fig);
        this.figures.delete(figId);
      }
    } else {
      this.plt.close();
    }
  }

  // ============================================================================
  // 2D Plotting
  // ============================================================================

  /**
   * Line plot
   */
  plot(x: number[], y: number[], options: PlotOptions = {}): string {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);

    const plotOptions: any = {};
    if (options.color) plotOptions.color = options.color;
    if (options.linewidth) plotOptions.linewidth = options.linewidth;
    if (options.linestyle) plotOptions.linestyle = options.linestyle;
    if (options.marker) plotOptions.marker = options.marker;
    if (options.markersize) plotOptions.markersize = options.markersize;
    if (options.alpha) plotOptions.alpha = options.alpha;
    if (options.label) plotOptions.label = options.label;

    this.plt.plot(npX, npY, plotOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Scatter plot
   */
  scatter(x: number[], y: number[], options: ScatterOptions = {}): string {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);

    const scatterOptions: any = {};
    if (options.s) scatterOptions.s = options.s;
    if (options.c) scatterOptions.c = options.c;
    if (options.cmap) scatterOptions.cmap = options.cmap;
    if (options.marker) scatterOptions.marker = options.marker;
    if (options.alpha) scatterOptions.alpha = options.alpha;
    if (options.edgecolors) scatterOptions.edgecolors = options.edgecolors;
    if (options.vmin !== undefined) scatterOptions.vmin = options.vmin;
    if (options.vmax !== undefined) scatterOptions.vmax = options.vmax;
    if (options.label) scatterOptions.label = options.label;

    this.plt.scatter(npX, npY, scatterOptions);

    // Add regression line if requested
    if (options.regression) {
      const z = this.numpy.polyfit(npX, npY, 1);
      const p = this.numpy.poly1d(z);
      const yFit = p(npX);
      this.plt.plot(npX, yFit, { color: 'red', linestyle: '--', label: 'Regression' });
    }

    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Bar chart
   */
  bar(x: number[] | string[], height: number[], options: BarOptions = {}): string {
    const barOptions: any = {};
    if (options.width) barOptions.width = options.width;
    if (options.bottom) barOptions.bottom = options.bottom;
    if (options.color) barOptions.color = options.color;
    if (options.edgecolor) barOptions.edgecolor = options.edgecolor;
    if (options.alpha) barOptions.alpha = options.alpha;
    if (options.label) barOptions.label = options.label;

    if (options.orientation === 'horizontal') {
      this.plt.barh(x, height, barOptions);
    } else {
      this.plt.bar(x, height, barOptions);
    }

    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Histogram
   */
  histogram(data: number[], options: HistogramOptions = {}): string {
    const npData = this.numpy.array(data);

    const histOptions: any = {};
    if (options.bins) histOptions.bins = options.bins;
    if (options.range) histOptions.range = options.range;
    if (options.density) histOptions.density = options.density;
    if (options.cumulative) histOptions.cumulative = options.cumulative;
    if (options.histtype) histOptions.histtype = options.histtype;
    if (options.orientation) histOptions.orientation = options.orientation;
    if (options.color) histOptions.color = options.color;
    if (options.alpha) histOptions.alpha = options.alpha;
    if (options.label) histOptions.label = options.label;

    this.plt.hist(npData, histOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Box plot
   */
  boxplot(data: number[][] | number[], options: PlotOptions = {}): string {
    const boxOptions: any = {};
    if (options.label) boxOptions.labels = options.label;

    this.plt.boxplot(data, boxOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Violin plot
   */
  violinplot(data: number[][] | number[], positions?: number[], options: PlotOptions = {}): string {
    const violinOptions: any = {};
    if (positions) violinOptions.positions = positions;

    this.plt.violinplot(data, violinOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Error bar plot
   */
  errorbar(
    x: number[],
    y: number[],
    yerr?: number[] | number,
    xerr?: number[] | number,
    options: PlotOptions = {}
  ): string {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);

    const errorOptions: any = {};
    if (yerr !== undefined) errorOptions.yerr = yerr;
    if (xerr !== undefined) errorOptions.xerr = xerr;
    if (options.color) errorOptions.color = options.color;
    if (options.linewidth) errorOptions.linewidth = options.linewidth;
    if (options.marker) errorOptions.marker = options.marker;
    if (options.markersize) errorOptions.markersize = options.markersize;
    if (options.alpha) errorOptions.alpha = options.alpha;
    if (options.label) errorOptions.label = options.label;

    this.plt.errorbar(npX, npY, errorOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Pie chart
   */
  pie(
    sizes: number[],
    labels?: string[],
    options: {
      explode?: number[];
      autopct?: string;
      shadow?: boolean;
      startangle?: number;
      colors?: string[];
    } = {}
  ): string {
    const pieOptions: any = {};
    if (labels) pieOptions.labels = labels;
    if (options.explode) pieOptions.explode = options.explode;
    if (options.autopct) pieOptions.autopct = options.autopct;
    if (options.shadow) pieOptions.shadow = options.shadow;
    if (options.startangle) pieOptions.startangle = options.startangle;
    if (options.colors) pieOptions.colors = options.colors;

    this.plt.pie(sizes, pieOptions);

    return this.getCurrentFigureId();
  }

  // ============================================================================
  // Heatmaps and Contours
  // ============================================================================

  /**
   * Heatmap
   */
  heatmap(data: number[][], options: HeatmapOptions = {}): string {
    const npData = this.numpy.array(data);

    const imshowOptions: any = {
      aspect: 'auto',
      interpolation: 'nearest'
    };

    if (options.cmap) imshowOptions.cmap = options.cmap;
    if (options.vmin !== undefined) imshowOptions.vmin = options.vmin;
    if (options.vmax !== undefined) imshowOptions.vmax = options.vmax;

    this.plt.imshow(npData, imshowOptions);

    if (options.cbar !== false) {
      this.plt.colorbar();
    }

    if (options.title) this.plt.title(options.title);
    if (options.xlabel) this.plt.xlabel(options.xlabel);
    if (options.ylabel) this.plt.ylabel(options.ylabel);

    // Annotate heatmap if requested
    if (options.annot) {
      const fmt = options.fmt || '.2f';
      const [rows, cols] = [data.length, data[0].length];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const text = this.formatNumber(data[i][j], fmt);
          this.plt.text(j, i, text, {
            ha: 'center',
            va: 'center',
            color: 'white'
          });
        }
      }
    }

    return this.getCurrentFigureId();
  }

  /**
   * Contour plot
   */
  contour(X: number[][], Y: number[][], Z: number[][], options: ContourOptions = {}): string {
    const npX = this.numpy.array(X);
    const npY = this.numpy.array(Y);
    const npZ = this.numpy.array(Z);

    const contourOptions: any = {};
    if (options.levels) contourOptions.levels = options.levels;
    if (options.cmap) contourOptions.cmap = options.cmap;
    if (options.vmin !== undefined) contourOptions.vmin = options.vmin;
    if (options.vmax !== undefined) contourOptions.vmax = options.vmax;
    if (options.linewidth) contourOptions.linewidths = options.linewidth;

    if (options.filled) {
      this.plt.contourf(npX, npY, npZ, contourOptions);
    } else {
      this.plt.contour(npX, npY, npZ, contourOptions);
    }

    this.plt.colorbar();
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Stream plot
   */
  streamplot(
    X: number[][],
    Y: number[][],
    U: number[][],
    V: number[][],
    options: PlotOptions & { density?: number; arrowsize?: number } = {}
  ): string {
    const npX = this.numpy.array(X);
    const npY = this.numpy.array(Y);
    const npU = this.numpy.array(U);
    const npV = this.numpy.array(V);

    const streamOptions: any = {};
    if (options.color) streamOptions.color = options.color;
    if (options.linewidth) streamOptions.linewidth = options.linewidth;
    if (options.density) streamOptions.density = options.density;
    if (options.arrowsize) streamOptions.arrowsize = options.arrowsize;

    this.plt.streamplot(npX, npY, npU, npV, streamOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  /**
   * Quiver plot
   */
  quiver(
    X: number[][],
    Y: number[][],
    U: number[][],
    V: number[][],
    options: PlotOptions & { scale?: number; width?: number } = {}
  ): string {
    const npX = this.numpy.array(X);
    const npY = this.numpy.array(Y);
    const npU = this.numpy.array(U);
    const npV = this.numpy.array(V);

    const quiverOptions: any = {};
    if (options.scale) quiverOptions.scale = options.scale;
    if (options.width) quiverOptions.width = options.width;
    if (options.color) quiverOptions.color = options.color;

    this.plt.quiver(npX, npY, npU, npV, quiverOptions);
    this.applyOptions(options);

    return this.getCurrentFigureId();
  }

  // ============================================================================
  // 3D Plotting
  // ============================================================================

  /**
   * 3D surface plot
   */
  surface3D(X: number[][], Y: number[][], Z: number[][], options: Surface3DOptions = {}): string {
    const mpl_toolkits = Python.import('mpl_toolkits.mplot3d');
    const Axes3D = mpl_toolkits.Axes3D;

    const fig = this.plt.figure();
    const ax = fig.add_subplot(111, { projection: '3d' });

    const npX = this.numpy.array(X);
    const npY = this.numpy.array(Y);
    const npZ = this.numpy.array(Z);

    const surfOptions: any = {};
    if (options.cmap) surfOptions.cmap = options.cmap;
    if (options.alpha) surfOptions.alpha = options.alpha;
    if (options.rstride) surfOptions.rstride = options.rstride;
    if (options.cstride) surfOptions.cstride = options.cstride;
    if (options.linewidth) surfOptions.linewidth = options.linewidth;
    if (options.antialiased !== undefined) surfOptions.antialiased = options.antialiased;
    if (options.shade !== undefined) surfOptions.shade = options.shade;

    ax.plot_surface(npX, npY, npZ, surfOptions);

    if (options.title) ax.set_title(options.title);
    if (options.xlabel) ax.set_xlabel(options.xlabel);
    if (options.ylabel) ax.set_ylabel(options.ylabel);
    if (options.zlabel) ax.set_zlabel(options.zlabel);

    const figId = this.generateId('fig');
    this.figures.set(figId, fig);

    return figId;
  }

  /**
   * 3D wireframe plot
   */
  wireframe3D(X: number[][], Y: number[][], Z: number[][], options: Surface3DOptions = {}): string {
    const mpl_toolkits = Python.import('mpl_toolkits.mplot3d');

    const fig = this.plt.figure();
    const ax = fig.add_subplot(111, { projection: '3d' });

    const npX = this.numpy.array(X);
    const npY = this.numpy.array(Y);
    const npZ = this.numpy.array(Z);

    const wireOptions: any = {};
    if (options.rstride) wireOptions.rstride = options.rstride;
    if (options.cstride) wireOptions.cstride = options.cstride;
    if (options.linewidth) wireOptions.linewidth = options.linewidth;
    if (options.cmap) wireOptions.cmap = options.cmap;

    ax.plot_wireframe(npX, npY, npZ, wireOptions);

    if (options.title) ax.set_title(options.title);
    if (options.xlabel) ax.set_xlabel(options.xlabel);
    if (options.ylabel) ax.set_ylabel(options.ylabel);
    if (options.zlabel) ax.set_zlabel(options.zlabel);

    const figId = this.generateId('fig');
    this.figures.set(figId, fig);

    return figId;
  }

  /**
   * 3D scatter plot
   */
  scatter3D(x: number[], y: number[], z: number[], options: ScatterOptions = {}): string {
    const mpl_toolkits = Python.import('mpl_toolkits.mplot3d');

    const fig = this.plt.figure();
    const ax = fig.add_subplot(111, { projection: '3d' });

    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const npZ = this.numpy.array(z);

    const scatterOptions: any = {};
    if (options.s) scatterOptions.s = options.s;
    if (options.c) scatterOptions.c = options.c;
    if (options.cmap) scatterOptions.cmap = options.cmap;
    if (options.marker) scatterOptions.marker = options.marker;
    if (options.alpha) scatterOptions.alpha = options.alpha;

    ax.scatter(npX, npY, npZ, scatterOptions);

    if (options.title) ax.set_title(options.title);
    if (options.xlabel) ax.set_xlabel(options.xlabel);
    if (options.ylabel) ax.set_ylabel(options.ylabel);
    if (options.zlabel) ax.set_zlabel(options.zlabel);

    const figId = this.generateId('fig');
    this.figures.set(figId, fig);

    return figId;
  }

  // ============================================================================
  // Animations
  // ============================================================================

  /**
   * Create animation
   */
  animate(
    updateFunc: (frame: number) => { x: number[]; y: number[] },
    options: AnimationOptions = {}
  ): string {
    const animation = Python.import('matplotlib.animation');

    const fig = this.plt.figure();
    const ax = fig.add_subplot(111);

    // Initial plot
    const initialData = updateFunc(0);
    const [line] = ax.plot(initialData.x, initialData.y);

    // Update function
    const update = (frame: number) => {
      const data = updateFunc(frame);
      line.set_data(data.x, data.y);
      ax.relim();
      ax.autoscale_view();
      return [line];
    };

    const anim = animation.FuncAnimation(
      fig,
      update,
      {
        frames: options.frames || 100,
        interval: options.interval || 50,
        blit: options.blit !== false,
        repeat: options.repeat !== false
      }
    );

    const animId = this.generateId('anim');
    this.animations.set(animId, anim);

    const figId = this.generateId('fig');
    this.figures.set(figId, fig);

    return animId;
  }

  /**
   * Save animation
   */
  saveAnimation(animId: string, filename: string, fps: number = 30, dpi: number = 100): void {
    const anim = this.animations.get(animId);
    if (anim) {
      const writer = this.mpl.animation.PillowWriter({ fps });
      anim.save(filename, { writer, dpi });
    }
  }

  // ============================================================================
  // Export and Save
  // ============================================================================

  /**
   * Save figure to file
   */
  savefig(
    filename: string,
    figId?: string,
    options: {
      dpi?: number;
      format?: 'png' | 'pdf' | 'svg' | 'jpg';
      transparent?: boolean;
      bbox_inches?: 'tight' | string;
    } = {}
  ): void {
    if (figId) {
      this.setCurrentFigure(figId);
    }

    const saveOptions: any = {};
    if (options.dpi) saveOptions.dpi = options.dpi;
    if (options.format) saveOptions.format = options.format;
    if (options.transparent) saveOptions.transparent = options.transparent;
    if (options.bbox_inches) saveOptions.bbox_inches = options.bbox_inches;

    this.plt.savefig(filename, saveOptions);
  }

  /**
   * Show plot (for interactive environments)
   */
  show(): void {
    this.plt.show();
  }

  // ============================================================================
  // Styling and Customization
  // ============================================================================

  /**
   * Set plot style
   */
  setStyle(style: string): void {
    this.plt.style.use(style);
  }

  /**
   * Set color palette
   */
  setColorPalette(palette: string): void {
    // For seaborn-style palettes
    try {
      const sns = Python.import('seaborn');
      sns.set_palette(palette);
    } catch (error) {
      console.warn('Seaborn not available, using matplotlib colors');
    }
  }

  /**
   * Add text annotation
   */
  text(x: number, y: number, text: string, options: any = {}): void {
    this.plt.text(x, y, text, options);
  }

  /**
   * Add arrow annotation
   */
  annotate(
    text: string,
    xy: [number, number],
    xytext: [number, number],
    arrowprops?: any
  ): void {
    this.plt.annotate(text, { xy, xytext, arrowprops });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Apply common plot options
   */
  private applyOptions(options: PlotOptions): void {
    if (options.title) this.plt.title(options.title);
    if (options.xlabel) this.plt.xlabel(options.xlabel);
    if (options.ylabel) this.plt.ylabel(options.ylabel);
    if (options.grid !== false) this.plt.grid(options.grid !== false);
    if (options.legend) this.plt.legend();
    if (options.xlim) this.plt.xlim(options.xlim);
    if (options.ylim) this.plt.ylim(options.ylim);
    if (options.xscale) this.plt.xscale(options.xscale);
    if (options.yscale) this.plt.yscale(options.yscale);
    if (options.aspect) this.plt.gca().set_aspect(options.aspect);
    if (options.tight_layout) this.plt.tight_layout();
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current figure ID
   */
  private getCurrentFigureId(): string {
    if (!this.currentFigure) {
      return this.figure();
    }

    // Find existing ID or create new one
    for (const [id, fig] of this.figures.entries()) {
      if (fig === this.currentFigure) {
        return id;
      }
    }

    const newId = this.generateId('fig');
    this.figures.set(newId, this.currentFigure);
    return newId;
  }

  /**
   * Format number for annotation
   */
  private formatNumber(value: number, fmt: string): string {
    if (fmt.includes('d')) {
      return Math.round(value).toString();
    } else if (fmt.includes('f')) {
      const decimals = parseInt(fmt.match(/\.(\d+)/)?.[1] || '2');
      return value.toFixed(decimals);
    } else if (fmt.includes('e')) {
      const decimals = parseInt(fmt.match(/\.(\d+)/)?.[1] || '2');
      return value.toExponential(decimals);
    }
    return value.toString();
  }

  /**
   * Create plot directly from API
   */
  async create(type: string, data: any, options: any = {}): Promise<string> {
    switch (type) {
      case 'line':
        return this.plot(data.x, data.y, options);
      case 'scatter':
        return this.scatter(data.x, data.y, options);
      case 'bar':
        return this.bar(data.x, data.height, options);
      case 'histogram':
        return this.histogram(data.values, options);
      case 'heatmap':
        return this.heatmap(data.matrix, options);
      case 'contour':
        return this.contour(data.X, data.Y, data.Z, options);
      case 'surface3d':
        return this.surface3D(data.X, data.Y, data.Z, options);
      default:
        throw new Error(`Unknown plot type: ${type}`);
    }
  }

  /**
   * Update existing plot
   */
  async update(plotId: string, data: any): Promise<void> {
    this.setCurrentFigure(plotId);
    this.clear();
    // Re-create plot with new data (implementation depends on stored plot type)
  }
}

export default Plotter;
