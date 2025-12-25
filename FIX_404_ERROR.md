# Fix 404 Error - Payment API Not Found

## 🔴 Problem
When you click "Buy Call Now" or "Continue with Payment", you get:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
POST http://localhost:8080/api/create-checkout-session 404
```

## ✅ Solution

The API functions exist but need your **Stripe Secret Key** to work. Follow these steps:

### Step 1: Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Developers"** (left sidebar)
3. Click **"API keys"**
4. Find **"Secret key"** (starts with `sk_test_` or `sk_live_`)
5. Click the **copy icon** next to it

### Step 2: Add Secret Key to .env

1. Open `.env` file in your project
2. Find this line:
```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

3. Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key

**Example:**
```
STRIPE_SECRET_KEY=sk_test_51RV9kAB7vFVtRGRlp8Lit7s4VhTReXYCSipwcPkpu2feUvyAWCLfJZNW2DqC0oir7gheBhB9mVLDzTYb2MLuDwjD00ahdkWfst
```

### Step 3: Restart Dev Server

1. Stop your dev server (press `Ctrl+C`)
2. Run: `npm run dev`
3. Wait for it to start

### Step 4: Test Payment

1. Go to your app (http://localhost:8080)
2. Click **"Buy Call Now"** button
3. Should redirect to Stripe checkout (no 404 error)
4. Use test card: `4242 4242 4242 4242`
5. Expiry: `12/25` | CVC: `123`

---

## ⚠️ Important Notes

- **Never share your secret key** with anyone
- **Never commit `.env`** to git
- Use `sk_test_` for development
- Switch to `sk_live_` only for production with real money

---

## 🆘 Still Getting 404?

If you still get 404 after adding the secret key:

1. **Check the secret key is correct** - Copy it again from Stripe
2. **Make sure you saved `.env`** - File should be saved
3. **Restart dev server** - Stop and run `npm run dev` again
4. **Clear browser cache** - Press `Ctrl+Shift+Delete` and clear cache
5. **Check console for errors** - Open browser DevTools (F12) and look for error messages

---

## 📝 What the API Functions Do

- **`/api/create-checkout-session`** - Creates a Stripe checkout page
- **`/api/verify-payment`** - Checks if payment was successful

Both need the secret key to work with Stripe.

---

**Once you add the secret key and restart, the payment flow will work!** 🎉
