"""
Matplotlib Integration Bridge

Comprehensive matplotlib plotting integration for real-time visualization,
publication-quality figures, and interactive plots from TypeScript.

Features:
- 2D and 3D plotting
- Multiple plot types (line, scatter, bar, histogram, etc.)
- Subplots and figure management
- Customizable styles and themes
- Export to multiple formats (PNG, PDF, SVG, EPS)
- Interactive backends support
- Animation capabilities
- LaTeX rendering support
"""

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.animation as animation
import matplotlib.patches as patches
import matplotlib.collections as collections
import numpy as np
from typing import Union, List, Tuple, Optional, Dict, Any
import io
import base64


class MatplotlibBridge:
    """
    Comprehensive Matplotlib bridge for visualization from TypeScript.
    """

    def __init__(self):
        self.figures = {}
        self.current_figure = None
        self.animations = {}
        self.default_style = 'seaborn-v0_8'

    # =========================================================================
    # Figure Management
    # =========================================================================

    def create_figure(self, figsize: Tuple[float, float] = (10, 6), dpi: int = 100,
                     facecolor: str = 'white', edgecolor: str = 'white') -> str:
        """Create new figure"""
        fig = plt.figure(figsize=figsize, dpi=dpi, facecolor=facecolor, edgecolor=edgecolor)
        fig_id = f"fig_{id(fig)}"
        self.figures[fig_id] = fig
        self.current_figure = fig
        return fig_id

    def create_subplots(self, nrows: int = 1, ncols: int = 1, figsize: Tuple[float, float] = (12, 8),
                       sharex: bool = False, sharey: bool = False, squeeze: bool = True) -> Tuple[str, Any]:
        """Create figure with subplots"""
        fig, axes = plt.subplots(nrows, ncols, figsize=figsize, sharex=sharex, sharey=sharey, squeeze=squeeze)
        fig_id = f"fig_{id(fig)}"
        self.figures[fig_id] = fig
        self.current_figure = fig
        return fig_id, axes

    def set_current_figure(self, fig_id: str) -> None:
        """Set current active figure"""
        if fig_id in self.figures:
            self.current_figure = self.figures[fig_id]
            plt.figure(self.current_figure.number)

    def close_figure(self, fig_id: Optional[str] = None) -> None:
        """Close figure"""
        if fig_id:
            if fig_id in self.figures:
                plt.close(self.figures[fig_id])
                del self.figures[fig_id]
        else:
            plt.close('all')
            self.figures.clear()

    def clear_figure(self, fig_id: Optional[str] = None) -> None:
        """Clear figure"""
        if fig_id:
            self.set_current_figure(fig_id)
        plt.clf()

    # =========================================================================
    # 2D Plotting
    # =========================================================================

    def plot(self, x: np.ndarray, y: np.ndarray, fmt: str = '', **kwargs) -> Any:
        """Create line plot"""
        return plt.plot(x, y, fmt, **kwargs)

    def scatter(self, x: np.ndarray, y: np.ndarray, s: Optional[Union[float, np.ndarray]] = None,
               c: Optional[Union[str, np.ndarray]] = None, **kwargs) -> Any:
        """Create scatter plot"""
        return plt.scatter(x, y, s=s, c=c, **kwargs)

    def bar(self, x: Union[np.ndarray, List], height: np.ndarray, width: float = 0.8, **kwargs) -> Any:
        """Create bar plot"""
        return plt.bar(x, height, width=width, **kwargs)

    def barh(self, y: Union[np.ndarray, List], width: np.ndarray, height: float = 0.8, **kwargs) -> Any:
        """Create horizontal bar plot"""
        return plt.barh(y, width, height=height, **kwargs)

    def hist(self, x: np.ndarray, bins: Union[int, str, np.ndarray] = 10, **kwargs) -> Tuple:
        """Create histogram"""
        return plt.hist(x, bins=bins, **kwargs)

    def hist2d(self, x: np.ndarray, y: np.ndarray, bins: Union[int, Tuple] = 10, **kwargs) -> Tuple:
        """Create 2D histogram"""
        return plt.hist2d(x, y, bins=bins, **kwargs)

    def boxplot(self, x: Union[np.ndarray, List[np.ndarray]], **kwargs) -> Dict:
        """Create box plot"""
        return plt.boxplot(x, **kwargs)

    def violinplot(self, dataset: Union[np.ndarray, List[np.ndarray]], positions: Optional[np.ndarray] = None,
                   **kwargs) -> Dict:
        """Create violin plot"""
        return plt.violinplot(dataset, positions=positions, **kwargs)

    def pie(self, x: np.ndarray, labels: Optional[List[str]] = None, autopct: Optional[str] = None, **kwargs) -> Tuple:
        """Create pie chart"""
        return plt.pie(x, labels=labels, autopct=autopct, **kwargs)

    def errorbar(self, x: np.ndarray, y: np.ndarray, yerr: Optional[np.ndarray] = None,
                xerr: Optional[np.ndarray] = None, **kwargs) -> Any:
        """Create error bar plot"""
        return plt.errorbar(x, y, yerr=yerr, xerr=xerr, **kwargs)

    def fill_between(self, x: np.ndarray, y1: np.ndarray, y2: Union[np.ndarray, float] = 0, **kwargs) -> Any:
        """Fill area between curves"""
        return plt.fill_between(x, y1, y2, **kwargs)

    def stem(self, x: np.ndarray, y: np.ndarray, linefmt: Optional[str] = None,
            markerfmt: Optional[str] = None, basefmt: Optional[str] = None, **kwargs) -> Any:
        """Create stem plot"""
        return plt.stem(x, y, linefmt=linefmt, markerfmt=markerfmt, basefmt=basefmt, **kwargs)

    def step(self, x: np.ndarray, y: np.ndarray, where: str = 'pre', **kwargs) -> List:
        """Create step plot"""
        return plt.step(x, y, where=where, **kwargs)

    # =========================================================================
    # Heatmaps and Contours
    # =========================================================================

    def imshow(self, X: np.ndarray, cmap: Optional[str] = None, aspect: str = 'equal',
              interpolation: Optional[str] = None, **kwargs) -> Any:
        """Display image/heatmap"""
        return plt.imshow(X, cmap=cmap, aspect=aspect, interpolation=interpolation, **kwargs)

    def pcolormesh(self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, cmap: Optional[str] = None,
                  shading: str = 'auto', **kwargs) -> Any:
        """Create pseudocolor plot"""
        return plt.pcolormesh(X, Y, Z, cmap=cmap, shading=shading, **kwargs)

    def contour(self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, levels: Optional[Union[int, np.ndarray]] = None,
               **kwargs) -> Any:
        """Create contour plot"""
        return plt.contour(X, Y, Z, levels=levels, **kwargs)

    def contourf(self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, levels: Optional[Union[int, np.ndarray]] = None,
                **kwargs) -> Any:
        """Create filled contour plot"""
        return plt.contourf(X, Y, Z, levels=levels, **kwargs)

    def streamplot(self, X: np.ndarray, Y: np.ndarray, U: np.ndarray, V: np.ndarray, **kwargs) -> Any:
        """Create stream plot"""
        return plt.streamplot(X, Y, U, V, **kwargs)

    def quiver(self, X: np.ndarray, Y: np.ndarray, U: np.ndarray, V: np.ndarray, **kwargs) -> Any:
        """Create quiver plot"""
        return plt.quiver(X, Y, U, V, **kwargs)

    # =========================================================================
    # 3D Plotting
    # =========================================================================

    def create_3d_axes(self, projection: str = '3d') -> Any:
        """Create 3D axes"""
        if self.current_figure is None:
            self.create_figure()
        return self.current_figure.add_subplot(111, projection=projection)

    def plot3d(self, ax: Any, x: np.ndarray, y: np.ndarray, z: np.ndarray, **kwargs) -> Any:
        """Create 3D line plot"""
        return ax.plot(x, y, z, **kwargs)

    def scatter3d(self, ax: Any, x: np.ndarray, y: np.ndarray, z: np.ndarray, **kwargs) -> Any:
        """Create 3D scatter plot"""
        return ax.scatter(x, y, z, **kwargs)

    def plot_surface(self, ax: Any, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, **kwargs) -> Any:
        """Create 3D surface plot"""
        return ax.plot_surface(X, Y, Z, **kwargs)

    def plot_wireframe(self, ax: Any, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, **kwargs) -> Any:
        """Create 3D wireframe plot"""
        return ax.plot_wireframe(X, Y, Z, **kwargs)

    def contour3d(self, ax: Any, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, **kwargs) -> Any:
        """Create 3D contour plot"""
        return ax.contour3D(X, Y, Z, **kwargs)

    def contourf3d(self, ax: Any, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, **kwargs) -> Any:
        """Create 3D filled contour plot"""
        return ax.contourf3D(X, Y, Z, **kwargs)

    # =========================================================================
    # Customization
    # =========================================================================

    def set_title(self, title: str, fontsize: int = 12, **kwargs) -> None:
        """Set plot title"""
        plt.title(title, fontsize=fontsize, **kwargs)

    def set_xlabel(self, label: str, fontsize: int = 10, **kwargs) -> None:
        """Set x-axis label"""
        plt.xlabel(label, fontsize=fontsize, **kwargs)

    def set_ylabel(self, label: str, fontsize: int = 10, **kwargs) -> None:
        """Set y-axis label"""
        plt.ylabel(label, fontsize=fontsize, **kwargs)

    def set_xlim(self, left: Optional[float] = None, right: Optional[float] = None) -> None:
        """Set x-axis limits"""
        plt.xlim(left, right)

    def set_ylim(self, bottom: Optional[float] = None, top: Optional[float] = None) -> None:
        """Set y-axis limits"""
        plt.ylim(bottom, top)

    def set_xscale(self, scale: str) -> None:
        """Set x-axis scale (linear, log, etc.)"""
        plt.xscale(scale)

    def set_yscale(self, scale: str) -> None:
        """Set y-axis scale (linear, log, etc.)"""
        plt.yscale(scale)

    def grid(self, visible: bool = True, which: str = 'major', axis: str = 'both', **kwargs) -> None:
        """Configure grid"""
        plt.grid(visible, which=which, axis=axis, **kwargs)

    def legend(self, labels: Optional[List[str]] = None, loc: str = 'best', **kwargs) -> Any:
        """Add legend"""
        if labels:
            return plt.legend(labels, loc=loc, **kwargs)
        return plt.legend(loc=loc, **kwargs)

    def colorbar(self, mappable: Optional[Any] = None, **kwargs) -> Any:
        """Add colorbar"""
        return plt.colorbar(mappable, **kwargs)

    def tight_layout(self, **kwargs) -> None:
        """Adjust subplot layout"""
        plt.tight_layout(**kwargs)

    def text(self, x: float, y: float, s: str, **kwargs) -> Any:
        """Add text annotation"""
        return plt.text(x, y, s, **kwargs)

    def annotate(self, text: str, xy: Tuple[float, float], xytext: Tuple[float, float],
                arrowprops: Optional[Dict] = None, **kwargs) -> Any:
        """Add annotation with arrow"""
        return plt.annotate(text, xy=xy, xytext=xytext, arrowprops=arrowprops, **kwargs)

    def axhline(self, y: float = 0, **kwargs) -> Any:
        """Add horizontal line"""
        return plt.axhline(y=y, **kwargs)

    def axvline(self, x: float = 0, **kwargs) -> Any:
        """Add vertical line"""
        return plt.axvline(x=x, **kwargs)

    def axhspan(self, ymin: float, ymax: float, **kwargs) -> Any:
        """Add horizontal span"""
        return plt.axhspan(ymin, ymax, **kwargs)

    def axvspan(self, xmin: float, xmax: float, **kwargs) -> Any:
        """Add vertical span"""
        return plt.axvspan(xmin, xmax, **kwargs)

    # =========================================================================
    # Styling
    # =========================================================================

    def set_style(self, style: str) -> None:
        """Set plot style"""
        plt.style.use(style)

    def available_styles(self) -> List[str]:
        """Get available styles"""
        return plt.style.available

    def set_rc_params(self, params: Dict[str, Any]) -> None:
        """Set matplotlib rc parameters"""
        plt.rcParams.update(params)

    def get_rc_params(self) -> Dict[str, Any]:
        """Get current rc parameters"""
        return dict(plt.rcParams)

    def set_font_size(self, size: int) -> None:
        """Set global font size"""
        plt.rcParams.update({'font.size': size})

    def set_line_width(self, width: float) -> None:
        """Set global line width"""
        plt.rcParams.update({'lines.linewidth': width})

    # =========================================================================
    # Animation
    # =========================================================================

    def create_animation(self, fig: Any, update_func: callable, frames: int = 100,
                        interval: int = 50, blit: bool = False, repeat: bool = True) -> str:
        """Create animation"""
        anim = animation.FuncAnimation(fig, update_func, frames=frames, interval=interval,
                                      blit=blit, repeat=repeat)
        anim_id = f"anim_{id(anim)}"
        self.animations[anim_id] = anim
        return anim_id

    def save_animation(self, anim_id: str, filename: str, writer: str = 'pillow',
                      fps: int = 30, dpi: int = 100) -> None:
        """Save animation to file"""
        if anim_id in self.animations:
            self.animations[anim_id].save(filename, writer=writer, fps=fps, dpi=dpi)

    # =========================================================================
    # Export and Display
    # =========================================================================

    def savefig(self, filename: str, dpi: int = 100, bbox_inches: str = 'tight',
               transparent: bool = False, format: Optional[str] = None, **kwargs) -> None:
        """Save figure to file"""
        plt.savefig(filename, dpi=dpi, bbox_inches=bbox_inches, transparent=transparent,
                   format=format, **kwargs)

    def save_to_buffer(self, format: str = 'png', dpi: int = 100, **kwargs) -> bytes:
        """Save figure to buffer"""
        buf = io.BytesIO()
        plt.savefig(buf, format=format, dpi=dpi, **kwargs)
        buf.seek(0)
        return buf.read()

    def save_to_base64(self, format: str = 'png', dpi: int = 100, **kwargs) -> str:
        """Save figure as base64 string"""
        image_data = self.save_to_buffer(format=format, dpi=dpi, **kwargs)
        return base64.b64encode(image_data).decode('utf-8')

    def show(self) -> None:
        """Display plot (for interactive backends)"""
        plt.show()

    def draw(self) -> None:
        """Redraw current figure"""
        plt.draw()

    def pause(self, interval: float) -> None:
        """Pause for interval seconds"""
        plt.pause(interval)

    # =========================================================================
    # Utility Functions
    # =========================================================================

    def get_current_figure(self) -> Any:
        """Get current figure"""
        return plt.gcf()

    def get_current_axes(self) -> Any:
        """Get current axes"""
        return plt.gca()

    def get_figure_size(self, fig_id: Optional[str] = None) -> Tuple[float, float]:
        """Get figure size"""
        if fig_id and fig_id in self.figures:
            fig = self.figures[fig_id]
        else:
            fig = plt.gcf()
        return fig.get_size_inches()

    def set_figure_size(self, width: float, height: float, fig_id: Optional[str] = None) -> None:
        """Set figure size"""
        if fig_id and fig_id in self.figures:
            fig = self.figures[fig_id]
        else:
            fig = plt.gcf()
        fig.set_size_inches(width, height)

    def get_xlim(self) -> Tuple[float, float]:
        """Get x-axis limits"""
        return plt.xlim()

    def get_ylim(self) -> Tuple[float, float]:
        """Get y-axis limits"""
        return plt.ylim()

    def clear_axes(self) -> None:
        """Clear current axes"""
        plt.cla()

    def get_figure_list(self) -> List[str]:
        """Get list of figure IDs"""
        return list(self.figures.keys())

    def subplot(self, nrows: int, ncols: int, index: int, **kwargs) -> Any:
        """Create subplot"""
        return plt.subplot(nrows, ncols, index, **kwargs)

    def suptitle(self, title: str, **kwargs) -> Any:
        """Add figure title"""
        return plt.suptitle(title, **kwargs)

    # =========================================================================
    # Advanced Plotting
    # =========================================================================

    def hexbin(self, x: np.ndarray, y: np.ndarray, C: Optional[np.ndarray] = None,
              gridsize: int = 100, **kwargs) -> Any:
        """Create hexagonal binning plot"""
        return plt.hexbin(x, y, C=C, gridsize=gridsize, **kwargs)

    def tricontour(self, x: np.ndarray, y: np.ndarray, z: np.ndarray, **kwargs) -> Any:
        """Create triangular contour plot"""
        return plt.tricontour(x, y, z, **kwargs)

    def tricontourf(self, x: np.ndarray, y: np.ndarray, z: np.ndarray, **kwargs) -> Any:
        """Create filled triangular contour plot"""
        return plt.tricontourf(x, y, z, **kwargs)

    def tripcolor(self, x: np.ndarray, y: np.ndarray, z: np.ndarray, **kwargs) -> Any:
        """Create triangular pseudocolor plot"""
        return plt.tripcolor(x, y, z, **kwargs)

    def spy(self, Z: np.ndarray, **kwargs) -> Any:
        """Visualize sparsity pattern"""
        return plt.spy(Z, **kwargs)

    def matshow(self, A: np.ndarray, **kwargs) -> Any:
        """Display matrix as image"""
        return plt.matshow(A, **kwargs)

    def eventplot(self, positions: Union[np.ndarray, List[np.ndarray]], **kwargs) -> Any:
        """Create event plot"""
        return plt.eventplot(positions, **kwargs)

    def broken_barh(self, xranges: List[Tuple], yrange: Tuple, **kwargs) -> Any:
        """Create broken horizontal bar plot"""
        return plt.broken_barh(xranges, yrange, **kwargs)

    def stackplot(self, x: np.ndarray, *args, labels: Optional[List[str]] = None, **kwargs) -> Any:
        """Create stacked area plot"""
        return plt.stackplot(x, *args, labels=labels, **kwargs)

    # =========================================================================
    # Polar Plots
    # =========================================================================

    def polar_plot(self, theta: np.ndarray, r: np.ndarray, **kwargs) -> Any:
        """Create polar plot"""
        ax = plt.subplot(111, projection='polar')
        return ax.plot(theta, r, **kwargs)

    def polar_scatter(self, theta: np.ndarray, r: np.ndarray, **kwargs) -> Any:
        """Create polar scatter plot"""
        ax = plt.subplot(111, projection='polar')
        return ax.scatter(theta, r, **kwargs)

    # =========================================================================
    # Statistical Plots
    # =========================================================================

    def acorr(self, x: np.ndarray, **kwargs) -> Tuple:
        """Plot autocorrelation"""
        return plt.acorr(x, **kwargs)

    def xcorr(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Tuple:
        """Plot cross-correlation"""
        return plt.xcorr(x, y, **kwargs)

    def psd(self, x: np.ndarray, NFFT: int = 256, Fs: float = 2, **kwargs) -> Tuple:
        """Plot power spectral density"""
        return plt.psd(x, NFFT=NFFT, Fs=Fs, **kwargs)

    def specgram(self, x: np.ndarray, NFFT: int = 256, Fs: float = 2, **kwargs) -> Tuple:
        """Plot spectrogram"""
        return plt.specgram(x, NFFT=NFFT, Fs=Fs, **kwargs)

    def magnitude_spectrum(self, x: np.ndarray, Fs: float = 2, **kwargs) -> Tuple:
        """Plot magnitude spectrum"""
        return plt.magnitude_spectrum(x, Fs=Fs, **kwargs)

    def phase_spectrum(self, x: np.ndarray, Fs: float = 2, **kwargs) -> Tuple:
        """Plot phase spectrum"""
        return plt.phase_spectrum(x, Fs=Fs, **kwargs)

    def angle_spectrum(self, x: np.ndarray, Fs: float = 2, **kwargs) -> Tuple:
        """Plot angle spectrum"""
        return plt.angle_spectrum(x, Fs=Fs, **kwargs)


# Create global instance
matplotlib_bridge = MatplotlibBridge()


# Export convenience functions
def plot(x, y, **kwargs):
    """Create line plot"""
    return matplotlib_bridge.plot(x, y, **kwargs)


def scatter(x, y, **kwargs):
    """Create scatter plot"""
    return matplotlib_bridge.scatter(x, y, **kwargs)


def savefig(filename, **kwargs):
    """Save figure"""
    return matplotlib_bridge.savefig(filename, **kwargs)


def show():
    """Show plot"""
    return matplotlib_bridge.show()
