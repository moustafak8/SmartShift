import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string, duration = 5000) => {
            const id = generateId();
            const newToast = { id, type, message, duration };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        },
        [removeToast]
    );

    const success = useCallback((msg: string, duration?: number) => addToast('success', msg, duration), [addToast]);
    const error = useCallback((msg: string, duration?: number) => addToast('error', msg, duration), [addToast]);
    const info = useCallback((msg: string, duration?: number) => addToast('info', msg, duration), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full p-4">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    React.useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success': return 'border-l-emerald-500';
            case 'error': return 'border-l-red-500';
            case 'info': return 'border-l-blue-500';
        }
    }

    return (
        <div
            className={`
        pointer-events-auto
        flex items-start gap-3 p-4 rounded-md shadow-lg border border-gray-100 bg-white 
        border-l-4 ${getBorderColor()}
        transition-all duration-300 ease-in-out transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
            role="alert"
        >
            {getIcon()}
            <div className="flex-1 text-sm font-medium text-gray-800 break-words">
                {toast.message}
            </div>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onDismiss, 300); // Wait for exit animation
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
