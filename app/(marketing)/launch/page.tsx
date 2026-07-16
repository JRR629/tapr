import { redirect } from 'next/navigation'

// The launch page content is now the site home page ("/"). This path stays as a
// permanent redirect so old links/bookmarks still resolve and search engines
// don't index duplicate content at both / and /launch.
export default function LaunchRedirect() {
  redirect('/')
}
