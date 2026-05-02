import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminGetAllProducts, getActiveCategories } from '@/lib/gear'
import { AdminProductsClient } from './AdminProductsClient'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect('/dashboard')
  }

  const [products, categories] = await Promise.all([adminGetAllProducts(), getActiveCategories()])

  return <AdminProductsClient products={products} categories={categories} />
}
