"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Shield, Mail, Lock, Building2, Chrome } from 'lucide-react'
import { useInstitutionalUI } from '@/contexts/ui-context'

function mapAuthErrorMessage(raw: string, mode: 'signin' | 'signup') {
    const message = raw.toLowerCase()

    if (message.includes('email rate limit exceeded')) {
        if (mode === 'signup') {
            return 'Signup is temporarily throttled due to too many email requests. Wait about 30-60 minutes, or ask an admin to create/confirm your account directly in Supabase Auth.'
        }
        return 'Email actions are temporarily throttled. Wait about 30-60 minutes before retrying password recovery or signup flows.'
    }

    if (message.includes('invalid login credentials')) {
        return 'Invalid email or password. Confirm you are using the exact credentials for an active, confirmed account.'
    }

    if (message.includes('email not confirmed') || message.includes('not confirmed')) {
        return 'Your email is not confirmed yet. Open your inbox and complete the confirmation link before signing in.'
    }

    if (message.includes('refresh token') || message.includes('invalid session')) {
        return 'Your local session appears stale. Use "Purge Vault & Restart" below, then sign in again.'
    }

    return raw || 'Authentication failed. Please try again.'
}

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signIn, signUp, signInWithGoogle } = useAuth()
    const { showToast } = useInstitutionalUI()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isLogin) {
                await signIn(email, password)
            } else {
                if (!businessName) {
                    setError('Business name is required')
                    setLoading(false)
                    return
                }
                await signUp(email, password, businessName)
                showToast('✅ Account created! Check your email to verify your account.', 'success')
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'An error occurred'
            setError(mapAuthErrorMessage(message, isLogin ? 'signin' : 'signup'))
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')
        try {
            await signInWithGoogle()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Google sign-in failed'
            setError(mapAuthErrorMessage(message, 'signin'))
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-emerald-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 shadow-xl">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-navy-950">
                            {isLogin ? 'Welcome Back' : 'Start Your Free Trial'}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {isLogin
                                ? 'Sign in to access your compliance dashboard'
                                : '7 days free • No credit card required'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="signup-business-name" className="block text-sm font-bold text-navy-900 mb-2 uppercase tracking-wide">
                                    <Building2 className="inline h-4 w-4 mr-2" />
                                    Business Name
                                </label>
                                <Input
                                    id="signup-business-name"
                                    name="business_name"
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="e.g., Acme Solutions Ltd"
                                    className="h-12"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor={isLogin ? "signin-email" : "signup-email"} className="block text-sm font-bold text-navy-900 mb-2 uppercase tracking-wide">
                                <Mail className="inline h-4 w-4 mr-2" />
                                Email Address
                            </label>
                            <Input
                                id={isLogin ? "signin-email" : "signup-email"}
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="h-12"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor={isLogin ? "signin-password" : "signup-password"} className="block text-sm font-bold text-navy-900 mb-2 uppercase tracking-wide">
                                <Lock className="inline h-4 w-4 mr-2" />
                                Password
                            </label>
                            <Input
                                id={isLogin ? "signin-password" : "signup-password"}
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-12"
                                required
                            />
                            {!isLogin && (
                                <p className="text-xs text-navy-500 mt-2">
                                    Minimum 6 characters
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-navy-950 hover:bg-black text-white font-bold rounded-xl shadow-xl"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : isLogin ? (
                                'Sign In'
                            ) : (
                                'Start Free Trial'
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-navy-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-navy-500 font-bold">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        className="w-full h-12 border-2 border-navy-200 hover:bg-navy-50 font-bold rounded-xl"
                        disabled={loading}
                    >
                        <Chrome className="mr-2 h-5 w-5" />
                        Google
                    </Button>

                    {(error?.toLowerCase().includes('refresh token') || error?.toLowerCase().includes('invalid session')) && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }}
                                className="w-full text-xs text-rose-500 hover:underline font-bold uppercase tracking-widest"
                            >
                                ⚠ Stale Session Detected: Purge Vault & Restart
                            </button>
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError('')
                            }}
                            className="text-sm text-navy-600 hover:text-navy-900 font-semibold"
                        >
                            {isLogin
                                ? "Don't have an account? Sign up for free"
                                : 'Already have an account? Sign in'}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="pt-4 border-t border-navy-100">
                            <p className="text-xs text-navy-500 text-center leading-relaxed">
                                By signing up, you agree to our Terms of Service and Privacy Policy.
                                Your 7-day free trial starts immediately.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
