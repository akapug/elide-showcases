/**
 * React Hot Toast - Smoking Hot React Notifications
 *
 * Smoking hot React notifications.
 * **POLYGLOT SHOWCASE**: Hot toast notifications for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-hot-toast (~300K+ downloads/week)
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class toast {
  static success(message: string): void {
    console.log(`✅ ${message}`);
  }

  static error(message: string): void {
    console.log(`❌ ${message}`);
  }

  static loading(message: string): void {
    console.log(`⏳ ${message}`);
  }

  static custom(message: string): void {
    console.log(`🔔 ${message}`);
  }

  static promise<T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }): Promise<T> {
    console.log(`⏳ ${messages.loading}`);
    return promise.then(
      (result) => {
        console.log(`✅ ${messages.success}`);
        return result;
      },
      (error) => {
        console.log(`❌ ${messages.error}`);
        throw error;
      }
    );
  }
}

export class Toaster {
  static render(props?: { position?: string }): string {
    return `<div class="hot-toast-container" data-position="${props?.position || 'top-center'}"></div>`;
  }
}

export default { toast, Toaster };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Hot Toast - Smoking Hot Notifications (POLYGLOT!)\n");
  toast.success('Task completed!');
  toast.error('Something went wrong');
  toast.loading('Processing...');
  toast.custom('Custom notification');
  console.log(Toaster.render({ position: 'top-center' }));
  console.log("\n🚀 ~300K+ downloads/week!");
}
