import React from "react";

interface SkeletonProps {
  className?: string;
  id?: string;
}

// Base Shimmering block using standard Tailwind animate-pulse
export const Skeleton: React.FC<SkeletonProps> = ({ className = "", id }) => {
  return (
    <div
      id={id}
      className={`animate-pulse bg-slate-200/90 rounded-xl ${className}`}
    />
  );
};

// 1. Navbar Skeleton
export const NavbarSkeleton: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="hidden lg:flex items-center gap-8">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="hidden md:block w-72">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-24 h-9 rounded-xl hidden sm:block" />
      </div>
    </header>
  );
};

// 2. Profile Skeleton
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
        <Skeleton className="w-20 h-20 rounded-3xl" />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
        <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl space-y-6">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

// 3. Product Card Skeleton (also exported as ProductSkeletonGrid)
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-4 shadow-xs">
      <Skeleton className="aspect-4/3 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};

export const ProductSkeletonGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

// 4. Product Details Skeleton
export const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images left */}
        <div className="space-y-4">
          <Skeleton className="aspect-4/3 w-full rounded-3xl" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="aspect-square rounded-xl" />
          </div>
        </div>
        {/* Details right */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="space-y-3 border-t border-b border-slate-100 py-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 flex-1 rounded-2xl" />
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Wishlist Skeleton
export const WishlistSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2 max-w-md mx-auto">
        <Skeleton className="h-5 w-24 mx-auto rounded-full" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4">
            <Skeleton className="aspect-4/3 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. Orders Skeleton
export const OrdersSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 7. Cart Skeleton
export const CartSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2 max-w-md mx-auto">
        <Skeleton className="h-5 w-28 mx-auto rounded-full" />
        <Skeleton className="h-8 w-56 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4 h-fit">
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-2/3 border-t border-slate-50 pt-2" />
          </div>
          <Skeleton className="h-11 w-full rounded-2xl pt-2" />
        </div>
      </div>
    </div>
  );
};

// 8. Category Cards Skeleton
export const CategoryCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl text-center space-y-2.5 flex flex-col items-center">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
};

// 9. Home Hero Skeleton
export const HomeHeroSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 md:p-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-12 w-5/6" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
        <Skeleton className="aspect-4/3 w-full rounded-3xl" />
      </div>
    </div>
  );
};

// 10. Shop Grid Skeleton
export const ShopGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Filters */}
      <div className="hidden lg:block space-y-6 bg-white border border-slate-100 p-6 rounded-3xl h-fit">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-6 w-1/2 pt-2" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="w-10 h-8 rounded-lg" />
          <Skeleton className="w-10 h-8 rounded-lg" />
          <Skeleton className="w-10 h-8 rounded-lg" />
        </div>
      </div>
      {/* Products Grid */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
        <ProductSkeletonGrid count={6} />
      </div>
    </div>
  );
};

// Simple Fallback Page Loader
export const FullPageSkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col px-4 py-8 max-w-7xl mx-auto space-y-8">
      <HomeHeroSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-8 w-24" />
          <ProductSkeletonGrid count={3} />
        </div>
      </div>
    </div>
  );
};
