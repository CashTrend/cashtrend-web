import { AuthProvider } from '@/context/auth-context'
import { LocaleProvider } from '@/context/locale-context'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

/**
 * Dashboard layout — wraps all authenticated routes under app/(dashboard)/.
 *
 * Structure:
 *   <AuthProvider>          ← provides user + logout to all client components
 *     <div flex>
 *       <Sidebar />         ← fixed left column (desktop) / drawer (mobile)
 *       <div flex-col>
 *         <Header />        ← sticky top bar with title + theme toggle
 *         <main>            ← scrollable page content
 *           {children}
 *         </main>
 *       </div>
 *     </div>
 *   </AuthProvider>
 *
 * AuthProvider is a Client Component; this file is a Server Component so the
 * AuthProvider is rendered as a leaf boundary — keeping the layout itself RSC.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar — handles its own desktop/mobile rendering */}
          <Sidebar />

          {/* Main column */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </AuthProvider>
    </LocaleProvider>
  )
}
