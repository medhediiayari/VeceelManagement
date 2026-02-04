import { redirect } from "next/navigation"

/**
 * Root Page
 * 
 * Redirects to login page by default
 * After authentication, users are redirected to /dashboard
 */
export default function RootPage() {
  redirect("/login")
}
