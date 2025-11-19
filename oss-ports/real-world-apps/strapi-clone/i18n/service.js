/**
 * Internationalization (i18n) Service
 * Multi-language content support
 */

import { getDatabase } from '../database/connection.js';
import { logger } from '../core/logger.js';

export class I18nService {
  constructor(config) {
    this.config = config;
    this.enabled = config.enabled !== false;
    this.defaultLocale = config.defaultLocale || 'en';
    this.locales = config.locales || ['en'];
    this.logger = logger.child('I18n');
  }

  /**
   * Get available locales
   */
  getLocales() {
    return this.locales.map(locale => ({
      code: locale,
      name: this.getLocaleName(locale),
      isDefault: locale === this.defaultLocale,
    }));
  }

  /**
   * Get locale name
   */
  getLocaleName(code) {
    const names = {
      en: 'English',
      fr: 'Français',
      es: 'Español',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      zh: '中文',
      ar: 'العربية',
    };

    return names[code] || code.toUpperCase();
  }

  /**
   * Create localized content
   */
  async createLocalization(contentType, entityId, locale, data) {
    if (!this.enabled) {
      throw new Error('i18n is not enabled');
    }

    if (!this.locales.includes(locale)) {
      throw new Error(`Locale ${locale} is not configured`);
    }

    const db = getDatabase();
    const tableName = `ct_${contentType.singularName.toLowerCase()}`;

    // Create localization entry
    const result = await db.execute(
      `INSERT INTO ${tableName} (${this.getLocalizedColumns(data)}, locale, localized_from)
       VALUES (${this.getPlaceholders(data)}, ?, ?)`,
      [...Object.values(data), locale, entityId]
    );

    this.logger.info(`Localization created for ${contentType.uid}: ${locale}`);

    return result.lastInsertRowid || result.insertId;
  }

  /**
   * Get localizations for entity
   */
  async getLocalizations(contentType, entityId) {
    const db = getDatabase();
    const tableName = `ct_${contentType.singularName.toLowerCase()}`;

    const localizations = await db.query(
      `SELECT * FROM ${tableName} WHERE id = ? OR localized_from = ?`,
      [entityId, entityId]
    );

    return localizations.map(l => ({
      ...l,
      locale: l.locale || this.defaultLocale,
    }));
  }

  /**
   * Delete localization
   */
  async deleteLocalization(contentType, id) {
    const db = getDatabase();
    const tableName = `ct_${contentType.singularName.toLowerCase()}`;

    await db.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

    this.logger.info(`Localization deleted: ${id}`);

    return true;
  }

  /**
   * Extend content type schema for i18n
   */
  extendContentType(contentType) {
    if (!this.enabled) {
      return contentType;
    }

    // Add locale field
    contentType.attributes.locale = {
      type: 'string',
      default: this.defaultLocale,
    };

    // Add localized_from field (points to original entry)
    contentType.attributes.localized_from = {
      type: 'integer',
    };

    return contentType;
  }

  /**
   * Filter by locale
   */
  async filterByLocale(query, locale) {
    if (!this.enabled) {
      return query;
    }

    const filterLocale = locale || this.defaultLocale;

    return {
      ...query,
      where: {
        ...query.where,
        locale: filterLocale,
      },
    };
  }

  /**
   * Get localized columns
   */
  getLocalizedColumns(data) {
    return Object.keys(data).join(', ');
  }

  /**
   * Get placeholders
   */
  getPlaceholders(data) {
    return Object.keys(data).map(() => '?').join(', ');
  }
}

/**
 * Locale Middleware
 * Detects and sets locale from request
 */
export function localeMiddleware(i18nService) {
  return (req, res, next) => {
    // Get locale from query, header, or use default
    const locale =
      req.query.locale ||
      req.headers['accept-language']?.split(',')[0] ||
      i18nService.defaultLocale;

    // Validate locale
    if (i18nService.locales.includes(locale)) {
      req.locale = locale;
    } else {
      req.locale = i18nService.defaultLocale;
    }

    next();
  };
}

/**
 * Translation Service
 * Manages UI translations
 */
export class TranslationService {
  constructor() {
    this.translations = new Map();
  }

  /**
   * Load translations
   */
  async loadTranslations(locale) {
    // In production, load from files or database
    // For now, return mock translations
    const translations = {
      en: {
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'content.create': 'Create new entry',
        'content.update': 'Update entry',
      },
      fr: {
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'content.create': 'Créer une nouvelle entrée',
        'content.update': 'Mettre à jour l\'entrée',
      },
    };

    this.translations.set(locale, translations[locale] || translations.en);
    return translations[locale];
  }

  /**
   * Translate key
   */
  translate(locale, key, params = {}) {
    const translations = this.translations.get(locale);

    if (!translations) {
      return key;
    }

    let translation = translations[key] || key;

    // Replace parameters
    for (const [param, value] of Object.entries(params)) {
      translation = translation.replace(`{${param}}`, value);
    }

    return translation;
  }

  /**
   * Get all translations for locale
   */
  getTranslations(locale) {
    return this.translations.get(locale) || {};
  }
}
