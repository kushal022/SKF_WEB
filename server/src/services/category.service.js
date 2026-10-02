const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { parsePagination, formatPaginatedResponse } = require('../utils/pagination');
const auditService = require('./audit.service');

/**
 * Format category model instance into safe API representation.
 */
const sanitizeCategory = (category) => {
  if (!category) return null;

  return {
    public_id: category.public_id,
    name: category.name,
    slug: category.slug,
    description: category.description || null,
    image_url: category.image_url || null,
    sort_order: category.sort_order,
    is_active: Boolean(category.is_active),
    seo_title: category.seo_title || null,
    seo_description: category.seo_description || null,
    parent: category.parent
      ? {
          public_id: category.parent.public_id,
          name: category.parent.name,
          slug: category.parent.slug,
        }
      : null,
    children: Array.isArray(category.children)
      ? category.children.map((child) => ({
          public_id: child.public_id,
          name: child.name,
          slug: child.slug,
          image_url: child.image_url || null,
          sort_order: child.sort_order,
          is_active: Boolean(child.is_active),
        }))
      : undefined,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
};

/**
 * Public category list (defaults to active only).
 */
const getPublicCategories = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Category.query()
    .where('is_active', true)
    .withGraphFetched('[parent(selectBasic), children(selectActive)]')
    .modifiers({
      selectBasic(b) {
        b.select('id', 'public_id', 'name', 'slug');
      },
      selectActive(b) {
        b.select('id', 'public_id', 'parent_id', 'name', 'slug', 'image_url', 'sort_order', 'is_active')
          .where('is_active', true)
          .orderBy('sort_order', 'asc');
      },
    });

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('name', 'like', term).orWhere('description', 'like', term);
    });
  }

  if (query.parent_public_id !== undefined) {
    if (query.parent_public_id === null || query.parent_public_id === 'null') {
      builder = builder.whereNull('parent_id');
    } else {
      const parent = await Category.query().where({ public_id: query.parent_public_id }).first();
      builder = builder.where('parent_id', parent ? parent.id : 0);
    }
  }

  // Sorting
  const sortParam = query.sort || 'sort_order';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  builder = builder.orderBy(sortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map(sanitizeCategory),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Public category detail by publicId.
 */
const getPublicCategoryByPublicId = async (publicId) => {
  const category = await Category.query()
    .where({ public_id: publicId, is_active: true })
    .withGraphFetched('[parent, children(selectActive)]')
    .modifiers({
      selectActive(b) {
        b.where('is_active', true).orderBy('sort_order', 'asc');
      },
    })
    .first();

  if (!category) {
    throw new ApiError(404, 'Category not found or inactive', 'CATEGORY_NOT_FOUND');
  }

  return sanitizeCategory(category);
};

/**
 * Admin category list (supports filtering active/inactive).
 */
const getAdminCategories = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  let builder = Category.query().withGraphFetched('[parent, children]');

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    builder = builder.where((b) => {
      b.where('name', 'like', term)
        .orWhere('slug', 'like', term)
        .orWhere('description', 'like', term);
    });
  }

  if (query.is_active !== undefined) {
    builder = builder.where('is_active', query.is_active);
  }

  if (query.parent_public_id !== undefined) {
    if (query.parent_public_id === null || query.parent_public_id === 'null') {
      builder = builder.whereNull('parent_id');
    } else {
      const parent = await Category.query().where({ public_id: query.parent_public_id }).first();
      builder = builder.where('parent_id', parent ? parent.id : 0);
    }
  }

  const sortParam = query.sort || 'sort_order';
  const isDesc = sortParam.startsWith('-');
  const sortField = isDesc ? sortParam.slice(1) : sortParam;
  builder = builder.orderBy(sortField, isDesc ? 'desc' : 'asc');

  const [totalRes, items] = await Promise.all([
    builder.resultSize(),
    builder.offset(offset).limit(limit),
  ]);

  return formatPaginatedResponse({
    items: items.map(sanitizeCategory),
    total: totalRes,
    page,
    limit,
  });
};

/**
 * Admin category detail.
 */
const getCategoryByPublicId = async (publicId) => {
  const category = await Category.query()
    .where({ public_id: publicId })
    .withGraphFetched('[parent, children]')
    .first();

  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  return sanitizeCategory(category);
};

