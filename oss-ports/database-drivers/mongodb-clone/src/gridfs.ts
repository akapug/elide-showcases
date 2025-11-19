import * as types from './types';

export class GridFSBucket {
  private db: any;
  private options: types.GridFSBucketOptions;
  private bucketName: string;

  constructor(db: any, options: types.GridFSBucketOptions = {}) {
    this.db = db;
    this.options = options;
    this.bucketName = options.bucketName || 'fs';
  }

  async openUploadStream(filename: string, options?: { metadata?: types.Document; contentType?: string }): Promise<any> {
    return (globalThis as any).__elide_mongo_gridfs_upload?.(
      this.db._getConnection?.(),
      this.bucketName,
      filename,
      options
    );
  }

  async openDownloadStream(id: types.ObjectId): Promise<any> {
    return (globalThis as any).__elide_mongo_gridfs_download?.(
      this.db._getConnection?.(),
      this.bucketName,
      id
    );
  }

  async delete(id: types.ObjectId): Promise<void> {
    await this.db.collection(`${this.bucketName}.files`).deleteOne({ _id: id });
    await this.db.collection(`${this.bucketName}.chunks`).deleteMany({ files_id: id });
  }

  async find(filter: types.Filter = {}, options?: types.FindOptions): Promise<types.GridFSFile[]> {
    return this.db.collection(`${this.bucketName}.files`).find(filter, options).toArray();
  }

  async rename(id: types.ObjectId, newFilename: string): Promise<void> {
    await this.db.collection(`${this.bucketName}.files`).updateOne(
      { _id: id },
      { $set: { filename: newFilename } }
    );
  }

  async drop(): Promise<void> {
    await this.db.dropCollection(`${this.bucketName}.files`);
    await this.db.dropCollection(`${this.bucketName}.chunks`);
  }
}
