/**
 * React Toastify - Toast Notifications
 *
 * React notification made easy.
 * **POLYGLOT SHOWCASE**: Toast notifications for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-toastify (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export class toast {
  static success(message: string): void {
    console.log(`✅ ${message}`);
  }

  static error(message: string): void {
    console.log(`❌ ${message}`);
  }

  static warning(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  static info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  static default(message: string): void {
    console.log(`🔔 ${message}`);
  }
}

export class ToastContainer {
  static render(props?: { position?: string; autoClose?: number }): string {
    return `<div class="Toastify__toast-container Toastify__toast-container--${props?.position || 'top-right'}"></div>`;
  }
}

export default { toast, ToastContainer };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Toastify - Toast Notifications (POLYGLOT!)\n");
  toast.success('Profile updated successfully!');
  toast.error('Failed to save changes');
  toast.warning('Your session will expire soon');
  toast.info('New features available');
  console.log(ToastContainer.render({ position: 'top-right', autoClose: 5000 }));
  console.log("\n🚀 ~1M+ downloads/week!");
}
