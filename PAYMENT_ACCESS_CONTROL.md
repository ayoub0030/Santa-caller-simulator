# Payment-Based Access Control System

## 🔐 How It Works

Your Santa Call Simulator now has a complete payment-based access control system:

1. **Free Landing Page** - Anyone can see the landing page
2. **1-Minute Free Trial** - Users can start a call without paying
3. **Payment Required** - After 1 minute, users must pay to continue
4. **Paid Access** - After payment, users get 24-hour access to unlimited calls
5. **Session Expiry** - Access automatically expires after 24 hours

---

## 📱 User Flow

```
User visits landing page (/)
        ↓
Clicks "Start Santa Call (1 min free)"
        ↓
Call starts with 1-minute timer
        ↓
At 60 seconds: Payment prompt appears
        ↓
User clicks "Continue with Payment"
        ↓
Redirected to Stripe checkout (/payment)
        ↓
User enters card details
        ↓
Payment processed
        ↓
Payment session created (24-hour access)
        ↓
Redirected to call (/appelle)
        ↓
Call resumes (unlimited time)
        ↓
User can make unlimited calls for 24 hours
        ↓
After 24 hours: Access expires, must pay again
```

---

## 🔒 Access Control Details

### What's Protected?
- **`/appelle` route** - Santa call interface
- Users without valid payment session are redirected to payment page

### What's Open?
- **`/` route** - Landing page (anyone can view)
- **`/payment` route** - Payment page (anyone can access)
- **`/call` route** - Free 1-minute trial (anyone can start)

### Payment Session
- **Duration**: 24 hours from payment
- **Storage**: Browser localStorage
- **Scope**: Per device/browser (not synced across devices)
- **Expiry**: Automatic after 24 hours

---

## 💾 How Sessions Are Stored

### On Client Side (Browser)
```javascript
// Stored in localStorage as:
{
  "santa_payment_session": {
    "sessionId": "cs_test_...",
    "timestamp": 1703520000000,
    "paid": true,
    "expiresAt": 1703606400000
  }
}
```

### Session Data
- **sessionId**: Stripe checkout session ID
- **timestamp**: When payment was made
- **paid**: Whether payment was successful
- **expiresAt**: When access expires (24 hours later)

---

## 🔧 Implementation Details

### Files Created/Modified

**New Files:**
- `src/lib/paymentSession.ts` - Session management utilities
- `src/components/ProtectedRoute.tsx` - Route protection component

**Modified Files:**
- `src/pages/Payment.tsx` - Creates session after payment
- `src/App.tsx` - Wraps `/appelle` route with protection

### Key Functions

**`createPaymentSession(sessionId)`**
- Creates a new payment session
- Stores in localStorage
- Sets 24-hour expiry

**`hasValidPaymentSession()`**
- Checks if user has valid payment session
- Returns true if session exists and not expired
- Returns false if no session or expired

**`getPaymentSession()`**
- Retrieves current payment session
- Returns null if expired or not found

**`getRemainingSessionTime()`**
- Returns remaining time in seconds
- Used for displaying countdown

---

## 🧪 Testing the Access Control

### Test Scenario 1: Free Trial
1. Go to landing page
2. Click "Start Santa Call (1 min free)"
3. Call starts (no payment needed)
4. After 1 minute, payment prompt appears
5. Click "End Call" without paying
6. Try to access `/appelle` directly
7. Should see "Access Restricted" message

### Test Scenario 2: Paid Access
1. Go to landing page
2. Click "Buy Call Now ($4.99)"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Redirected to call page
6. Call works without time limit
7. Refresh page - still has access
8. Close browser and reopen - still has access (24 hours)

### Test Scenario 3: Session Expiry
1. Complete payment (creates 24-hour session)
2. Wait 24 hours (or manually edit localStorage expiry time)
3. Try to access `/appelle`
4. Should see "Access Restricted" message
5. Must pay again

---

## 📊 Security Considerations

### Current Implementation (Client-Side)
✅ **Pros:**
- Works offline
- No server database needed
- Fast and responsive
- Works with Vercel deployment

⚠️ **Limitations:**
- Session stored in browser localStorage
- User could manually edit localStorage to extend access
- Not synced across devices

### For Production (Optional Enhancement)
If you want more security, you could:
1. Store sessions in a database (Supabase)
2. Verify session on backend before allowing calls
3. Sync sessions across devices
4. Add IP-based restrictions

---

## 🚀 Deployment on Vercel

### What Works
✅ Payment system works on Vercel
✅ Session storage works (localStorage)
✅ Access control works
✅ 24-hour expiry works

### What to Configure
1. Add environment variables to Vercel:
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_STRIPE_PRICE_ID`
   - `STRIPE_SECRET_KEY` (for API functions)

2. Deploy API functions:
   - `api/create-checkout-session.ts`
   - `api/verify-payment.ts`

3. Vercel automatically deploys API functions from `/api` folder

---

## 📱 Per-Device Access

**Important:** Each device has its own session.

Example:
- User pays on iPhone → Gets 24-hour access on iPhone
- Same user on Android → Must pay again for Android
- Same user on desktop → Must pay again for desktop

**Why?**
- Sessions stored in browser localStorage
- Each device/browser has separate localStorage
- Not synced across devices

**If you want cross-device access:**
- Store sessions in database (Supabase)
- Verify session on backend
- Sync across devices using user account

---

## 🔄 Clearing Sessions

### User Clears Browser Data
If user clears browser cache/localStorage:
- Payment session is deleted
- Must pay again to access calls

### Programmatically Clear Session
```javascript
import { clearPaymentSession } from '@/lib/paymentSession';

// Clear session
clearPaymentSession();
```

---

## 📞 Support & Troubleshooting

### "Access Restricted" but I just paid
- Check if payment was successful in Stripe dashboard
- Check browser localStorage (F12 → Application → localStorage)
- Try refreshing page
- Try clearing browser cache and paying again

### Session not persisting across page refreshes
- Check if localStorage is enabled
- Check browser privacy settings
- Try different browser

### Can't access on another device
- This is expected - each device needs separate payment
- User must pay on each device they want to use

### Want to extend session beyond 24 hours
- Edit `PAYMENT_SESSION_EXPIRY` in `src/lib/paymentSession.ts`
- Change `24 * 60 * 60 * 1000` to desired duration

---

## 🎉 You're All Set!

Your Santa Call Simulator now has:
✅ Free 1-minute trial
✅ Payment required to continue
✅ 24-hour access after payment
✅ Automatic session expiry
✅ Per-device access control
✅ Works on Vercel deployment

Users can now only access Santa calls on their device after paying!
