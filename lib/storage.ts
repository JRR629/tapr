export function getProductImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`
}

/**
 * Resolve the best available product image URL for a given product.
 *
 * Resolution order:
 * 1. Supabase Storage (`imagePath` set) — covers GPS watches and any category
 *    where we've uploaded product images.
 * 2. Amazon CDN hotlink (`amazonImageUrl` set, running-shoes only) — the
 *    `m.media-amazon.com/images/I/{id}.jpg` URL was scraped one-time from the
 *    Amazon product page and stored in `gear_products.amazon_image_url`.
 *    Amazon Associates terms permit hotlinking these images when paired with
 *    an affiliate-tagged purchase link to the same product (which the buy
 *    button provides). Note: the older Amazon Associates Product Image widget
 *    (`ws-na.amazon-adsystem.com/widgets/q?...ID=AsinImage`) is deprecated and
 *    returns nothing — do not try to construct image URLs from ASIN alone.
 * 3. null — caller should render the category icon fallback.
 *
 * This function is server-safe (uses NEXT_PUBLIC_SUPABASE_URL which is
 * available in both server and client contexts). Do NOT pass affiliate_url or
 * any secret here.
 */
export function resolveProductImageUrl(opts: {
  imagePath?: string | null
  categorySlug: string
  amazonImageUrl?: string | null
}): string | null {
  const { imagePath, categorySlug, amazonImageUrl } = opts

  // 1. Supabase Storage — use whenever image_path is populated
  if (imagePath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`
    }
  }

  // 2. Amazon CDN hotlink — running-shoes only, must be pre-scraped
  if (categorySlug === 'running-shoes' && amazonImageUrl) {
    return amazonImageUrl
  }

  return null
}