/**
 * Admin create category.
 */
const createCategory = async (data, req) => {
  // Check unique slug
  const existingSlug = await Category.query().where({ slug: data.slug }).first();
  if (existingSlug) {
    throw new ApiError(409, 'Category slug already exists', 'DUPLICATE_SLUG');
  }

  let parent_id = null;
  if (data.parent_public_id) {
    const parent = await Category.query().where({ public_id: data.parent_public_id }).first();
    if (!parent) {
      throw new ApiError(404, 'Parent category not found', 'PARENT_NOT_FOUND');
    }
    parent_id = parent.id;
  }

  const { parent_public_id, ...categoryFields } = data;
  const newCategory = await Category.query()
    .insertAndFetch({
      ...categoryFields,
      parent_id,
    })
    .withGraphFetched('parent');

  await auditService.logRequestAction(req, {
    action: 'CREATE_CATEGORY',
    entityType: 'Category',
    entityId: newCategory.id,
    newValues: sanitizeCategory(newCategory),
  });

  return sanitizeCategory(newCategory);
};

/**
 * Admin update category.
 */
const updateCategory = async (publicId, data, req) => {
  const category = await Category.query().where({ public_id: publicId }).first();
  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  // Check unique slug if changing
  if (data.slug && data.slug !== category.slug) {
    const existingSlug = await Category.query()
      .where({ slug: data.slug })
      .whereNot('id', category.id)
      .first();

    if (existingSlug) {
      throw new ApiError(409, 'Category slug already exists', 'DUPLICATE_SLUG');
    }
  }

  const patchPayload = { ...data };
  delete patchPayload.parent_public_id;

  if (data.parent_public_id !== undefined) {
    if (data.parent_public_id === null) {
      patchPayload.parent_id = null;
    } else {
      if (data.parent_public_id === publicId) {
        throw new ApiError(400, 'A category cannot be its own parent', 'CIRCULAR_PARENT_ERROR');
      }

      const parent = await Category.query().where({ public_id: data.parent_public_id }).first();
      if (!parent) {
        throw new ApiError(404, 'Parent category not found', 'PARENT_NOT_FOUND');
      }

      // Check circular reference: traverse up from the proposed new parent
      let currentParentId = parent.parent_id;
      while (currentParentId) {
        if (currentParentId === category.id) {
          throw new ApiError(
            400,
            'Cannot set a child or descendant as parent (circular hierarchy detected)',
            'CIRCULAR_PARENT_ERROR'
          );
        }
        const ancestor = await Category.query().findById(currentParentId).select('parent_id');
        currentParentId = ancestor?.parent_id || null;
      }

      patchPayload.parent_id = parent.id;
    }
  }

  const oldValues = sanitizeCategory(category);
  const updated = await Category.query()
    .patchAndFetchById(category.id, patchPayload)
    .withGraphFetched('[parent, children]');

  await auditService.logRequestAction(req, {
    action: 'UPDATE_CATEGORY',
    entityType: 'Category',
    entityId: updated.id,
    oldValues,
    newValues: sanitizeCategory(updated),
  });

  return sanitizeCategory(updated);
};

/**
 * Admin delete category.
 */
const deleteCategory = async (publicId, req) => {
  const category = await Category.query().where({ public_id: publicId }).first();
  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  // Safe deletion check: prevent deleting if products belong to category (matches FK RESTRICT)
  const productCountRes = await Product.query()
    .where({ category_id: category.id })
    .count('* as count')
    .first();

  const productCount = Number(productCountRes?.count || 0);
  if (productCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete category: it is associated with ${productCount} product(s). Reassign or delete products first.`,
      'CATEGORY_HAS_PRODUCTS'
    );
  }

  const oldValues = sanitizeCategory(category);

  // Set child categories parent_id to null
  await Category.query().where({ parent_id: category.id }).patch({ parent_id: null });
  await Category.query().deleteById(category.id);

  await auditService.logRequestAction(req, {
    action: 'DELETE_CATEGORY',
    entityType: 'Category',
    entityId: category.id,
    oldValues,
  });

  return true;
};

module.exports = {
  getPublicCategories,
  getPublicCategoryByPublicId,
  getAdminCategories,
  getCategoryByPublicId,
  createCategory,
  updateCategory,
  deleteCategory,
};
