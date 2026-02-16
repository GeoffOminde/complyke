"use client"

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { isTrialExpired } from '@/lib/entitlements'

export interface Profile {
    id: string
    full_name?: string
    business_name?: string
    kra_pin?: string
    industry?: string
    employee_count?: number
    num_employees?: number
    phone?: string
    location?: string
    role?: 'user' | 'admin' | 'super-admin'
    subscription_plan?: 'free' | 'growth' | 'enterprise' | 'sme-power' | 'micro-entity' | 'free_trial' | 'trial'
    subscription_status?: 'active' | 'inactive' | 'trialing' | 'past_due'
    subscription_end_date?: string
    logo_url?: string
    mfa_enabled?: boolean
    preferred_language?: string
    preferred_currency?: string
    business_address?: string
    registration_number?: string
    kra_pin_certificate_url?: string
    is_verified?: boolean
    compliance_score?: number
    created_at?: string
}

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, businessName?: string) => Promise<void>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isInvalidLocalSession(message: string, status?: number) {
    const normalized = message.toLowerCase()
    return (
        normalized.includes('refresh token') ||
        normalized.includes('invalid session') ||
        normalized.includes('jwt') ||
        status === 400
    )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const loadingRef = useRef(true)

    useEffect(() => {
        loadingRef.current = loading
    }, [loading])

    const fetchProfile = async (userId: string, email?: string) => {
        console.log('Vault: Fetching institutional profile for', userId)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.error('Vault Error:', error.message || error)
                return
            }

            if (!data) {
                console.log('Vault: Creating new institutional record...')
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        business_name: 'My Business',
                        full_name: '',
                        phone: '',
                        location: 'Nairobi',
                        subscription_plan: 'free_trial',
                        subscription_status: 'active',
                        subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        role: 'user'
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('Vault Creation Failed:', createError.message || createError)
                    return
                }
                setProfile(newProfile)
                return
            }

            const isSuperAdmin = data.role === 'super-admin'
            const trialExpired = isTrialExpired(data.subscription_plan, data.subscription_end_date)
            if (trialExpired && !isSuperAdmin) {
                await supabase
                    .from('profiles')
                    .update({ subscription_status: 'past_due' })
                    .eq('id', userId)
                data.subscription_status = 'past_due'
            }

            console.log('Vault: Profile loaded successfully')
            const enhancedProfile = {
                ...data,
                role: data.role || 'user'
            }
            setProfile(enhancedProfile)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unexpected error'
            console.error('Vault Unexpected Error:', message)
        }
    }

    useEffect(() => {
        // Safety timeout: Never stay in loading state for more than 5 seconds
        // This prevents the "Verifying Institutional Session" from hanging indefinitely
        // due to network latency or Supabase connector issues.
        const safetyTimer = setTimeout(() => {
            if (loadingRef.current) {
                console.warn('Auth Safety: Forcing session resolution after timeout.')
                setLoading(false)
            }
        }, 5000)

        // Check active session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    setUser(null)
                    setProfile(null)
                    return
                }

                // Validate the local session with Supabase to avoid stale "ghost" sessions.
                const { data: userData, error: userError } = await supabase.auth.getUser()
                if (userError || !userData.user) {
                    const userErrorMessage = userError?.message || 'Session validation failed'
                    const userErrorStatus = userError?.status
                    if (isInvalidLocalSession(userErrorMessage, userErrorStatus)) {
                        console.warn('Auth session invalid. Clearing local state and requiring fresh login.')
                        localStorage.clear()
                        sessionStorage.clear()
                    }
                    setUser(null)
                    setProfile(null)
                    return
                }

                setUser(userData.user)
                await fetchProfile(userData.user.id, userData.user.email)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : ''
                const status = (err as { status?: number }).status
                console.error('Auth initialization error:', message || 'Unknown auth error')
                // If we get a 400/Invalid Refresh Token, purge local state to allow fresh login
                if (isInvalidLocalSession(message, status)) {
                    console.warn('Purging stale local session...')
                    localStorage.clear()
                    sessionStorage.clear()
                }
            } finally {
                setLoading(false)
                clearTimeout(safetyTimer)
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`Auth Event: ${event}`)
                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    await fetchProfile(currentUser.id, currentUser.email)
                } else {
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => {
            clearTimeout(safetyTimer)
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                console.error('Sign-in Error Object:', error)
                throw error
            }
        } catch (err: any) {
            console.error('Sign-in Unexpected Exception:', err)
            throw err
        }
    }

    const signUp = async (email: string, password: string, businessName?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    business_name: businessName,
                }
            }
        })
        if (error) throw error

        // Create profile
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    business_name: businessName,
                    full_name: '',
                    phone: '',
                    location: 'Nairobi',
                    subscription_plan: 'free_trial',
                    subscription_status: 'active',
                    subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                })

            if (profileError) console.error('Profile creation error:', profileError)
        }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) throw error
    }

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id, user.email)
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, signInWithGoogle, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
