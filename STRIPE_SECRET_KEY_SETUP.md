# Adding Your Stripe Secret Key

## 🔑 Step 1: Get Your Secret Key from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Developers"** (left sidebar)
3. Click **"API keys"**
4. Find the **"Secret key"** (starts with `sk_test_` or `sk_live_`)
5. Click **"Copy"** to copy it

## 📝 Step 2: Add to .env File

1. Open `.env` file in your project
2. Find this line:
```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

3. Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key

### Example:
```
STRIPE_SECRET_KEY=sk_test_51RV9kAB7vFVtRGRlp8Lit7s4VhTReXYCSipwcPkpu2feUvyAWCLfJZNW2DqC0oir7gheBhB9mVLDzTYb2MLuDwjD00ahdkWfst
```

## ⚠️ Important Notes

- **Never share your secret key** with anyone
- **Never commit `.env`** to git
- Use `sk_test_` for development/testing
- Switch to `sk_live_` only when going to production with real money

## 🚀 Step 3: Restart Your Dev Server

After adding the secret key:

1. Stop your dev server (Ctrl+C)
2. Run: `npm run dev`
3. The API functions should now work

## ✅ Test It

1. Go to your app
2. Click "Call Santa"
3. Wait 1 minute (or skip)
4. Click "Continue with Payment"
5. Should redirect to Stripe checkout (no 404 error)

---

**That's it! Your payment system is now ready to test.** 🎉
