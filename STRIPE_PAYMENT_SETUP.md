# Stripe Payment Integration - Santa Call Simulator

## 🎄 Payment Flow Overview

1. User clicks "Call Santa" on landing page
2. Call starts with **1 minute FREE trial**
3. At 50 seconds, warning appears: "Free trial ending in X seconds"
4. At 60 seconds, call pauses and payment prompt appears
5. User clicks "Continue with Payment"
6. Redirected to Stripe checkout
7. After payment, user returns and can continue call

---

## 💳 Stripe Setup Instructions

### Step 1: Create Stripe Account

1. Go to [Stripe.com](https://stripe.com)
2. Click **"Sign up"**
3. Create account with email and password
4. Verify email
5. Complete account setup

### Step 2: Get API Keys

1. Go to **Dashboard** → **Developers** → **API Keys**
2. You'll see two keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
3. Copy both keys (you'll need them)

### Step 3: Create a Product

1. Go to **Products** → **Add product**
2. Fill in:
   - **Name**: `Santa Call - Unlimited`
   - **Description**: `Unlimited voice conversation with Santa Claus`
   - **Type**: `Service`
3. Click **Create product**

### Step 4: Create a Price

1. In the product page, go to **Pricing**
2. Click **Add price**
3. Fill in:
   - **Price**: `4.99` (or your desired price)
   - **Currency**: `USD` (or your currency)
   - **Billing period**: `One-time`
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_`)

### Step 5: Set Up Environment Variables

Add these to your `.env` file:

```env
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_PRICE_ID=price_your_price_id_here
```

**Important**: 
- Use `pk_test_` and `price_test_` during development
- Switch to `pk_live_` and `price_live_` for production
- Never commit secret keys to git

### Step 6: Add Vercel Environment Variables

If deploying to Vercel:

1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add:
   - `VITE_STRIPE_PUBLISHABLE_KEY` = your publishable key
   - `VITE_STRIPE_PRICE_ID` = your price ID
4. Click **Save**

---

## 🔧 Backend Setup (Required for Production)

For production, you need a backend to handle Stripe checkout sessions. Here's the setup:

### Option 1: Use Vercel Functions (Recommended)

Create `/api/create-checkout-session.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, returnUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
```

Create `/api/verify-payment.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json({ 
        success: false, 
        error: 'Payment not completed' 
      });
    }
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
}
```

### Step 2: Add Stripe Secret Key to Vercel

1. Go to Vercel project settings
2. **Environment Variables**
3. Add: `STRIPE_SECRET_KEY` = your secret key
4. Deploy

---

## 📱 Frontend Integration (Already Done)

The following files have been created/updated:

### Files Created:
- `src/pages/Payment.tsx` - Payment page UI
- `src/lib/stripe.ts` - Stripe utilities

### Files Updated:
- `src/pages/Call.tsx` - Added 1-minute timer and payment prompt
- `src/App.tsx` - Added `/payment` route
- `package.json` - Added Stripe dependencies

---

## 🧪 Testing the Payment Flow

### Test Mode (Development)

1. Use Stripe test keys (pk_test_, sk_test_)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC

### Test Scenarios:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`

**Payment Declined:**
- Card: `4000 0000 0000 0002`
- Expiry: `12/25`
- CVC: `123`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`
- Expiry: `12/25`
- CVC: `123`

---

## 🔄 Payment Flow Diagram

```
User clicks "Call Santa"
        ↓
Call starts (1 minute FREE)
        ↓
At 50 seconds: Warning appears
        ↓
At 60 seconds: Call pauses
        ↓
Payment prompt shown
        ↓
User clicks "Continue with Payment"
        ↓
Redirected to Stripe checkout
        ↓
User enters card details
        ↓
Payment processed
        ↓
Redirected back to /appelle
        ↓
Call resumes (unlimited time)
```

---

## 📊 Monitoring Payments

### In Stripe Dashboard:

1. Go to **Payments**
2. See all transactions
3. View payment details
4. Refund if needed

### Webhook Setup (Optional but Recommended):

For production, set up webhooks to track payment events:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Stripe account created
- [ ] Product created in Stripe
- [ ] Price created in Stripe
- [ ] API keys obtained
- [ ] Backend API functions created (`/api/create-checkout-session`, `/api/verify-payment`)
- [ ] Environment variables set in `.env`
- [ ] Environment variables set in Vercel
- [ ] Test payment flow with test card
- [ ] Switch to live keys (pk_live_, sk_live_)
- [ ] Test with real card (optional)
- [ ] Monitor Stripe dashboard for transactions

---

## 🐛 Troubleshooting

### "Missing VITE_STRIPE_PUBLISHABLE_KEY"
- Check `.env` file has the key
- Restart dev server
- Check Vercel environment variables

### "Failed to create checkout session"
- Verify backend API is deployed
- Check Stripe secret key in Vercel
- Check price ID is correct
- Review API function logs

### Payment not verifying
- Check session ID is passed correctly
- Verify Stripe secret key
- Check payment status in Stripe dashboard

### Test card not working
- Use exact test card numbers from Stripe docs
- Check expiry date is in future
- Try different test card

---

## 💰 Pricing Strategy

Current setup: **$4.99 for unlimited call**

You can adjust:
- Price amount in Stripe dashboard
- Free trial duration (currently 60 seconds)
- Payment prompt message

---

## 📞 Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Vercel Functions Guide](https://vercel.com/docs/functions/serverless-functions)

---

## ✅ Verification Steps

1. **Landing Page**: Click "Call Santa" button
2. **Call Starts**: Should see 1-minute timer
3. **At 50 seconds**: Warning should appear
4. **At 60 seconds**: Payment prompt should appear
5. **Click Payment**: Should redirect to Stripe checkout
6. **Enter Test Card**: Use `4242 4242 4242 4242`
7. **Complete Payment**: Should redirect back to call
8. **Success**: Should see "Payment Successful" message

---

**Your Santa Call Simulator is now ready for monetization! 🎅💳**
