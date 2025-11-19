/**
 * Data Visualization with Matplotlib and Seaborn in TypeScript
 *
 * This module demonstrates advanced data visualization techniques
 * using matplotlib and seaborn directly in TypeScript through Elide's polyglot syntax.
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - Polyglot Magic!
// ============================================================================

// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';
// @ts-ignore
import seaborn from 'python:seaborn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import matplotlib_dates from 'python:matplotlib.dates';

/**
 * Basic Plotting
 */
class BasicPlots {
  /**
   * Line plots
   */
  static linePlots(): void {
    console.log('=== Line Plots ===\n');

    // Create data
    const x = numpy.linspace(0, 10, 100);
    const y1 = numpy.sin(x);
    const y2 = numpy.cos(x);
    const y3 = numpy.sin(x) * numpy.exp(-x / 10);

    // Create figure
    matplotlib.figure({ figsize: [12, 6] });

    // Plot multiple lines
    matplotlib.plot(x, y1, {
      label: 'sin(x)',
      color: 'blue',
      linewidth: 2,
      linestyle: '-'
    });

    matplotlib.plot(x, y2, {
      label: 'cos(x)',
      color: 'red',
      linewidth: 2,
      linestyle: '--'
    });

    matplotlib.plot(x, y3, {
      label: 'sin(x) * exp(-x/10)',
      color: 'green',
      linewidth: 2,
      linestyle: '-.'
    });

    // Customize plot
    matplotlib.title('Trigonometric Functions', { fontsize: 16, fontweight: 'bold' });
    matplotlib.xlabel('x', { fontsize: 12 });
    matplotlib.ylabel('y', { fontsize: 12 });
    matplotlib.legend({ loc: 'upper right', fontsize: 10 });
    matplotlib.grid(true, { alpha: 0.3, linestyle: '--' });

    // Save figure
    matplotlib.savefig('line_plots.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Line plots saved to line_plots.png');
  }

  /**
   * Scatter plots
   */
  static scatterPlots(): void {
    console.log('\n=== Scatter Plots ===\n');

    // Generate data
    const n = 200;
    const x = numpy.random.randn(n);
    const y = 2 * x + numpy.random.randn(n);
    const colors = numpy.random.rand(n);
    const sizes = numpy.random.randint(20, 200, n);

    // Create figure
    matplotlib.figure({ figsize: [10, 8] });

    // Scatter plot with color and size variation
    const scatter = matplotlib.scatter(x, y, {
      c: colors,
      s: sizes,
      alpha: 0.6,
      cmap: 'viridis',
      edgecolors: 'black',
      linewidth: 0.5
    });

    matplotlib.colorbar(scatter, { label: 'Color scale' });
    matplotlib.title('Scatter Plot with Variable Size and Color', { fontsize: 14 });
    matplotlib.xlabel('X', { fontsize: 12 });
    matplotlib.ylabel('Y', { fontsize: 12 });
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.savefig('scatter_plots.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Scatter plots saved to scatter_plots.png');
  }

