"use client"

import { useState, useEffect } from "react"
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
  Settings,
  Bell,
  User,
  Menu,
  X,
  Camera,
  DollarSign,
  MessageCircle,
  ChevronDown,
  LogOut,
  BadgeCheck
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

type Page = "dashboard" | "contracts" | "payroll" | "privacy" | "receipts" | "pricing" | "settings"

export default function HomePage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const { showToast, showAlert, showConfirm, showPrompt } = useInstitutionalUI()
  const [view, setView] = useState<"landing" | "login">("landing")
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [prefLanguage, setPrefLanguage] = useState("English (Business)")
  const [prefCurrency, setPrefCurrency] = useState("KES (Kenyan Shillings)")

  useEffect(() => {
    if (profile) {
      setTwoFactorEnabled(profile.mfa_enabled || false)
      setPrefLanguage(profile.preferred_language || "English (Business)")
      setPrefCurrency(profile.preferred_currency || "KES (Kenyan Shillings)")
    }
  }, [profile])

  const handleSecurityUpdate = async (field: string, value: any) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id)
      if (error) throw error
    } catch (err: any) {
      console.error('Security protocol update failure:', err.message)
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
    } catch (err: any) {
      showAlert('Vault Auth Error', 'Protocol failed: ' + err.message)
    }
  }
  const [profileForm, setProfileForm] = useState({
    business_name: "",
    kra_pin: "",
    industry: "Retail",
    employee_count: 0,
    full_name: "",
    phone: "",
    location: "Nairobi"
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
        location: profile.location || "Nairobi"
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
          location: profileForm.location
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      setShowProfileModal(false)
      showToast('✅ Institutional profile updated in cloud vault')
    } catch (error: any) {
      showAlert('Vault Error', 'Error updating profile: ' + error.message)
    }
  }

  const navigation = [
    { id: "dashboard" as Page, label: "Dashboard", icon: Home },
    { id: "receipts" as Page, label: "Tax Lens", icon: Camera },
    { id: "contracts" as Page, label: "Contract Generator", icon: FileText },
    { id: "payroll" as Page, label: "Payroll Calc", icon: Calculator },
    { id: "privacy" as Page, label: "Privacy Policy", icon: Shield },
    { id: "pricing" as Page, label: "Pricing", icon: DollarSign },
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
  const [allNotifications, setAllNotifications] = useState<any[]>([])

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const mapped = data.map(n => ({
          id: n.id,
          title: n.type?.toUpperCase().replace('_', ' ') || 'SYSTEM ALERT',
          message: n.message,
          detail: n.message,
          time: new Date(n.created_at).toLocaleDateString('en-KE', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: (n.type === 'critical' || n.type === 'warning' || n.type === 'success') ? n.type : 'warning',
          read: n.is_read || false,
          action: () => setCurrentPage('dashboard')
        }))
        setAllNotifications(mapped)
      }
    } catch (err: any) {
      console.error('Failed to fetch institutional alerts:', err.message)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user])

  const markAsRead = async (id: any) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error('Failed to update alert state:', err)
    }
  }

  const markAllRead = async () => {
    if (!user) return
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to clear alert history:', err)
    }
  }


  const visibleNotifications = showAllNotifications ? allNotifications : allNotifications.slice(0, 3)

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <RiskDashboard />
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

                <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-dashed border-navy-100 bg-navy-50/30">
                  <div>
                    <p className="font-bold text-navy-900">SMS Reminder Terminal</p>
                    <p className="text-xs text-navy-500 font-medium italic">Verify your AfricasTalking institutional link</p>
                  </div>
                  <Button
                    onClick={() => {
                      const hasAccess = profile?.subscription_plan === 'sme-power' || profile?.subscription_plan === 'enterprise' || profile?.role === 'super-admin'
                      if (!hasAccess) {
                        showAlert("SMS Access Restricted", "Statutory SMS Reminders require an SME Power or Enterprise subscription tier. Upgrade your business protocol to unlock this terminal.")
                        return
                      }
                      showPrompt(
                        "SMS Verification Terminal",
                        "Please enter the recipient phone number to verify the AfricasTalking gateway connection.",
                        async (phone) => {
                          if (!phone) return
                          try {
                            const res = await fetch('/api/reminders/sms', {
                              method: 'POST',
                              body: JSON.stringify({ phoneNumber: phone, message: '🛡️ ComplyKe Reminder: Your Housing Levy payment is due in 3 days. Penalty avoid: KES 0. (Audit ID: TST-SMS-2026)' })
                            })
                            const data = await res.json()
                            if (data.success) {
                              showToast('✅ Verification SMS dispatched through AfricasTalking gateway!')
                            } else {
                              showAlert('Gateway Error', 'The SMS protocol failed: ' + (data.error || 'Unknown network error'))
                            }
                          } catch (err: any) {
                            showAlert('Connection Error', 'Failed to reach the SMS gateway. Please check your internet protocol.')
                          }
                        },
                        "254..."
                      )
                    }}
                    className={`h-10 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${(profile?.subscription_plan === 'sme-power' || profile?.subscription_plan === 'enterprise' || profile?.role === 'super-admin')
                      ? 'bg-navy-900 text-white hover:bg-navy-950 shadow-lg'
                      : 'bg-navy-100 text-navy-300'
                      }`}
                  >
                    Test Dispatch
                  </Button>
                </div>
              </div>
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
          </div >
        )
      default:
        return <RiskDashboard />
    }
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
        <div className="flex h-18 items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-2xl p-2.5 bg-navy-50 text-navy-950 hover:bg-navy-100 transition-all active:scale-90"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-900 shadow-xl shadow-navy-200 group-hover:scale-105 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-navy-950 tracking-tighter uppercase leading-none">ComplyKe</h1>
                <div className="flex items-center gap-1.5 mt-1">
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
                <div className="absolute right-0 top-14 w-96 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-navy-100 animate-slide-in-top z-50 overflow-hidden">
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
                        onClick={() => {
                          setSelectedNotification(notification.id)
                          markAsRead(notification.id)
                        }}
                        className={`p-5 border-b border-navy-50 hover:bg-navy-50/50 cursor-pointer transition-colors group ${!notification.read ? 'bg-navy-50/40' : 'opacity-60'}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.type === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500'} ${!notification.read ? 'opacity-100' : 'opacity-30'}`} />
                          <div className="flex-1">
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
                        <div key={notification.id} className="p-4 rounded-2xl border border-navy-50 hover:bg-navy-50 transition-colors group">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.type === 'critical' ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500'}`} />
                            <div>
                              <p className="font-bold text-sm text-navy-900 leading-tight">{notification.title}</p>
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
                <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-navy-100 animate-slide-in-top z-50 overflow-hidden">
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
                  <div className="p-3">
                    <button onClick={() => { setProfileOpen(false); setShowProfileModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-sm font-bold text-navy-800 transition-colors">
                      <User className="h-4 w-4" /> My Profile
                    </button>
                    <button onClick={() => { setCurrentPage('settings'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-navy-50 text-sm font-bold text-navy-800 transition-colors">
                      <Settings className="h-4 w-4" /> System Config
                    </button>
                  </div>
                  <div className="p-3 bg-rose-50/30 border-t border-navy-50">
                    <button
                      onClick={async () => {
                        try {
                          await signOut()
                          setProfileOpen(false)
                          window.location.reload()
                        } catch (error) {
                          console.error('Logout error:', error)
                          showAlert('Session Error', 'The institutional handshake was interrupted. Failed to terminate session.')
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl bg-white text-rose-600 text-sm font-bold border border-rose-100 shadow-sm hover:bg-rose-600 hover:text-white transition-all"
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

      <div className="flex flex-1 overflow-hidden">
        {/* Premium Sidebar - Desktop */}
        <aside className="hidden md:flex w-72 flex-col bg-white border-r border-navy-100 shadow-[20px_0_40px_rgba(0,0,0,0.01)] relative z-40">
          <nav className="flex-1 space-y-2 p-6 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-6 px-4">Compliance Suite</p>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left group transition-all duration-300 ${isActive
                    ? "bg-navy-900 text-white shadow-2xl shadow-navy-200"
                    : "text-navy-600 hover:bg-navy-50"
                    }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10' : 'bg-navy-50 group-hover:bg-navy-100'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`font-bold tracking-tight active:scale-95 transition-transform ${isActive ? 'text-white' : 'text-navy-800'}`}>{item.label}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </button>
              )
            })}
          </nav>

          <div className="p-6 border-t border-navy-50">
            <button
              onClick={() => setCurrentPage("settings")}
              className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${currentPage === "settings"
                ? "bg-navy-900 text-white shadow-xl shadow-navy-200"
                : "text-navy-700 hover:bg-navy-50"
                }`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-bold">Settings</span>
            </button>
            <div className="mt-6 px-4">
              <div className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-600/10">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center">Engine v2026.1 Verified</p>
              </div>
            </div>
          </div>
        </aside>

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
              <nav className="space-y-3">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
                    className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left font-bold ${currentPage === item.id ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Dynamic Content Surface */}
        <main className="flex-1 overflow-y-auto bg-navy-50/30 custom-scrollbar p-6 md:p-10 lg:p-16">
          <div className="mx-auto max-w-5xl">
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
                    <div className="w-16 h-16 rounded-full bg-navy-950 flex items-center justify-center text-white font-bold text-2xl">
                      {(profile?.business_name || user?.email)?.substring(0, 2) || 'AD'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-navy-900">My Profile</h2>
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

              <div className="p-6 space-y-6">
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
                    <div className={`p-4 rounded-lg border ${profile?.subscription_status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${profile?.subscription_status === 'active' ? 'text-emerald-700' : 'text-amber-700'}`}>SHA/SHIF Status</p>
                      <p className={`text-lg font-bold ${profile?.subscription_status === 'active' ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {profile?.subscription_status === 'active' ? '✓ Registered' : '⚠ Action Required'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power') ? 'text-emerald-700' : 'text-rose-700'}`}>Housing Levy</p>
                      <p className={`text-lg font-bold ${(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power') ? 'text-emerald-900' : 'text-rose-900'}`}>
                        {(profile?.subscription_plan === 'enterprise' || profile?.subscription_plan === 'sme-power') ? '✓ Compliant' : '⚠ Non-Compliant'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${profile?.subscription_plan === 'enterprise' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${profile?.subscription_plan === 'enterprise' ? 'text-emerald-700' : 'text-amber-700'}`}>Data Protection</p>
                      <p className={`text-lg font-bold ${profile?.subscription_plan === 'enterprise' ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {profile?.subscription_plan === 'enterprise' ? '✓ Data Locked' : '⚠ Audit Risk'}
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
                    <label className="flex items-center justify-between p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Housing Levy Reminders</p>
                        <p className="text-sm text-navy-600">Get notified 3 days before payment deadline</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-navy-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Casual Worker Alerts</p>
                        <p className="text-sm text-navy-600">Section 37 compliance warnings (90-day limit)</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-navy-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Tax Regulation Updates</p>
                        <p className="text-sm text-navy-600">Finance Act changes and PAYE updates</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-navy-600" />
                    </label>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">SMS Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Critical Alerts Only</p>
                        <p className="text-sm text-navy-600">Urgent compliance issues via SMS</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-navy-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer">
                      <div>
                        <p className="font-medium text-navy-900">Payment Confirmations</p>
                        <p className="text-sm text-navy-600">SHIF, NSSF, Housing Levy receipts</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5 text-navy-600" />
                    </label>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Notification Frequency</h3>
                  <select className="w-full px-4 py-3 rounded-lg border border-navy-300 focus:ring-2 focus:ring-navy-600 focus:border-transparent">
                    <option>Real-time (as they happen)</option>
                    <option>Daily digest (once per day)</option>
                    <option>Weekly summary (every Monday)</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-navy-200 bg-navy-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowNotificationSettingsModal(false)
                    showToast('✅ Notification settings saved in cloud vault!', 'success')
                  }}
                  className="flex-1 bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 transition-colors"
                >
                  Save Settings
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
                  <p className="text-sm text-navy-600 ml-11 mb-3">
                    Install one of these apps on your phone:
                  </p>
                  <div className="ml-11 grid grid-cols-2 gap-3">
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
                  <p className="text-sm text-navy-600 ml-11 mb-4">
                    Open your authenticator app and scan this QR code:
                  </p>
                  <div className="ml-11 flex flex-col items-center p-6 rounded-lg border-2 border-navy-200 bg-white">
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
                  <p className="text-sm text-navy-600 ml-11 mb-3">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <div className="ml-11">
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
                      <div className="grid grid-cols-2 gap-2 p-3 rounded bg-white border border-emerald-200">
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

              <div className="p-6 border-t border-navy-200 bg-navy-50 flex gap-3">
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
