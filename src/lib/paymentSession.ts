// Payment session management for access control

const PAYMENT_SESSION_KEY = 'santa_payment_session';
const PAYMENT_SESSION_EXPIRY = 400 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface PaymentSession {
  sessionId: string;
  timestamp: number;
  paid: boolean;
  expiresAt: number;
}

/**
 * Create a payment session after successful payment
 */
export const createPaymentSession = (sessionId: string): PaymentSession => {
  const now = Date.now();
  const session: PaymentSession = {
    sessionId,
    timestamp: now,
    paid: true,
    expiresAt: now + PAYMENT_SESSION_EXPIRY,
  };
  
  // Store in localStorage
  localStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(session));
  
  return session;
};

/**
 * Get current payment session
 */
export const getPaymentSession = (): PaymentSession | null => {
  try {
    const stored = localStorage.getItem(PAYMENT_SESSION_KEY);
    if (!stored) return null;
    
    const session: PaymentSession = JSON.parse(stored);
    
    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      clearPaymentSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error reading payment session:', error);
    return null;
  }
};

/**
 * Check if user has valid payment session
 */
export const hasValidPaymentSession = (): boolean => {
  const session = getPaymentSession();
  return session !== null && session.paid === true;
};

/**
 * Clear payment session
 */
export const clearPaymentSession = (): void => {
  localStorage.removeItem(PAYMENT_SESSION_KEY);
};

/**
 * Get remaining time in session (in seconds)
 */
export const getRemainingSessionTime = (): number => {
  const session = getPaymentSession();
  if (!session) return 0;
  
  const remaining = session.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
};

/**
 * Format remaining time for display
 */
export const formatRemainingTime = (): string => {
  const seconds = getRemainingSessionTime();
  
  if (seconds === 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
