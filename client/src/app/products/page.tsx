'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Layers,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { Button, Select, Badge, Skeleton } from '@/components/ui';
import EnquiryModal from '@/components/EnquiryModal';
import { getPublicCategories, getPublicProducts, getPublicSettings } from '@/lib/api';
import { buildWhatsAppUrl, buildProductEnquiryMessage } from '@/lib/whatsapp';
import type { Product, Category, WebsiteSettings } from '@/types';

function ProductsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || '-created_at';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Quote modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    name: string;
    code: string;
    publicId: string;
  } | null>(null);

  // Load Categories & Settings once
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const [catsRes, settingsRes] = await Promise.all([
          getPublicCategories({ limit: 50, sort: 'sort_order' }),
          getPublicSettings(),
        ]);
        if (!isMounted) return;
        setCategories(catsRes.items);
        setSettings(settingsRes);
      } catch (err) {
        console.error('[Catalog] Meta load error:', err);
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update query params in URL
  const updateUrl = useCallback((cat: string, search: string, sort: string, page: number) => {
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (search) params.set('search', search);
    if (sort && sort !== '-created_at') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [router]);

  // Fetch products whenever filters or pagination change
  useEffect(() => {
    let isMounted = true;
    async function fetchCatalog() {
      setLoading(true);
      try {
        const res = await getPublicProducts({
          category_slug: selectedCategory || undefined,
          search: searchTerm || undefined,
          sort: sortBy,
          page: currentPage,
          limit: 9,
        });

        if (!isMounted) return;
        setProducts(res.items);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } catch (err) {
        console.error('[Catalog] Products load error:', err);
        if (isMounted) {
          setProducts([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchTerm, sortBy, currentPage]);

  const handleCategorySelect = (slug: string) => {
    const nextCat = selectedCategory === slug ? '' : slug;
    setSelectedCategory(nextCat);
    setCurrentPage(1);
    updateUrl(nextCat, searchTerm, sortBy, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrl(selectedCategory, searchTerm, sortBy, 1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSort = e.target.value;
    setSortBy(nextSort);
    setCurrentPage(1);
    updateUrl(selectedCategory, searchTerm, nextSort, 1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setSortBy('-created_at');
    setCurrentPage(1);
    updateUrl('', '', '-created_at', 1);
  };

  const openQuoteForProduct = (product: Product) => {
    setSelectedProduct({
      name: product.name,
      code: product.product_code,
      publicId: product.public_id,
    });
    setQuoteModalOpen(true);
  };

  const activeCategoryObject = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-[var(--border-border)] pb-6">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold">Products</span>
          {activeCategoryObject && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--brand-accent)] font-semibold">{activeCategoryObject.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              {activeCategoryObject ? activeCategoryObject.name : 'Stainless Steel Furniture Catalog'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              {activeCategoryObject?.description || 'Browse our complete catalog of surgical-grade 304 and 316 stainless steel beds, dining tables, seating, storage, and architectural fabrication.'}
            </p>
          </div>
          <div className="text-xs text-[var(--text-muted)] shrink-0 font-medium">
            Showing <span className="font-bold text-[var(--text-primary)]">{products.length}</span> of {totalCount} items
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--surface-surface)] border border-[var(--border-border)] rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-8 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name, code (e.g. SKF-BED), finish, or material..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border-border)] bg-[var(--surface-background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>

          {/* Sort By Dropdown */}
          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <Select
              id="catalog-sort"
              value={sortBy}
              onChange={handleSortChange}
              options={[
                { value: '-created_at', label: 'Newest Arrivals' },
                { value: 'name', label: 'Name (A to Z)' },
                { value: '-name', label: 'Name (Z to A)' },
              ]}
              className="text-xs py-1.5"
            />
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="pt-2 border-t border-[var(--border-border)] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              !selectedCategory
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-border)]'
            }`}
          >
            All Products
          </button>

          {categories.map((cat) => (
            <button
              key={cat.public_id}
              type="button"
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-border)]'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {(selectedCategory || searchTerm) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold shrink-0 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-border)] p-4 space-y-4 bg-[var(--surface-surface)]">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface-surface)] rounded-2xl border border-[var(--border-border)] space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">No Furniture Found</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We couldn&apos;t find any items matching your current filters. Try changing your search query or reset the category selection.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const productImg = product.primary_image?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
            const productWhatsappUrl = buildWhatsAppUrl({
              phone: settings?.whatsapp_number,
              message: buildProductEnquiryMessage(product.name, product.product_code, settings?.site_name),
            });

            return (
              <div
                key={product.public_id}
                className="rounded-xl overflow-hidden bg-[var(--surface-surface)] border border-[var(--border-border)] hover:border-[var(--brand-accent)] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={productImg}
                    alt={product.primary_image?.alt_text || product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge variant="primary" size="sm">
                      {product.product_code}
                    </Badge>
                    {product.finish && (
                      <Badge variant="info" size="sm">
                        {product.finish.split(' ')[0]}
                      </Badge>
                    )}
                  </div>
                  {product.category && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {product.category.name}
                    </span>
                  )}
                </Link>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link href={`/products/${product.slug}`} className="block">
                      <h3 className="font-bold text-base text-[var(--text-primary)] hover:text-[var(--brand-accent)] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {product.short_description || 'High-tensile Grade 304 stainless steel craftsmanship with custom sizing.'}
                    </p>
                    {product.material && (
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{product.material}</span>
                      </div>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="pt-3 border-t border-[var(--border-border)] flex items-center justify-between gap-2">
                    <Link href={`/products/${product.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        View Details
                      </Button>
                    </Link>
                    <a
                      href={productWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </a>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openQuoteForProduct(product)}
                      className="text-xs"
                    >
                      Quote
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const prev = Math.max(currentPage - 1, 1);
              setCurrentPage(prev);
              updateUrl(selectedCategory, searchTerm, sortBy, prev);
            }}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>

          <span className="text-xs text-[var(--text-secondary)] font-medium px-2">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = Math.min(currentPage + 1, totalPages);
              setCurrentPage(next);
              updateUrl(selectedCategory, searchTerm, sortBy, next);
            }}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Quote Modal */}
      <EnquiryModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productName={selectedProduct?.name}
        productCode={selectedProduct?.code}
        productPublicId={selectedProduct?.publicId}
        source="catalog_page"
        settings={settings}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-xs text-[var(--text-muted)]">
          Loading catalog collections...
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}
