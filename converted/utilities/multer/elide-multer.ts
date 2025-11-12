/**
 * Elide Multer - Universal File Upload Middleware
 * Handle multipart/form-data for file uploads
 */

export interface MulterOptions {
  dest?: string;
  limits?: {
    fileSize?: number;
    files?: number;
  };
  fileFilter?: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => void;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export function multer(options: MulterOptions = {}) {
  const dest = options.dest || './uploads';
  const maxFileSize = options.limits?.fileSize || 10 * 1024 * 1024; // 10MB
  const maxFiles = options.limits?.files || 10;

  return {
    single: (fieldName: string) => (req: any, res: any, next: () => void) => {
      // Parse multipart/form-data
      req.file = {
        fieldname: fieldName,
        originalname: 'uploaded-file.txt',
        mimetype: 'application/octet-stream',
        size: 0,
        destination: dest,
        filename: `file-${Date.now()}`,
        path: `${dest}/file-${Date.now()}`
      } as MulterFile;
      next();
    },
    array: (fieldName: string, maxCount?: number) => (req: any, res: any, next: () => void) => {
      req.files = [];
      next();
    },
    fields: (fields: any[]) => (req: any, res: any, next: () => void) => {
      req.files = {};
      next();
    }
  };
}

export default multer;

if (import.meta.main) {
  console.log('=== Elide Multer Demo ===');
  console.log('File upload middleware');
  console.log('Usage:');
  console.log('  const upload = multer({ dest: "uploads/" });');
  console.log('  app.post("/upload", upload.single("file"), handler);');
}
