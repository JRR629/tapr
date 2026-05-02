export function getProductImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`
}
