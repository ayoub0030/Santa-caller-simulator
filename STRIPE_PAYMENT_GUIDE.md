# Complete Stripe Payment Setup Guide - Step by Step

## 🎅 Quick Overview

You're creating a payment system where:
- Users get **1 minute FREE** to talk to Santa
- After 1 minute, they pay **$4.99** to continue
- Payment is processed through Stripe

---

## 📋 Step 1: Create Stripe Account

### If you don't have an account yet:

1. Go to [stripe.com](https://stripe.com)
2. Click **"Sign up"** (top right)
3. Enter your email and create password
4. Verify your email
5. Complete account setup with business info

### If you already have an account:
Skip to **Step 2**

---

## 🔑 Step 2: Get Your API Keys

These are like passwords that connect your app to Stripe.

### How to find them:

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Developers"** (left sidebar)
3. Click **"API keys"** (in the submenu)
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Copy your keys:

```
Publishable Key: pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
Secret Key: sk_test_XXXXXXXXXXXXXXXXXXXXXXXX
```

**⚠️ IMPORTANT**: 
- Never share your secret key
- Never put it in public code
- Use `pk_test_` and `sk_test_` for testing
- Switch to `pk_live_` and `sk_live_` for real money

---

## 📦 Step 3: Create a Product

This is what you're selling (Santa call access).

### In Stripe Dashboard:

1. Click **"Products"** (left sidebar)
2. Click **"Add product"** (blue button)
3. Fill in the form:

```
Name: Santa Call - Unlimited
Description: Unlimited voice conversation with Santa Claus
Type: Service (not Physical good)
```

4. Click **"Create product"**

---

## 💰 Step 4: Create a Price

This is how much you charge.

### In the product page:

1. Scroll to **"Pricing"** section
2. Click **"Add price"**
3. Fill in:

```
Price: 4.99
Currency: USD (or your currency)
Billing period: One-time (not recurring)
```

4. Click **"Save product"**
5. **Copy the Price ID** (looks like `price_1234567890`)

---

## 🔧 Step 5: Add Keys to Your Project

Now connect Stripe to your app.

### In your project folder:

1. Open `.env` file
2. Add these lines:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
VITE_STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
```

**Replace:**
- `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key
- `price_YOUR_PRICE_ID_HERE` with your actual price ID

### Example:

```env
```

3. Save the file
4. **Restart your dev server** (`npm run dev`)

---

## 🌐 Step 6: Deploy Backend Functions (Vercel)

Your app needs a backend to process payments. We'll use Vercel Functions.

### Create the first function:

1. In your project, create folder: `api`
2. Create file: `api/create-checkout-session.ts`
3. Paste this code:

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

### Create the second function:

1. Create file: `api/verify-payment.ts`
2. Paste this code:

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

---

## 🚀 Step 7: Add Secret Key to Vercel

Your backend functions need the secret key to work.

### In Vercel:

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Click **"Settings"** (top menu)
4. Click **"Environment Variables"** (left sidebar)
5. Click **"Add New"**
6. Fill in:

```
Name: STRIPE_SECRET_KEY
Value: sk_test_YOUR_SECRET_KEY_HERE
```

7. Click **"Save**
8. Click **"Deploy"** to apply changes

---

## 🧪 Step 8: Test the Payment Flow

### Test with fake card:

1. Start your app (`npm run dev`)
2. Go to landing page
3. Click **"Call Santa"**
4. Wait 1 minute (or skip to test)
5. Click **"Continue with Payment"**
6. You'll see Stripe checkout
7. Enter test card:

```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
Name: Test User
```

8. Click **"Pay"**
9. Should see success message

### Other test cards:

**Declined payment:**
```
4000 0000 0000 0002
```

**Requires authentication:**
```
4000 0025 0000 3155
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Stripe account created
- [ ] API keys obtained
- [ ] Product created in Stripe
- [ ] Price created in Stripe
- [ ] `.env` file updated with keys
- [ ] Backend functions created (`api/create-checkout-session.ts`, `api/verify-payment.ts`)
- [ ] Secret key added to Vercel
- [ ] Test payment successful with test card
- [ ] Payment prompt appears after 1 minute
- [ ] Call pauses when payment needed
- [ ] Redirect to Stripe works
- [ ] Return from Stripe works

---

## 🔄 Payment Flow Diagram

```
User clicks "Call Santa"
        ↓
Call starts (FREE for 1 minute)
        ↓
Timer counts: 0:00 → 1:00
        ↓
At 0:50: Warning appears "10 seconds left"
        ↓
At 1:00: Call pauses
        ↓
Payment prompt shows "$4.99"
        ↓
User clicks "Continue with Payment"
        ↓
Redirected to Stripe checkout
        ↓
User enters card details
        ↓
Stripe processes payment
        ↓
Redirected back to app
        ↓
Success message shown
        ↓
Call resumes (unlimited time)
```

---

## 🎯 What Happens Behind the Scenes

1. **Frontend** (your app) sends payment request
2. **Backend** (Vercel Function) creates Stripe session
3. **Stripe** shows checkout page
4. **User** enters card details
5. **Stripe** processes payment
6. **Backend** verifies payment succeeded
7. **Frontend** shows success and resumes call

---

## 💡 Troubleshooting

### "Missing VITE_STRIPE_PUBLISHABLE_KEY"
- Check `.env` file has the key
- Restart dev server
- Make sure you copied the full key

### "Failed to create checkout session"
- Check backend functions are deployed
- Check secret key is in Vercel
- Check price ID is correct
- Look at Vercel function logs

### Test card not working
- Use exact card number: `4242 4242 4242 4242`
- Use future expiry date
- Use any 3-digit CVC
- Check you're in test mode (pk_test_, sk_test_)

### Payment not verifying
- Check session ID is passed correctly
- Verify secret key in Vercel
- Check payment in Stripe dashboard

---

## 🔐 Security Tips

1. **Never commit `.env`** to git
2. **Never share secret key** with anyone
3. **Use test keys** during development
4. **Switch to live keys** only when ready
5. **Enable 2FA** on Stripe account
6. **Monitor transactions** in Stripe dashboard

---

## 📊 Monitor Your Payments

### In Stripe Dashboard:

1. Click **"Payments"** (left sidebar)
2. See all transactions
3. Click transaction to see details
4. Refund if needed

---

## 🎉 You're Ready!

Your Santa Call Simulator now has a complete payment system:
- ✅ 1-minute free trial
- ✅ Payment prompt
- ✅ Stripe checkout
- ✅ Payment verification
- ✅ Call resumption

**Next steps:**
1. Follow steps 1-7 above
2. Test with test card
3. Switch to live keys when ready
4. Deploy to production

---

## 📞 Need Help?

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)

---

**Happy selling! 🎅💳**
