"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    profile: any | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, businessName?: string) => Promise<void>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.error('Error fetching profile:', error.message || error)
                return
            }

            if (!data) {
                console.log('Profile missing, creating default institutional profile...')
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
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('Error creating profile:', createError.message || createError)
                    return
                }
                setProfile(newProfile)
                return
            }

            setProfile(data)
        } catch (error: any) {
            console.error('Unexpected error in fetchProfile:', error.message || error)
        }
    }

    useEffect(() => {
        // Safety timeout: Never stay in loading state for more than 5 seconds
        // This prevents the "Verifying Institutional Session" from hanging indefinitely
        // due to network latency or Supabase connector issues.
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn('🛡️ Auth Safety: Forcing session resolution after timeout.');
                setLoading(false);
            }
        }, 5000);

        // Check active session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const currentUser = session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                }
            } catch (err) {
                console.error('🛡️ Auth initialization error:', err)
            } finally {
                setLoading(false)
                clearTimeout(safetyTimer)
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`🛡️ Auth Event: ${event}`)
                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    await fetchProfile(currentUser.id)
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
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
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

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, signInWithGoogle }}>
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