  /**
   * Bar plots
   */
  static barPlots(): void {
    console.log('\n=== Bar Plots ===\n');

    // Data
    const categories = ['A', 'B', 'C', 'D', 'E'];
    const values1 = [23, 45, 56, 78, 32];
    const values2 = [18, 39, 52, 65, 28];

    // Create figure with subplots
    const [fig, axes] = matplotlib.subplots(1, 2, { figsize: [14, 6] });

    // Vertical bar plot
    const ax1 = axes[0];
    ax1.bar(categories, values1, {
      color: 'skyblue',
      edgecolor: 'black',
      alpha: 0.7
    });
    ax1.set_title('Vertical Bar Plot', { fontsize: 12 });
    ax1.set_xlabel('Category');
    ax1.set_ylabel('Value');
    ax1.grid({ axis: 'y', alpha: 0.3 });

    // Grouped bar plot
    const ax2 = axes[1];
    const x_pos = numpy.arange(categories.length);
    const width = 0.35;

    ax2.bar(x_pos - width / 2, values1, width, {
      label: 'Group 1',
      color: 'coral',
      alpha: 0.7
    });
    ax2.bar(x_pos + width / 2, values2, width, {
      label: 'Group 2',
      color: 'lightgreen',
      alpha: 0.7
    });

    ax2.set_title('Grouped Bar Plot', { fontsize: 12 });
    ax2.set_xlabel('Category');
    ax2.set_ylabel('Value');
    ax2.set_xticks(x_pos);
    ax2.set_xticklabels(categories);
    ax2.legend();
    ax2.grid({ axis: 'y', alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('bar_plots.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Bar plots saved to bar_plots.png');
  }

  /**
   * Histogram plots
   */
  static histograms(): void {
    console.log('\n=== Histograms ===\n');

    // Generate data from different distributions
    const normal = numpy.random.normal(0, 1, 1000);
    const uniform = numpy.random.uniform(-3, 3, 1000);
    const exponential = numpy.random.exponential(1, 1000);

    // Create figure
    matplotlib.figure({ figsize: [14, 10] });

    // Normal distribution
    matplotlib.subplot(2, 2, 1);
    matplotlib.hist(normal, {
      bins: 30,
      alpha: 0.7,
      color: 'blue',
      edgecolor: 'black'
    });
    matplotlib.title('Normal Distribution');
    matplotlib.xlabel('Value');
    matplotlib.ylabel('Frequency');
    matplotlib.grid(true, { alpha: 0.3 });

    // Uniform distribution
    matplotlib.subplot(2, 2, 2);
    matplotlib.hist(uniform, {
      bins: 30,
      alpha: 0.7,
      color: 'green',
      edgecolor: 'black'
    });
    matplotlib.title('Uniform Distribution');
    matplotlib.xlabel('Value');
    matplotlib.ylabel('Frequency');
    matplotlib.grid(true, { alpha: 0.3 });

    // Exponential distribution
    matplotlib.subplot(2, 2, 3);
    matplotlib.hist(exponential, {
      bins: 30,
      alpha: 0.7,
      color: 'red',
      edgecolor: 'black'
    });
    matplotlib.title('Exponential Distribution');
    matplotlib.xlabel('Value');
    matplotlib.ylabel('Frequency');
    matplotlib.grid(true, { alpha: 0.3 });

    // Overlapping histograms
    matplotlib.subplot(2, 2, 4);
    matplotlib.hist(normal, {
      bins: 30,
      alpha: 0.5,
      color: 'blue',
      label: 'Normal'
    });
    matplotlib.hist(uniform, {
      bins: 30,
      alpha: 0.5,
      color: 'green',
      label: 'Uniform'
    });
    matplotlib.title('Overlapping Distributions');
    matplotlib.xlabel('Value');
    matplotlib.ylabel('Frequency');
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('histograms.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Histograms saved to histograms.png');
  }

  /**
   * Box plots
   */
  static boxPlots(): void {
    console.log('\n=== Box Plots ===\n');

    // Generate data
    const data = [
      numpy.random.normal(0, 1, 100),
      numpy.random.normal(1, 1.5, 100),
      numpy.random.normal(2, 0.5, 100),
      numpy.random.normal(1.5, 2, 100)
    ];

    // Create figure
    matplotlib.figure({ figsize: [12, 6] });

    // Box plot
    const bp = matplotlib.boxplot(data, {
      labels: ['Group A', 'Group B', 'Group C', 'Group D'],
      patch_artist: true,
      notch: true,
      showmeans: true
    });

    // Customize colors
    const colors = ['lightblue', 'lightgreen', 'lightcoral', 'lightyellow'];
    for (let i = 0; i < bp['boxes'].length; i++) {
      bp['boxes'][i].set_facecolor(colors[i]);
    }

    matplotlib.title('Box Plot Comparison', { fontsize: 14 });
    matplotlib.ylabel('Value');
    matplotlib.grid(true, { alpha: 0.3, axis: 'y' });

    matplotlib.savefig('box_plots.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Box plots saved to box_plots.png');
  }
}

/**
 * Advanced Matplotlib Plots
 */
class AdvancedPlots {
  /**
   * Subplots and layouts
   */
  static subplotLayouts(): void {
    console.log('\n=== Subplot Layouts ===\n');

    // Create complex layout
    matplotlib.figure({ figsize: [15, 10] });

    // Different subplot sizes
    matplotlib.subplot(2, 3, 1);
    const x1 = numpy.linspace(0, 5, 50);
    matplotlib.plot(x1, numpy.sin(x1), 'b-');
    matplotlib.title('Plot 1');

    matplotlib.subplot(2, 3, 2);
    matplotlib.scatter(numpy.random.randn(50), numpy.random.randn(50));
    matplotlib.title('Plot 2');

    matplotlib.subplot(2, 3, 3);
    matplotlib.hist(numpy.random.randn(1000), { bins: 30 });
    matplotlib.title('Plot 3');

    matplotlib.subplot(2, 3, 4);
    matplotlib.bar(['A', 'B', 'C'], [3, 7, 5]);
    matplotlib.title('Plot 4');

    matplotlib.subplot(2, 3, 5);
    const data = numpy.random.rand(10, 10);
    matplotlib.imshow(data, { cmap: 'viridis' });
    matplotlib.colorbar();
    matplotlib.title('Plot 5');

    matplotlib.subplot(2, 3, 6);
    matplotlib.pie([15, 30, 45, 10], {
      labels: ['A', 'B', 'C', 'D'],
      autopct: '%1.1f%%'
    });
    matplotlib.title('Plot 6');

    matplotlib.tight_layout();
    matplotlib.savefig('subplot_layouts.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Subplot layouts saved to subplot_layouts.png');
  }

  /**
   * 3D plots
   */
  static threeDPlots(): void {
    console.log('\n=== 3D Plots ===\n');

    // Note: This would require mpl_toolkits.mplot3d
    // Showing concept for polyglot syntax
    console.log('3D plotting available with python:mpl_toolkits.mplot3d');
    console.log('Example:');
    console.log('// @ts-ignore');
    console.log("import Axes3D from 'python:mpl_toolkits.mplot3d';");
  }

  /**
   * Heatmaps
   */
  static heatmaps(): void {
    console.log('\n=== Heatmaps ===\n');

    // Generate correlation matrix
    const n = 10;
    const data = numpy.random.randn(100, n);
    const df = pandas.DataFrame(data, {
      columns: Array.from({ length: n }, (_, i) => `Var${i + 1}`)
    });
    const corr = df.corr();

    // Create heatmap
    matplotlib.figure({ figsize: [10, 8] });
    seaborn.heatmap(corr, {
      annot: true,
      fmt: '.2f',
      cmap: 'coolwarm',
      center: 0,
      square: true,
      linewidths: 0.5,
      cbar_kws: { shrink: 0.8 }
    });

    matplotlib.title('Correlation Heatmap', { fontsize: 14, pad: 20 });
    matplotlib.tight_layout();
    matplotlib.savefig('heatmap.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Heatmap saved to heatmap.png');
  }

  /**
   * Contour plots
   */
  static contourPlots(): void {
    console.log('\n=== Contour Plots ===\n');

    // Generate data
    const x = numpy.linspace(-3, 3, 100);
    const y = numpy.linspace(-3, 3, 100);
    const [X, Y] = numpy.meshgrid(x, y);
    const Z = numpy.sin(X) * numpy.cos(Y);

    // Create contour plot
    matplotlib.figure({ figsize: [12, 5] });

    // Filled contour
    matplotlib.subplot(1, 2, 1);
    const cf = matplotlib.contourf(X, Y, Z, { levels: 20, cmap: 'viridis' });
    matplotlib.colorbar(cf);
    matplotlib.title('Filled Contour Plot');
    matplotlib.xlabel('X');
    matplotlib.ylabel('Y');

    // Contour lines
    matplotlib.subplot(1, 2, 2);
    const c = matplotlib.contour(X, Y, Z, { levels: 15, cmap: 'coolwarm' });
    matplotlib.clabel(c, { inline: true, fontsize: 8 });
    matplotlib.colorbar(c);
    matplotlib.title('Contour Lines');
    matplotlib.xlabel('X');
    matplotlib.ylabel('Y');

    matplotlib.tight_layout();
    matplotlib.savefig('contour_plots.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Contour plots saved to contour_plots.png');
  }

  /**
   * Time series plots
   */
  static timeSeriesPlots(): void {
    console.log('\n=== Time Series Plots ===\n');

    // Generate time series data
    const dates = pandas.date_range('2024-01-01', { periods: 365, freq: 'D' });
    const values = numpy.cumsum(numpy.random.randn(365)) + 100;
    const ma7 = pandas.Series(values).rolling({ window: 7 }).mean();
    const ma30 = pandas.Series(values).rolling({ window: 30 }).mean();

    // Create plot
    matplotlib.figure({ figsize: [14, 6] });

    matplotlib.plot(dates, values, {
      label: 'Daily Values',
      color: 'gray',
      alpha: 0.5,
      linewidth: 1
    });

    matplotlib.plot(dates, ma7.values, {
      label: '7-day MA',
      color: 'blue',
      linewidth: 2
    });

    matplotlib.plot(dates, ma30.values, {
      label: '30-day MA',
      color: 'red',
      linewidth: 2
    });

    matplotlib.title('Time Series with Moving Averages', { fontsize: 14 });
    matplotlib.xlabel('Date');
    matplotlib.ylabel('Value');
    matplotlib.legend({ loc: 'best' });
    matplotlib.grid(true, { alpha: 0.3 });

    // Rotate x-axis labels
    matplotlib.xticks({ rotation: 45 });

    matplotlib.tight_layout();
    matplotlib.savefig('time_series_plots.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Time series plots saved to time_series_plots.png');
  }
}

/**
 * Seaborn Statistical Plots
 */
class SeabornPlots {
  /**
   * Distribution plots
   */
  static distributionPlots(): void {
    console.log('\n=== Seaborn Distribution Plots ===\n');

    seaborn.set_style('whitegrid');

    // Generate data
    const data = numpy.random.normal(0, 1, 1000);

    // Create figure
    matplotlib.figure({ figsize: [14, 10] });

    // Histogram with KDE
    matplotlib.subplot(2, 2, 1);
    seaborn.histplot({ data, kde: true, color: 'skyblue' });
    matplotlib.title('Histogram with KDE');

    // KDE plot
    matplotlib.subplot(2, 2, 2);
    seaborn.kdeplot({ data, fill: true, color: 'coral' });
    matplotlib.title('KDE Plot');

    // ECDF plot
    matplotlib.subplot(2, 2, 3);
    seaborn.ecdfplot({ data, color: 'green' });
    matplotlib.title('ECDF Plot');

    // Rug plot
    matplotlib.subplot(2, 2, 4);
    seaborn.rugplot({ data, color: 'purple', height: 0.1 });
    matplotlib.title('Rug Plot');

    matplotlib.tight_layout();
    matplotlib.savefig('seaborn_distributions.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Seaborn distribution plots saved to seaborn_distributions.png');
  }

  /**
   * Categorical plots
   */
  static categoricalPlots(): void {
    console.log('\n=== Seaborn Categorical Plots ===\n');

    // Generate data
    const df = pandas.DataFrame({
      category: numpy.random.choice(['A', 'B', 'C', 'D'], 200),
      value: numpy.random.randn(200),
      group: numpy.random.choice(['Group1', 'Group2'], 200)
    });

    // Create figure
    matplotlib.figure({ figsize: [14, 10] });

    // Box plot
    matplotlib.subplot(2, 2, 1);
    seaborn.boxplot({ data: df, x: 'category', y: 'value', hue: 'group' });
    matplotlib.title('Box Plot');

    // Violin plot
    matplotlib.subplot(2, 2, 2);
    seaborn.violinplot({ data: df, x: 'category', y: 'value', hue: 'group' });
    matplotlib.title('Violin Plot');

    // Strip plot
    matplotlib.subplot(2, 2, 3);
    seaborn.stripplot({ data: df, x: 'category', y: 'value', hue: 'group', alpha: 0.6 });
    matplotlib.title('Strip Plot');

    // Swarm plot
    matplotlib.subplot(2, 2, 4);
    seaborn.swarmplot({ data: df, x: 'category', y: 'value', hue: 'group' });
    matplotlib.title('Swarm Plot');

    matplotlib.tight_layout();
    matplotlib.savefig('seaborn_categorical.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Seaborn categorical plots saved to seaborn_categorical.png');
  }

  /**
   * Regression plots
   */
  static regressionPlots(): void {
    console.log('\n=== Seaborn Regression Plots ===\n');

    // Generate data
    const x = numpy.random.randn(100);
    const y = 2 * x + numpy.random.randn(100);
    const df = pandas.DataFrame({ x, y });

    // Create figure
    matplotlib.figure({ figsize: [14, 5] });

    // Linear regression plot
    matplotlib.subplot(1, 2, 1);
    seaborn.regplot({ data: df, x: 'x', y: 'y', color: 'blue' });
    matplotlib.title('Linear Regression');

    // Residuals plot
    matplotlib.subplot(1, 2, 2);
    seaborn.residplot({ data: df, x: 'x', y: 'y', color: 'red' });
    matplotlib.title('Residuals Plot');

    matplotlib.tight_layout();
    matplotlib.savefig('seaborn_regression.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Seaborn regression plots saved to seaborn_regression.png');
  }

  /**
   * Matrix plots
   */
  static matrixPlots(): void {
    console.log('\n=== Seaborn Matrix Plots ===\n');

    // Generate data
    const data = numpy.random.randn(50, 10);
    const df = pandas.DataFrame(data, {
      columns: Array.from({ length: 10 }, (_, i) => `V${i + 1}`)
    });

    // Correlation matrix
    const corr = df.corr();

    // Create figure
    matplotlib.figure({ figsize: [12, 10] });

    // Heatmap
    matplotlib.subplot(2, 1, 1);
    seaborn.heatmap(corr, {
      annot: true,
      fmt: '.2f',
      cmap: 'coolwarm',
      center: 0
    });
    matplotlib.title('Correlation Heatmap');

    // Clustermap (hierarchical clustering)
    matplotlib.subplot(2, 1, 2);
    const g = seaborn.clustermap(df.iloc(null, { slice: [0, 5] }), {
      cmap: 'viridis',
      figsize: [10, 8]
    });
    matplotlib.title('Clustermap');

    matplotlib.tight_layout();
    matplotlib.savefig('seaborn_matrix.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Seaborn matrix plots saved to seaborn_matrix.png');
  }

  /**
   * Pair plots
   */
  static pairPlots(): void {
    console.log('\n=== Seaborn Pair Plots ===\n');

    // Generate data
    const data = numpy.random.randn(200, 4);
    const df = pandas.DataFrame(data, {
      columns: ['Feature1', 'Feature2', 'Feature3', 'Feature4']
    });
    df['Category'] = numpy.random.choice(['A', 'B', 'C'], 200);

    // Create pair plot
    const g = seaborn.pairplot(df, { hue: 'Category', diag_kind: 'kde' });
    matplotlib.savefig('seaborn_pairplot.png', { dpi: 300, bbox_inches: 'tight' });
    matplotlib.close();

    console.log('Seaborn pair plot saved to seaborn_pairplot.png');
  }
}

/**
 * Custom Styling and Themes
 */
class CustomStyling {
  /**
   * Matplotlib styles
   */
  static matplotlibStyles(): void {
    console.log('\n=== Matplotlib Styles ===\n');

    const styles = ['default', 'seaborn-v0_8', 'ggplot', 'bmh', 'fivethirtyeight'];

    for (const style of styles) {
      try {
        matplotlib.style.use(style);

        matplotlib.figure({ figsize: [10, 6] });
        const x = numpy.linspace(0, 10, 100);
        const y1 = numpy.sin(x);
        const y2 = numpy.cos(x);

        matplotlib.plot(x, y1, { label: 'sin(x)', linewidth: 2 });
        matplotlib.plot(x, y2, { label: 'cos(x)', linewidth: 2 });

        matplotlib.title(`Style: ${style}`, { fontsize: 14 });
        matplotlib.legend();
        matplotlib.grid(true);

        matplotlib.savefig(`style_${style.replace('-', '_')}.png`, {
          dpi: 300,
          bbox_inches: 'tight'
        });
        matplotlib.close();

        console.log(`Saved ${style} style example`);
      } catch (error) {
        console.log(`Style ${style} not available`);
      }
    }
  }

  /**
   * Seaborn themes
   */
  static seabornThemes(): void {
    console.log('\n=== Seaborn Themes ===\n');

    const themes = ['darkgrid', 'whitegrid', 'dark', 'white', 'ticks'];

    for (const theme of themes) {
      seaborn.set_style(theme);

      matplotlib.figure({ figsize: [10, 6] });
      const data = numpy.random.randn(100);
      seaborn.histplot({ data, kde: true });

      matplotlib.title(`Seaborn Theme: ${theme}`, { fontsize: 14 });

      matplotlib.savefig(`theme_${theme}.png`, { dpi: 300, bbox_inches: 'tight' });
      matplotlib.close();

      console.log(`Saved ${theme} theme example`);
    }
  }

  /**
   * Custom color palettes
   */
  static colorPalettes(): void {
    console.log('\n=== Color Palettes ===\n');

    const palettes = ['deep', 'muted', 'bright', 'pastel', 'dark', 'colorblind'];

    for (const palette of palettes) {
      seaborn.set_palette(palette);

      matplotlib.figure({ figsize: [10, 6] });

      for (let i = 0; i < 6; i++) {
        const x = numpy.linspace(0, 10, 100);
        const y = numpy.sin(x + i);
        matplotlib.plot(x, y, { label: `Line ${i + 1}`, linewidth: 2 });
      }

      matplotlib.title(`Color Palette: ${palette}`, { fontsize: 14 });
      matplotlib.legend();
      matplotlib.grid(true, { alpha: 0.3 });

      matplotlib.savefig(`palette_${palette}.png`, { dpi: 300, bbox_inches: 'tight' });
      matplotlib.close();

      console.log(`Saved ${palette} palette example`);
    }
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('DATA VISUALIZATION WITH MATPLOTLIB AND SEABORN IN TYPESCRIPT');
  console.log('='.repeat(80));

  // Set default style
  seaborn.set_style('whitegrid');
  seaborn.set_palette('husl');

  // Basic plots
  BasicPlots.linePlots();
  BasicPlots.scatterPlots();
  BasicPlots.barPlots();
  BasicPlots.histograms();
  BasicPlots.boxPlots();

  // Advanced plots
  AdvancedPlots.subplotLayouts();
  AdvancedPlots.threeDPlots();
  AdvancedPlots.heatmaps();
  AdvancedPlots.contourPlots();
  AdvancedPlots.timeSeriesPlots();

  // Seaborn plots
  SeabornPlots.distributionPlots();
  SeabornPlots.categoricalPlots();
  SeabornPlots.regressionPlots();
  SeabornPlots.matrixPlots();
  SeabornPlots.pairPlots();

  // Custom styling
  CustomStyling.matplotlibStyles();
  CustomStyling.seabornThemes();
  CustomStyling.colorPalettes();

  console.log('\n' + '='.repeat(80));
  console.log('VISUALIZATION COMPLETE');
  console.log('All plots saved to current directory');
  console.log('='.repeat(80));
}

// Run the visualizations
if (require.main === module) {
  main();
}

export {
  BasicPlots,
  AdvancedPlots,
  SeabornPlots,
  CustomStyling
};
