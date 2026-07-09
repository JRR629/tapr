import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminGetAllProducts, getActiveCategories } from '@/lib/gear'
import { AdminNav } from '@/components/AdminNav'
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

  return (
    <>
      <div className="bg-[#0A1628] px-4 pt-8 md:px-8">
        <div className="max-w-5xl mx-auto">
          <AdminNav active="/admin/products" />
        </div>
      </div>
      <AdminProductsClient products={products} categories={categories} />
    </>
  )
}
