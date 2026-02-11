"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { Toast, ActionModal } from "@/components/ui/institutional-portal"

interface ModalState {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    showInput?: boolean
    inputPlaceholder?: string
    type: 'confirm' | 'alert' | 'prompt' | 'institutional'
    onConfirm?: (input?: string) => void
    onCancel?: () => void
}

interface ToastState {
    id: string
    message: string
    type: 'success' | 'warning' | 'error' | 'info'
}

interface UIContextType {
    showToast: (message: string, type?: ToastState['type']) => void
    showAlert: (title: string, message: string, confirmText?: string) => void
    showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void
    showPrompt: (title: string, message: string, onConfirm: (input?: string) => void, placeholder?: string, confirmText?: string) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function InstitutionalUIProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: "",
        message: "",
        type: 'alert'
    })
    const [toasts, setToasts] = useState<ToastState[]>([])

    const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, message, type }])
    }, [])

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showAlert = useCallback((title: string, message: string, confirmText = "Dismiss") => {
        setModal({
            isOpen: true,
            title,
            message,
            confirmText,
            type: 'alert',
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false })),
            onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
        })
    }, [])

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, confirmText = "Confirm", cancelText = "Go Back") => {
        setModal({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            type: 'confirm',
            onConfirm: () => {
                onConfirm()
                setModal(prev => ({ ...prev, isOpen: false }))
            },
            onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
        })
    }, [])

    const showPrompt = useCallback((title: string, message: string, onConfirm: (input?: string) => void, placeholder = "", confirmText = "Submit") => {
        setModal({
            isOpen: true,
            title,
            message,
            confirmText,
            showInput: true,
            inputPlaceholder: placeholder,
            type: 'prompt',
            onConfirm: (input) => {
                onConfirm(input)
                setModal(prev => ({ ...prev, isOpen: false }))
            },
            onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
        })
    }, [])

    return (
        <UIContext.Provider value={{ showToast, showAlert, showConfirm, showPrompt }}>
            {children}
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => hideToast(toast.id)}
                />
            ))}
            <ActionModal
                {...modal}
                onCancel={() => {
                    modal.onCancel?.()
                    setModal(prev => ({ ...prev, isOpen: false }))
                }}
            />
        </UIContext.Provider>
    )
}

export function useInstitutionalUI() {
    const context = useContext(UIContext)
    if (context === undefined) {
        throw new Error('useInstitutionalUI must be used within an InstitutionalUIProvider')
    }
    return context
}
