/**
 * Category Controller
 *
 * HTTP handlers for category endpoints
 */

import { IncomingMessage, ServerResponse } from 'http';
import { getStorage } from '../storage/storage';
import { Category } from '../models/Category';
import { sendJSON, sendError } from '../server';

interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export class CategoryController {
  private storage = getStorage();

  async getAll(req: Request, res: ServerResponse): Promise<void> {
    try {
      const categories = await this.storage.getCategories();
      sendJSON(res, categories);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getOne(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const category = await this.storage.getCategory(id);

      if (!category) {
        sendError(res, 404, 'Category not found');
        return;
      }

      sendJSON(res, category);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async create(req: Request, res: ServerResponse): Promise<void> {
    try {
      const category = new Category(req.body);

      const validation = category.validate();
      if (!validation.valid) {
        sendError(res, 400, validation.errors.join(', '));
        return;
      }

      await this.storage.saveCategory(category);
      sendJSON(res, category, 201);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async update(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const category = await this.storage.getCategory(id);

      if (!category) {
        sendError(res, 404, 'Category not found');
        return;
      }

      Object.assign(category, req.body);
      category.updatedAt = new Date();

      const validation = category.validate();
      if (!validation.valid) {
        sendError(res, 400, validation.errors.join(', '));
        return;
      }

      await this.storage.saveCategory(category);
      sendJSON(res, category);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async delete(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const category = await this.storage.getCategory(id);

      if (!category) {
        sendError(res, 404, 'Category not found');
        return;
      }

      if (category.isSystem) {
        sendError(res, 400, 'Cannot delete system category');
        return;
      }

      await this.storage.deleteCategory(id);
      sendJSON(res, { success: true });
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }
}
