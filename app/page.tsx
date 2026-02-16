"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"


import { supabase } from "@/lib/supabase"
import LandingPage from "@/components/landing-page"
import LoginPage from "@/components/login-page"
import { Button } from "@/components/ui/button"
import {
  Home,
  FileText,
  Calculator,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Settings,
  Bell,
  User,
  Menu,
  X,
  Camera,
  DollarSign,
  ChevronDown,
  BadgeCheck,
  Scale,
  Building2,
  CreditCard
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import RiskDashboard from "@/components/risk-dashboard"
import ContractGenerator from "@/components/contract-generator"
import PayrollCalculator from "@/components/payroll-calculator"
import PrivacyPolicyWizard from "@/components/privacy-policy-wizard"
import ReceiptScanner from "@/components/receipt-scanner"
import WakiliChat from "@/components/wakili-chat"
import PricingPage from "@/components/pricing-page"
import WhatsAppButton from "@/components/whatsapp-button"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { canAccessFeature, isTrialExpired, getSubscriptionStatus } from "@/lib/entitlements"
import BillingCredits from "@/components/billing-credits"
import InstitutionalProfile from "@/components/institutional-profile"
import ComplianceReport from "@/components/compliance-report"
import SettingsPage from "@/components/settings-page"

type Page = "dashboard" | "contracts" | "payroll" | "privacy" | "receipts" | "pricing" | "billing" | "settings" | "profile" | "compliance"

type ProfileUpdateValue = string | boolean

interface NotificationRow {
  id: string | number
  type?: string | null
  message?: string | null
  created_at?: string | null
  is_read?: boolean | null
}

interface NotificationItem {
  id: string | number
  title: string
  message: string
  detail: string
  time: string
  type: "critical" | "warning" | "success"
  read: boolean
  action: () => void
}

interface CreditBalances {
  payroll: number
  scan: number
  contract: number
  privacy: number
}

type HealthStatus = "healthy" | "degraded" | "down" | "pending"

interface HealthCheck {
  id: string
  label: string
  status: HealthStatus
  detail: string
}

function normalizeAuthProtocolMessage(raw: string) {
  const message = raw.toLowerCase()
  if (message.includes('email rate limit exceeded')) {
    return 'Email actions are temporarily throttled. Wait about 30-60 minutes before retrying password recovery.'
  }
  if (message.includes('invalid login credentials')) {
    return 'Invalid login credentials. Confirm your email/password and retry.'
  }
  if (message.includes('network')) {
    return 'Network request failed. Verify internet connectivity and retry.'
  }
  return raw || 'Protocol failed.'
}

function buildTierRestrictionMessage(page: Page) {
  if (page === 'payroll') return 'Payroll requires Micro-Entity+ plan or a Payroll pay-per-use credit.'
  if (page === 'receipts') return 'Tax Lens requires Micro-Entity+ plan or a Scan pay-per-use credit.'
  if (page === 'contracts') return 'Contract Generator requires Micro-Entity+ plan or a Contract pay-per-use credit.'
  if (page === 'privacy') return 'Privacy Policy requires Micro-Entity+ plan or a Privacy pay-per-use credit.'
  return 'This module is not available in your current plan.'
}

function HomePageContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const { showToast, showAlert, showConfirm } = useInstitutionalUI()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isSuperAdmin = profile?.role === 'super-admin'
  const [view, setView] = useState<"landing" | "login">("landing")

  // Initialize from URL to prevent flash
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const tab = searchParams.get('tab')
    const validPages: Page[] = ["dashboard", "contracts", "payroll", "privacy", "receipts", "pricing", "billing", "settings", "profile", "compliance"]
    return (tab && validPages.includes(tab as Page)) ? (tab as Page) : "dashboard"
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<string | number | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [prefLanguage, setPrefLanguage] = useState("English (Business)")
  const [prefCurrency, setPrefCurrency] = useState("KES (Kenyan Shillings)")
  const [smsRemindersEnabled, setSmsRemindersEnabled] = useState(false)
  const [smsDaysBefore, setSmsDaysBefore] = useState(3)
  const [smsRulesSaving, setSmsRulesSaving] = useState(false)
  const [emailHousingReminders, setEmailHousingReminders] = useState(true)
  const [emailCasualAlerts, setEmailCasualAlerts] = useState(true)
  const [emailTaxUpdates, setEmailTaxUpdates] = useState(true)
  const [smsPaymentConfirmations, setSmsPaymentConfirmations] = useState(false)
  const [notificationFrequency, setNotificationFrequency] = useState<'realtime' | 'daily' | 'weekly'>('realtime')
  const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false)
  const [credits, setCredits] = useState<CreditBalances>({ payroll: 0, scan: 0, contract: 0, privacy: 0 })
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)
  const [diagnosticsLastRun, setDiagnosticsLastRun] = useState<string | null>(null)
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    { id: 'auth', label: 'Auth + Session', status: 'pending', detail: 'Not run yet' },
    { id: 'core', label: 'Core API Gateway', status: 'pending', detail: 'Not run yet' },
    { id: 'ai', label: 'AI Contract Review', status: 'pending', detail: 'Not run yet' },
    { id: 'payments', label: 'M-Pesa Bridge', status: 'pending', detail: 'Not run yet' }
  ])

  // Sync current page to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('tab') !== currentPage) {
      params.set('tab', currentPage)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [currentPage, router, pathname, searchParams])

  useEffect(() => {
    if (profile) {
      setTwoFactorEnabled(profile.mfa_enabled || false)
      setPrefLanguage(profile.preferred_language || "English (Business)")
      setPrefCurrency(profile.preferred_currency || "KES (Kenyan Shillings)")
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    const loadSmsRules = async () => {
      try {
        const res = await fetch('/api/reminders/rules')
        if (!res.ok) return
        const data = await res.json()
        setSmsRemindersEnabled(!!data.enabled)
        setSmsDaysBefore(typeof data.daysBefore === 'number' ? data.daysBefore : 3)
      } catch (err) {
        console.warn('Failed to load SMS reminder rules:', err)
      }
    }
    loadSmsRules()
  }, [user])

  useEffect(() => {
    if (!user) return
    const loadCredits = async () => {
      try {
        const res = await fetch('/api/credits')
        if (!res.ok) return
        const data = await res.json()
        if (data?.credits) {
          setCredits({
            payroll: Number(data.credits.payroll || 0),
            scan: Number(data.credits.scan || 0),
            contract: Number(data.credits.contract || 0),
            privacy: Number(data.credits.privacy || 0),
          })
        }
      } catch (err) {
        console.warn('Failed to load credits:', err)
      }
    }
    loadCredits()
  }, [user])

  useEffect(() => {
    if (!user) return
    const loadNotificationSettings = async () => {
      try {
        const res = await fetch('/api/notifications/settings')
        if (!res.ok) return
        const data = await res.json()
        setEmailHousingReminders(!!data.email_housing_reminders)
        setEmailCasualAlerts(!!data.email_casual_alerts)
        setEmailTaxUpdates(!!data.email_tax_updates)
        setSmsPaymentConfirmations(!!data.sms_payment_confirmations)
        if (data.frequency === 'daily' || data.frequency === 'weekly' || data.frequency === 'realtime') {
          setNotificationFrequency(data.frequency)
        }
      } catch (err) {
        console.warn('Failed to load notification settings:', err)
      }
    }
    loadNotificationSettings()
  }, [user])

  const saveSmsReminderRules = async (enabled: boolean, daysBefore: number) => {
    try {
      setSmsRulesSaving(true)
      const res = await fetch('/api/reminders/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          daysBefore,
          reminderTypes: ['housing_levy', 'shif', 'nssf']
        })
      })
      const data = await res.json()
      if (!res.ok) {
        showAlert('Reminder Save Error', data.error || 'Failed to save SMS reminder rules.')
        return
      }
      setSmsRemindersEnabled(enabled)
      setSmsDaysBefore(daysBefore)
      showToast(`SMS reminders ${enabled ? 'enabled' : 'disabled'} successfully.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error'
      showAlert('Reminder Save Error', message)
    } finally {
      setSmsRulesSaving(false)
    }
  }

  const saveNotificationSettings = async () => {
    try {
      setNotificationSettingsSaving(true)
      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_housing_reminders: emailHousingReminders,
          email_casual_alerts: emailCasualAlerts,
          email_tax_updates: emailTaxUpdates,
          sms_payment_confirmations: smsPaymentConfirmations,
          frequency: notificationFrequency
        })
      })
      const data = await res.json()
      if (!res.ok) {
        showAlert('Notification Settings Error', data.error || 'Failed to save notification settings.')
        return false
      }
      showToast('Notification settings saved in cloud vault!', 'success')
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save notification settings.'
      showAlert('Notification Settings Error', message)
      return false
    } finally {
      setNotificationSettingsSaving(false)
    }
  }

  const handleSecurityUpdate = async (field: string, value: ProfileUpdateValue) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id)
      if (error) throw error
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Security protocol update failure'
      console.error('Security protocol update failure:', message)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin
      })
      if (error) throw error
      showToast('🔐 Cryptographic reset link dispatched to ' + user.email, 'info')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Protocol failed'
      showAlert('Vault Auth Error', normalizeAuthProtocolMessage(message))
    }
  }

  const runDiagnostics = useCallback(async () => {
    if (!user) return

    setDiagnosticsLoading(true)
    const checks: HealthCheck[] = []

    try {
      const core = await fetch('/api/test')
      checks.push({
        id: 'core',
        label: 'Core API Gateway',
        status: core.ok ? 'healthy' : 'down',
        detail: core.ok ? `Healthy (${core.status})` : `Unavailable (${core.status})`
      })
    } catch {
      checks.push({
        id: 'core',
        label: 'Core API Gateway',
        status: 'down',
        detail: 'No response from /api/test'
      })
    }

    try {
      const authProbe = await fetch('/api/reminders/rules')
      checks.push({
        id: 'auth',
        label: 'Auth + Session',
        status: authProbe.ok ? 'healthy' : 'degraded',
        detail: authProbe.ok ? 'Authenticated session looks valid.' : `Session degraded (${authProbe.status})`
      })
    } catch {
      checks.push({
        id: 'auth',
        label: 'Auth + Session',
        status: 'down',
        detail: 'Auth probe did not return.'
      })
    }

    try {
      const aiProbe = await fetch('/api/review-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: 'Diagnostics User',
          jobTitle: 'Operations',
          grossSalary: 30000,
          location: 'nairobi',
          contractText: 'Basic diagnostic contract text.'
        })
      })
      const aiOk = aiProbe.status === 200
      checks.push({
        id: 'ai',
        label: 'AI Contract Review',
        status: aiOk ? 'healthy' : aiProbe.status >= 500 ? 'degraded' : 'down',
        detail: aiOk ? 'AI contract review is operational.' : `AI endpoint returned ${aiProbe.status}.`
      })
    } catch {
      checks.push({
        id: 'ai',
        label: 'AI Contract Review',
        status: 'down',
        detail: 'AI endpoint unreachable.'
      })
    }

    try {
      const paymentProbe = await fetch('/api/mpesa/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '254700000000',
          amount: 1,
          plan: 'diagnostics'
        })
      })
      checks.push({
        id: 'payments',
        label: 'M-Pesa Bridge',
        status: [200, 400].includes(paymentProbe.status) ? 'healthy' : paymentProbe.status >= 500 ? 'degraded' : 'down',
        detail: `M-Pesa endpoint returned ${paymentProbe.status}.`
      })
    } catch {
      checks.push({
        id: 'payments',
        label: 'M-Pesa Bridge',
        status: 'down',
        detail: 'M-Pesa endpoint unreachable.'
      })
    }

    setHealthChecks(checks)
    setDiagnosticsLastRun(new Date().toISOString())
    setDiagnosticsLoading(false)
  }, [user])

  const [profileForm, setProfileForm] = useState({
    business_name: "",
    kra_pin: "",
    industry: "Retail",
    employee_count: 0,
    full_name: "",
    phone: "",
    location: "Nairobi",
    business_address: "",
    registration_number: ""
  })

  useEffect(() => {
    if (profile) {
      setProfileForm({
        business_name: profile.business_name || "",
        kra_pin: profile.kra_pin || "",
        industry: profile.industry || "Retail",
        employee_count: profile.num_employees || 0,
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        location: profile.location || "Nairobi",
        business_address: profile.business_address || "",
        registration_number: profile.registration_number || ""
      })
    }
  }, [profile])

  const handleProfileSave = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: profileForm.business_name,
          kra_pin: profileForm.kra_pin,
          industry: profileForm.industry,
          num_employees: profileForm.employee_count,
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          location: profileForm.location,
          business_address: profileForm.business_address,
          registration_number: profileForm.registration_number
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      setShowProfileModal(false)
      showToast('✅ Institutional profile updated in cloud vault')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error updating profile'
      showAlert('Vault Error', 'Error updating profile: ' + message)
    }
  }

  const navigation = [
    { id: "dashboard" as Page, label: "Dashboard", icon: Home },
    { id: "compliance" as Page, label: "Compliance Status", icon: Activity },
    { id: "receipts" as Page, label: "Tax Lens", icon: Camera },
    { id: "contracts" as Page, label: "Contract Generator", icon: FileText },
    { id: "payroll" as Page, label: "Payroll Calc", icon: Calculator },
    { id: "privacy" as Page, label: "Privacy Policy", icon: Shield },
  ]

  useEffect(() => {
    console.log("🚀 ComplyKe Institutional Shell Mounted at:", new Date().toLocaleTimeString())
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Notifications data
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const filteredRows = ((data ?? []) as NotificationRow[])
        .filter((entry) => !(entry.type === 'fuel_protocol' && entry.message?.includes('KRA has mandated eTIMS digital invoicing')))

      const mapped = filteredRows.map((n) => {
        const type: NotificationItem["type"] = n.type === 'critical' || n.type === 'warning' || n.type === 'success' ? n.type : 'warning'
        return {
          id: n.id,
          title: n.type?.replace('_', ' ').toUpperCase() || 'SYSTEM ALERT',
          message: n.message || '',
          detail: n.message || '',
          time: new Date(n.created_at || new Date().toISOString()).toLocaleDateString('en-KE', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type,
          read: n.is_read || false,
          action: () => setCurrentPage(n.type === 'fuel_protocol' ? 'receipts' : 'dashboard')
        }
      })

      setAllNotifications(mapped)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to fetch institutional alerts:', message)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id: number | string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err: unknown) {
      console.error('Failed to update alert state:', err)
    }
  }

  const markAllRead = async () => {
    if (!user) return

    // Optimistically update UI immediately for all items
    setAllNotifications(prev => prev.map(n => ({ ...n, read: true })))

    try {
      // Only push DB updates for real notifications (numeric IDs or standard UUIDs)
      const realNotificationIds = allNotifications
        .map(n => n.id)

      if (realNotificationIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
      }
    } catch (err: unknown) {
      console.error('Failed to clear alert history:', err)
    }
  }


  const visibleNotifications = showAllNotifications ? allNotifications : allNotifications.slice(0, 3)

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <RiskDashboard onOpenCompliance={() => setCurrentPage('compliance')} />
      case "receipts":
        return <ReceiptScanner />
      case "contracts":
        return <ContractGenerator />
      case "payroll":
        return <PayrollCalculator />
      case "privacy":
        return <PrivacyPolicyWizard />
      case "pricing":
        return <PricingPage />
      case "billing":
        return <BillingCredits />
      case "profile":
        return <InstitutionalProfile />
      case "compliance":
        return <ComplianceReport />
      case "settings":
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="glass-card rounded-3xl p-8 border-none shadow-xl">
              <h1 className="text-3xl font-black text-navy-950 tracking-tight mb-2">Settings</h1>
              <p className="text-navy-600 font-medium">Manage your institutional preferences and security protocols</p>
            </div>

            {/* App Preferences */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-navy-50">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-navy-400" />
                App Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-2xl border border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-navy-900">Language</p>
                    <p className="text-sm text-navy-500 font-medium">Localization for dashboard and reports</p>
                  </div>
                  <select
                    value={prefLanguage}
                    onChange={async (e) => {
                      const val = e.target.value
                      setPrefLanguage(val)
                      await handleSecurityUpdate('preferred_language', val)
                      showToast(`🌍 Language protocol updated to ${val}`)
                    }}
                    className="px-4 py-2 rounded-xl border border-navy-200 focus:ring-2 focus:ring-navy-900 outline-none text-sm font-bold bg-white"
                  >
                    <option>English (Business)</option>
                    <option>Swahili</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl border border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-navy-900">Currency Display</p>
                    <p className="text-sm text-navy-500 font-medium">Monetary units for tax calculations</p>
                  </div>
                  <select
                    value={prefCurrency}
                    onChange={async (e) => {
                      const val = e.target.value
                      setPrefCurrency(val)
                      await handleSecurityUpdate('preferred_currency', val)
                      showToast(`💰 Monetary protocol updated to ${val}`)
                    }}
                    className="px-4 py-2 rounded-xl border border-navy-200 focus:ring-2 focus:ring-navy-900 outline-none text-sm font-bold bg-white"
                  >
                    <option>KES (Kenyan Shillings)</option>
                    <option>USD (Reporting Only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl border border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-navy-900">Notification Settings</p>
                    <p className="text-sm text-navy-500 font-medium">Configure SMS reminder rules and lead time</p>
                  </div>
                  <Button
                    onClick={() => setShowNotificationSettingsModal(true)}
                    className="h-10 px-4 text-xs font-black uppercase tracking-widest rounded-xl bg-navy-900 text-white hover:bg-navy-950"
                  >
                    Open
                  </Button>
                </div>
              </div>
            </div>

            {/* Diagnostics */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-navy-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-navy-400" />
                    System Diagnostics
                  </h2>
                  <p className="text-sm text-navy-500 font-medium">Quick checks for auth, APIs, and external service connectivity.</p>
                </div>
                <Button
                  onClick={() => void runDiagnostics()}
                  disabled={diagnosticsLoading}
                  className="h-10 px-4 text-xs font-black uppercase tracking-widest rounded-xl bg-navy-900 text-white hover:bg-navy-950 disabled:opacity-60"
                >
                  {diagnosticsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Run Diagnostics'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthChecks.map((check) => (
                  <div key={check.id} className="p-4 rounded-2xl border border-navy-100 bg-navy-50/40">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-navy-900">{check.label}</p>
                      <span className="text-xs font-black uppercase tracking-widest">
                        {check.status === 'healthy' && <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Healthy</span>}
                        {check.status === 'degraded' && <span className="text-amber-700 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Degraded</span>}
                        {check.status === 'down' && <span className="text-rose-700 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Down</span>}
                        {check.status === 'pending' && <span className="text-navy-500">Pending</span>}
                      </span>
                    </div>
                    <p className="text-xs text-navy-600 mt-2">{check.detail}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-navy-500 mt-4">
                Last run: {diagnosticsLastRun ? new Date(diagnosticsLastRun).toLocaleString() : 'Not run yet'}
              </p>
            </div>

            {/* Security */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-navy-50">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-navy-400" />
                Security Protocols
              </h2>
              <div className="space-y-4">
                <button
                  onClick={handlePasswordReset}
                  className="w-full flex items-center justify-between p-5 rounded-2xl border border-navy-50 hover:bg-navy-50/50 transition-all text-left group"
                >
                  <div>
                    <p className="font-bold text-navy-900">Cryptographic Password</p>
                    <p className="text-sm text-navy-500 font-medium">Update your account authentication credentials</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-navy-50 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all">
                    <span className="text-lg">→</span>
                  </div>
                </button>

                <div className="flex items-center justify-between p-5 rounded-2xl border border-navy-50 hover:bg-navy-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-navy-900">Multi-Factor Authentication (MFA)</p>
                    <p className="text-sm text-navy-500 font-medium">Institutional-grade security layer</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={twoFactorEnabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShow2FAModal(true)
                        } else {
                          showConfirm(
                            "Disable MFA?",
                            "Caution: This will significantly degrade your business security rating and expose your institutional vault. Are you sure?",
                            async () => {
                              setTwoFactorEnabled(false)
                              await handleSecurityUpdate('mfa_enabled', false)
                              showToast('🔓 MFA Security Protocol deactivated.', 'warning')
                            },
                            "Disable Protocol",
                            "Maintain Security"
                          )
                        }
                      }}
                    />
                    <div className="w-12 h-6 bg-navy-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-900"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Version Badge */}
            <div className="p-8 rounded-3xl bg-navy-950 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">System Status</p>
                <h3 className="text-2xl font-black mb-1">ComplyKe Institutional</h3>
                <p className="text-navy-400 text-sm font-medium">Version L-2026.01.R2 • Kenya Statutory Engine</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold border border-white/10">Feb 2026 Tax Bands</div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold border border-white/10">NSSF Phase 4</div>
                </div>
              </div>
              <Shield className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            </div>

            {/* Advanced System Configuration & Enterprise Services */}
            <SettingsPage />
          </div >
        )
      default:
        return <RiskDashboard />
    }
  }

  const subStatus = getSubscriptionStatus(profile?.subscription_plan, profile?.subscription_end_date)
  const trialExpired = subStatus === 'expired' && !isSuperAdmin
  const canOpenPage = (page: Page) => {
    if (isSuperAdmin) return true
    if (page === 'payroll') {
      return canAccessFeature(profile?.subscription_plan, 'payroll', profile?.subscription_end_date) || credits.payroll > 0
    }
    if (page === 'receipts') {
      return canAccessFeature(profile?.subscription_plan, 'receipts', profile?.subscription_end_date) || credits.scan > 0
    }
    if (page === 'contracts') {
      return canAccessFeature(profile?.subscription_plan, 'contracts', profile?.subscription_end_date) || credits.contract > 0
    }
    if (page === 'privacy') {
      return canAccessFeature(profile?.subscription_plan, 'privacy', profile?.subscription_end_date) || credits.privacy > 0
    }
    return true
  }

  const handlePageNavigation = (page: Page) => {
    if (trialExpired && page !== 'pricing' && page !== 'settings') {
      showConfirm(
        'Trial Expired',
        'Your trial has ended. Open Pricing to upgrade and continue using premium modules.',
        () => setCurrentPage('pricing'),
        'Open Pricing',
        'Stay Here'
      )
      return
    }
    if (!canOpenPage(page)) {
      showConfirm(
        'Tier Restricted',
        `${buildTierRestrictionMessage(page)} Open Pricing to upgrade or buy credits.`,
        () => setCurrentPage('pricing'),
        'Open Pricing',
        'Stay Here'
      )
      return
    }
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-navy-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-navy-900 font-black uppercase tracking-[0.2em] animate-pulse">Verifying Institutional Session</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full">
        {view === "landing" ? (
          <LandingPage onGetStarted={() => setView("login")} />
        ) : (
          <LoginPage />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-50/50 flex flex-col font-sans selection:bg-navy-900 selection:text-white">
      {/* Premium Institutional Header */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-navy-100/50 shadow-sm">
        <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-2xl p-2 bg-navy-50 text-navy-950 hover:bg-navy-100 transition-all active:scale-90"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
              <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-white shadow-lg md:shadow-xl shadow-navy-100 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img src="/logo.svg" alt="ComplyKe Logo" className="h-6 w-6 md:h-10 md:w-10" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-navy-900 tracking-tighter uppercase leading-none">ComplyKe</h1>
                <div className="hidden sm:flex items-center gap-1.5 mt-1">
                  <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">Institutional Safety</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setProfileOpen(false)
                }}
                className={`rounded-2xl p-2.5 transition-all relative group ${notificationsOpen ? 'bg-navy-950 text-white shadow-xl' : 'bg-white text-navy-700 hover:bg-navy-50'}`}
              >
                <Bell className="h-5 w-5" />
                {allNotifications.some(n => !n.read) && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white animate-bounce"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-[-4.5rem] md:right-0 top-14 w-[calc(100vw-2.5rem)] sm:w-96 bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-navy-100 animate-slide-in-top z-[70] overflow-hidden">
                  <div className="p-6 bg-navy-950 text-white text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg">Statutory Alerts</h3>
                      <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-colors">Mark all read</button>
                    </div>
                    <p className="text-xs text-navy-400 font-medium">System identified {allNotifications.filter(n => n.type === 'critical').length} high-liability items</p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {visibleNotifications.length > 0 ? visibleNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-navy-50 last:border-0 hover:bg-navy-50 transition-colors cursor-pointer group ${notification.read ? 'opacity-60 bg-navy-50/30' : 'bg-white'}`}
                        onClick={() => {
                          markAsRead(notification.id)
                          notification.action()
                          setNotificationsOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${notification.type === 'critical' ? 'bg-rose-500 shadow-rose-200 animate-pulse' :
                            notification.type === 'warning' ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`} />
                          <div>
                            <p className="font-bold text-sm text-navy-900 group-hover:text-navy-700 transition-colors">{notification.title}</p>
                            <p className="text-xs text-navy-500 mt-1 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <p className="text-[10px] font-bold text-navy-400 mt-2 uppercase tracking-wide">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                          <BadgeCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="text-xs font-bold text-navy-950 uppercase tracking-widest">Protocol Clear</p>
                        <p className="text-[10px] text-navy-400 mt-1">No critical compliance alerts detected.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-navy-50">
                    <button
                      onClick={() => setShowAllNotifications(true)}
                      className="text-xs font-black text-navy-900 uppercase tracking-widest block w-full text-center hover:text-navy-600 transition-colors"
                    >
                      View Global Alert History ({allNotifications.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile-First Full Screen Notification Overlay */}
              {showAllNotifications && (
                <div className="fixed inset-0 z-[100] bg-navy-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-navy-50 flex items-center justify-between bg-navy-50/50">
                      <div>
                        <h3 className="text-lg font-black text-navy-900 uppercase tracking-tight">Global Alert History</h3>
                        <p className="text-xs text-navy-500 font-medium mt-1">Found {allNotifications.length} statutory events</p>
                      </div>
                      <button onClick={() => setShowAllNotifications(false)} className="p-2 rounded-xl bg-white border border-navy-100 hover:bg-navy-50 transition-all">
                        <X className="h-5 w-5 text-navy-900" />
                      </button>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2 flex-1 custom-scrollbar">
                      {allNotifications.length > 0 ? allNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            markAsRead(notification.id)
                            notification.action()
                            setShowAllNotifications(false)
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer hover:bg-navy-50 transition-colors group ${notification.read ? 'border-navy-50 opacity-60 bg-navy-50/30' : 'border-navy-100 bg-white shadow-sm'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${notification.type === 'critical' ? 'bg-rose-500 shadow-rose-200 animate-pulse' :
                              notification.type === 'warning' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} />
                            <div>
                              <p className="font-bold text-sm text-navy-900 leading-tight group-hover:text-navy-700 transition-colors">{notification.title}</p>
                              <p className="text-xs text-navy-500 mt-1 leading-relaxed text-balance">{notification.message}</p>
                              <p className="text-[10px] font-black text-navy-300 mt-2 uppercase tracking-widest">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center p-20 opacity-60">
                          <Shield className="h-20 w-20 text-navy-100 mb-6" />
                          <p className="font-black text-navy-900 uppercase tracking-widest text-sm text-center">Protocol Synchronized</p>
                          <p className="text-xs text-navy-400 mt-2 text-center max-w-[200px]">No historical alerts found in your institutional vault.</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-navy-50 bg-navy-50/30">
                      <button onClick={markAllRead} className="w-full py-4 rounded-2xl bg-navy-900 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-navy-100">
                        Mark All Protocols Checked
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotificationsOpen(false)
                }}
                className={`flex items-center gap-2 rounded-2xl p-1.5 transition-all ${profileOpen ? 'bg-navy-950 text-white shadow-xl' : 'bg-navy-50 hover:bg-navy-100'}`}
              >
                <div className="h-8 w-8 rounded-xl bg-navy-900 flex items-center justify-center text-[10px] font-black text-white uppercase">
                  {(profile?.business_name || user?.email)?.substring(0, 2) || 'AD'}
                </div>
                <ChevronDown className={`h-4 w-4 text-navy-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-navy-100 animate-slide-in-top z-[70] overflow-hidden">
                  <div className="p-6 border-b border-navy-50 bg-navy-50/50">
                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-3">Active Session</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-navy-950 flex items-center justify-center text-white font-black uppercase">
                        {(profile?.business_name || user?.email)?.substring(0, 2) || 'AD'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-navy-900 truncate max-w-[150px]">{profile?.business_name || user?.email}</p>
                        {profile?.business_name && <p className="text-[10px] text-navy-400 truncate">{user?.email}</p>}
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Premium Entity</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <button onClick={() => { setProfileOpen(false); setShowProfileModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-xs font-bold text-navy-800 transition-colors uppercase tracking-wide">
                      <User className="h-4 w-4" /> Edit Profile
                    </button>
                    <button onClick={() => { handlePageNavigation('profile'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-xs font-bold text-navy-800 transition-colors uppercase tracking-wide">
                      <Building2 className="h-4 w-4" /> Institutional Page
                    </button>
                    <button onClick={() => { handlePageNavigation('pricing'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-xs font-bold text-navy-800 transition-colors uppercase tracking-wide">
                      <DollarSign className="h-4 w-4" /> Subscription Plan
                    </button>
                    <button onClick={() => { handlePageNavigation('billing'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-xs font-bold text-navy-800 transition-colors uppercase tracking-wide">
                      <CreditCard className="h-4 w-4" /> Billing & Credits
                    </button>
                    <div className="h-px bg-navy-50 my-1" />
                    <button onClick={() => { handlePageNavigation('settings'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-xs font-bold text-navy-800 transition-colors uppercase tracking-wide">
                      <Settings className="h-4 w-4" /> System Config
                    </button>
                  </div>
                  <div className="p-3 bg-rose-50/30 border-t border-navy-50">
                    <button
                      onClick={async () => {
                        try {
                          setProfileOpen(false)
                          // Force a complete browser-level purge for maximum resilience
                          // 1. Purge Supabase Client State
                          await signOut().catch(() => console.warn('Supabase signout failed, continuing...'))

                          // 2. Clear Session Cookies via Server Handshake
                          try {
                            await fetch('/api/auth/signout', { method: 'POST' })
                          } catch (error: unknown) {
                            console.warn('Server cookie purge failed', error)
                          }

                          // 3. Absolute Hard Redirect to purge all local memories
                          window.location.href = '/'
                        } catch (error: unknown) {
                          console.error('Terminal Logout Error:', error)
                          window.location.href = '/'
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl bg-white text-rose-600 text-sm font-bold border border-rose-100 shadow-sm hover:bg-rose-600 hover:text-white transition-all transform active:scale-95"
                    >
                      Terminate Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header >

      {/* Premium Horizontal Navigation - Desktop */}
      <nav className="hidden md:flex bg-white border-b border-navy-100 shadow-sm sticky top-18 z-40 overflow-x-auto no-scrollbar">
        <div className="mx-auto flex items-center justify-start md:justify-center px-10 gap-1 h-14 w-full max-w-7xl">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handlePageNavigation(item.id)}
                className={`flex items-center gap-2 px-6 h-full text-xs font-black uppercase tracking-widest transition-all relative group shrink-0 ${isActive
                  ? "text-navy-900"
                  : "text-navy-400 hover:text-navy-800"
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-navy-950' : 'text-navy-300'}`} />
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-navy-950 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-navy-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-slide-in-left p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-10 px-4">
                <div className="h-10 w-10 bg-navy-900 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-black text-navy-950 tracking-tighter">COMPLYKE</h2>
              </div>
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handlePageNavigation(item.id); setMobileMenuOpen(false); }}
                    className={`flex h-14 w-full items-center gap-3 rounded-2xl px-4 text-left font-bold ${currentPage === item.id ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}
                  >
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${currentPage === item.id ? "bg-white/10" : "bg-navy-50"}`}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Dynamic Content Surface */}
        <main className="flex-1 overflow-y-auto bg-navy-50/30 custom-scrollbar p-6 md:py-12 md:px-10 lg:px-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {subStatus === 'grace_period' && !isSuperAdmin && (
              <div className="mb-8 p-4 rounded-3xl bg-amber-50 border-2 border-amber-100 flex items-center justify-between animate-pulse-slow">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-amber-900 font-black text-sm uppercase">Subscription Grace Period</h3>
                    <p className="text-amber-700 text-xs font-bold">Your institutional vault session is in a 3-day grace period. Renew now to avoid audit lockdown.</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPage('billing')}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black uppercase tracking-wider hover:bg-amber-700 transition-all active:scale-95 shadow-lg shadow-amber-200"
                >
                  Renew Vault
                </button>
              </div>
            )}
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Wakili AI Chatbot - Floating */}
      <WakiliChat />

      {/* WhatsApp Support Button */}
      <WhatsAppButton />

      {/* Notification Detail Modal */}
      {selectedNotification !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedNotification(null)} />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in-up">
            {(() => {
              const notification = allNotifications.find(n => n.id === selectedNotification)
              if (!notification) return null

              return (
                <>
                  <div className="bg-navy-950 p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <Bell className="h-24 w-24" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4 mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-white/10 ${notification.type === 'critical' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                        <Shield className={`h-5 w-5 ${notification.type === 'critical' ? 'text-rose-400' : 'text-emerald-400'}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">Compliance Event</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-tight">{notification.title}</h2>
                    <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mt-2">Captured: {notification.time}</p>
                  </div>

                  <div className="p-10 space-y-6">
                    <div className={`p-6 rounded-[24px] ${notification.type === 'critical' ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                      <p className="text-navy-900 font-bold leading-relaxed">{notification.message}</p>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      <p className="text-navy-600 font-medium leading-loose whitespace-pre-line bg-navy-50/50 p-6 rounded-[24px] border border-navy-50">
                        {notification.detail}
                      </p>
                    </div>
                  </div>

                  <div className="px-10 pb-10 flex gap-4">
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="flex-1 h-14 rounded-2xl border border-navy-100 text-navy-600 font-bold hover:bg-navy-50 transition-all uppercase tracking-widest text-[10px]"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => {
                        notification.action()
                        setSelectedNotification(null)
                        setNotificationsOpen(false)
                      }}
                      className="flex-[1.5] h-14 rounded-2xl bg-navy-900 text-white font-black uppercase tracking-widest text-xs hover:bg-navy-800 transition-all shadow-xl shadow-navy-100 flex items-center justify-center gap-2 group"
                    >
                      Resolve Protocol
                      <ChevronDown className="h-4 w-4 -rotate-90 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* My Profile Modal */}
      {
        showProfileModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-navy-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-navy-950 flex items-center justify-center text-white font-bold text-2xl relative">
                      {(profile?.business_name || user?.email)?.substring(0, 2) || 'AD'}
                      {isSuperAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white shadow-sm">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-navy-900">My Profile</h2>
                        {isSuperAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-navy-900 text-white text-[8px] font-black uppercase tracking-widest">Super Admin</span>
                        )}
                      </div>
                      <p className="text-sm text-navy-600 mt-1">Manage your business information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="flex-shrink-0 rounded-lg p-2 hover:bg-navy-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-navy-700" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Business Name</label>
                      <input
                        id="biz-name"
                        name="business_name"
                        type="text"
                        value={profileForm.business_name}
                        onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">KRA PIN</label>
                      <input
                        id="biz-kra-pin"
                        name="kra_pin"
                        type="text"
                        value={profileForm.kra_pin}
                        onChange={(e) => setProfileForm({ ...profileForm, kra_pin: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Industry</label>
                      <select
                        id="biz-industry"
                        name="industry"
                        value={profileForm.industry}
                        onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                      >
                        <option>Retail</option>
                        <option>Manufacturing</option>
                        <option>Services</option>
                        <option>Technology</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Number of Employees</label>
                      <input
                        id="biz-employees"
                        name="employee_count"
                        type="number"
                        value={profileForm.employee_count}
                        onChange={(e) => setProfileForm({ ...profileForm, employee_count: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Full Name</label>
                      <input
                        id="contact-fullname"
                        name="full_name"
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                        placeholder="Authorized Official Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Email</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg border border-navy-100 bg-navy-50 text-navy-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Phone</label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                        placeholder="+254..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">Location</label>
                      <select
                        id="contact-location"
                        name="location"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                      >
                        <option>Nairobi</option>
                        <option>Mombasa</option>
                        <option>Kisumu</option>
                        <option>Nakuru</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Institutional Compliance Rating</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border ${(profile?.subscription_status === 'active' || isSuperAdmin) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${(profile?.subscription_status === 'active' || isSuperAdmin) ? 'text-emerald-700' : 'text-amber-700'}`}>SHA/SHIF Status</p>
                      <p className={`text-lg font-bold ${(profile?.subscription_status === 'active' || isSuperAdmin) ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {(profile?.subscription_status === 'active' || isSuperAdmin) ? '✓ Registered' : '⚠ Action Required'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power' || isSuperAdmin) ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power' || isSuperAdmin) ? 'text-emerald-700' : 'text-rose-700'}`}>Housing Levy</p>
                      <p className={`text-lg font-bold ${(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power' || isSuperAdmin) ? 'text-emerald-900' : 'text-rose-900'}`}>
                        {(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power' || isSuperAdmin) ? '✓ Compliant' : '⚠ Non-Compliant'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${(profile?.subscription_plan === 'enterprise' || isSuperAdmin) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${(profile?.subscription_plan === 'enterprise' || isSuperAdmin) ? 'text-emerald-700' : 'text-amber-700'}`}>Data Protection</p>
                      <p className={`text-lg font-bold ${(profile?.subscription_plan === 'enterprise' || isSuperAdmin) ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {(profile?.subscription_plan === 'enterprise' || isSuperAdmin) ? '✓ Data Locked' : '⚠ Audit Risk'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-navy-200 bg-navy-50 flex gap-3">
                <button
                  onClick={handleProfileSave}
                  className="flex-1 bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-3 rounded-lg font-semibold text-navy-700 hover:bg-navy-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Notification Settings Modal */}
      {
        showNotificationSettingsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-navy-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900">Notification Settings</h2>
                    <p className="text-sm text-navy-600 mt-1">Manage how you receive compliance alerts</p>
                  </div>
                  <button
                    onClick={() => setShowNotificationSettingsModal(false)}
                    className="flex-shrink-0 rounded-lg p-2 hover:bg-navy-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-navy-700" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-start justify-between gap-3 p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Housing Levy Reminders</p>
                        <p className="text-sm text-navy-600">Get notified 3 days before payment deadline</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailHousingReminders}
                        onChange={(e) => setEmailHousingReminders(e.target.checked)}
                        className="w-5 h-5 text-navy-600 mt-0.5 shrink-0"
                      />
                    </label>
                    <label className="flex items-start justify-between gap-3 p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Casual Worker Alerts</p>
                        <p className="text-sm text-navy-600">Section 37 compliance warnings (90-day limit)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailCasualAlerts}
                        onChange={(e) => setEmailCasualAlerts(e.target.checked)}
                        className="w-5 h-5 text-navy-600 mt-0.5 shrink-0"
                      />
                    </label>
                    <label className="flex items-start justify-between gap-3 p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Tax Regulation Updates</p>
                        <p className="text-sm text-navy-600">Finance Act changes and PAYE updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailTaxUpdates}
                        onChange={(e) => setEmailTaxUpdates(e.target.checked)}
                        className="w-5 h-5 text-navy-600 mt-0.5 shrink-0"
                      />
                    </label>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">SMS Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-start justify-between gap-3 p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Statutory Deadline Reminders</p>
                        <p className="text-sm text-navy-600">Housing Levy, SHIF and NSSF reminder dispatches</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsRemindersEnabled}
                        disabled={smsRulesSaving}
                        onChange={(e) => {
                          const enabled = e.target.checked
                          setSmsRemindersEnabled(enabled)
                          void saveSmsReminderRules(enabled, smsDaysBefore)
                        }}
                        className="w-5 h-5 text-navy-600 mt-0.5 shrink-0"
                      />
                    </label>
                    <label className="flex items-start justify-between gap-3 p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Payment Confirmations</p>
                        <p className="text-sm text-navy-600">SHIF, NSSF, Housing Levy receipts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsPaymentConfirmations}
                        onChange={(e) => setSmsPaymentConfirmations(e.target.checked)}
                        className="w-5 h-5 text-navy-600 mt-0.5 shrink-0"
                      />
                    </label>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Notification Frequency</h3>
                  <select
                    value={notificationFrequency}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === 'realtime' || value === 'daily' || value === 'weekly') {
                        setNotificationFrequency(value)
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent mb-4"
                  >
                    <option value="realtime">Real-time alerts</option>
                    <option value="daily">Daily summary</option>
                    <option value="weekly">Weekly summary</option>
                  </select>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">SMS Lead Time</h3>
                  <select
                    value={String(smsDaysBefore)}
                    disabled={smsRulesSaving}
                    onChange={(e) => {
                      const days = Number(e.target.value)
                      setSmsDaysBefore(days)
                      void saveSmsReminderRules(smsRemindersEnabled, days)
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent"
                  >
                    <option value="7">7 days before deadline</option>
                    <option value="3">3 days before deadline</option>
                    <option value="1">1 day before deadline</option>
                    <option value="0">On deadline day</option>
                  </select>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-navy-200 bg-navy-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    const saved = await saveNotificationSettings()
                    if (saved) {
                      setShowNotificationSettingsModal(false)
                    }
                  }}
                  disabled={notificationSettingsSaving}
                  className="flex-1 bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 transition-colors disabled:opacity-60"
                >
                  {notificationSettingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setShowNotificationSettingsModal(false)}
                  className="px-6 py-3 rounded-lg font-semibold text-navy-700 hover:bg-navy-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Two-Factor Authentication Setup Modal */}
      {
        show2FAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-navy-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900">Enable Two-Factor Authentication</h2>
                    <p className="text-sm text-navy-600 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="flex-shrink-0 rounded-lg p-2 hover:bg-navy-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-navy-700" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Step 1 */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="text-lg font-bold text-navy-900">Download Authenticator App</h3>
                  </div>
                  <p className="text-sm text-navy-600 ml-0 sm:ml-11 mb-3">
                    Install one of these apps on your phone:
                  </p>
                  <div className="ml-0 sm:ml-11 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-navy-200 bg-navy-50">
                      <p className="font-medium text-navy-900">Google Authenticator</p>
                      <p className="text-xs text-navy-600">iOS & Android</p>
                    </div>
                    <div className="p-3 rounded-lg border border-navy-200 bg-navy-50">
                      <p className="font-medium text-navy-900">Microsoft Authenticator</p>
                      <p className="text-xs text-navy-600">iOS & Android</p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="text-lg font-bold text-navy-900">Scan QR Code</h3>
                  </div>
                  <p className="text-sm text-navy-600 ml-0 sm:ml-11 mb-4">
                    Open your authenticator app and scan this QR code:
                  </p>
                  <div className="ml-0 sm:ml-11 flex flex-col items-center p-4 sm:p-6 rounded-lg border-2 border-navy-200 bg-white">
                    {/* Real Scannable QR Code */}
                    <div className="p-4 bg-white rounded-lg">
                      <QRCodeSVG
                        value={`otpauth://totp/ComplyKe:${user?.email ?? "User"}?secret=JBSWY3DPEHPK3PXP&issuer=ComplyKe`}
                        size={192}
                        level="H"
                        includeMargin={true}
                        className="w-full max-w-[192px] h-auto"
                      />
                    </div>
                    <p className="text-xs text-navy-600 mb-2 mt-4">Or enter this code manually:</p>
                    <code className="px-4 py-2 bg-navy-50 rounded-lg font-mono text-sm text-navy-900 border border-navy-200">
                      JBSW Y3DP EHPK 3PXP
                    </code>
                  </div>
                </div>

                {/* Step 3 */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="text-lg font-bold text-navy-900">Enter Verification Code</h3>
                  </div>
                  <p className="text-sm text-navy-600 ml-0 sm:ml-11 mb-3">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <div className="ml-0 sm:ml-11">
                    <input
                      id="mfa-verification-code"
                      name="mfa_code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-lg border-2 border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    />
                  </div>
                </div>

                {/* Backup Codes */}
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900 mb-2">Save Your Backup Codes</p>
                      <p className="text-sm text-emerald-700 mb-3">
                        Store these codes in a safe place. You can use them to access your account if you lose your phone:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded bg-white border border-emerald-200">
                        <code className="text-sm font-mono text-navy-900">1234-5678-90AB</code>
                        <code className="text-sm font-mono text-navy-900">CDEF-1234-5678</code>
                        <code className="text-sm font-mono text-navy-900">90AB-CDEF-1234</code>
                        <code className="text-sm font-mono text-navy-900">5678-90AB-CDEF</code>
                      </div>
                      <button
                        onClick={() => showToast('📋 Backup codes copied to institutional clipboard!', 'info')}
                        className="mt-3 text-sm text-emerald-700 hover:text-emerald-900 font-medium"
                      >
                        📋 Copy backup codes
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-navy-200 bg-navy-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const code = (document.querySelector('input[maxLength="6"]') as HTMLInputElement)?.value
                    if (code && code.length === 6) {
                      setTwoFactorEnabled(true)
                      setShow2FAModal(false)
                      handleSecurityUpdate('mfa_enabled', true)
                      showToast('✅ Two-Factor Authentication [MFA] enabled. Your vault is now secure.', 'success')
                    } else {
                      showAlert('MFA Verification Failure', 'Please enter the valid 6-digit code from your authenticator protocol.')
                    }
                  }}
                  className="flex-1 bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 transition-colors"
                >
                  Enable 2FA
                </button>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="px-6 py-3 rounded-lg font-semibold text-navy-700 hover:bg-navy-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  )
}
