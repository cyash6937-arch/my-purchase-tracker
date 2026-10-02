# 🚀 Deploying "My Purchase Tracker" for Free 24/7 on Render.com

Follow these 3 simple steps to get a **permanent, free HTTPS web address** (like `https://my-purchase-tracker.onrender.com`) that stays online 24/7/365, even when your laptop is turned off!

---

## Step 1: Create a Free GitHub Repository (1 minute)

1. Go to [github.com](https://github.com) and log in (or create a free account if you don't have one).
2. Click the **"+"** icon in the top-right corner $\rightarrow$ click **"New repository"**.
3. Repository name: `my-purchase-tracker`
4. Leave it as **Public** (or Private).
5. Do **NOT** check "Add a README" (your project already has everything).
6. Click the green **"Create repository"** button.

---

## Step 2: Push Your Project to GitHub (1 minute)

Copy and run these commands in your Windows PowerShell terminal:

```powershell
cd "C:\Users\Lenovo\.gemini\antigravity\scratch\my-purchase-tracker"

# Replace <YOUR-GITHUB-USERNAME> with your actual GitHub username:
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/my-purchase-tracker.git
git branch -M main
git push -u origin main
```

*(If prompted, log in to GitHub in your browser/terminal).*

---

## Step 3: Deploy for Free on Render.com (1 minute)

1. Open [render.com](https://render.com) and click **"Get Started"** (Sign in with your GitHub account).
2. In your Render Dashboard, click the blue **"New +"** button $\rightarrow$ Select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** $\rightarrow$ Click **"Next"**.
4. You will see your `my-purchase-tracker` repository listed. Click **"Connect"**.
5. Render will automatically detect the settings from `render.yaml`:
   - **Name**: `my-purchase-tracker` (or any custom name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ($0/month)
6. Click **"Deploy Web Service"** at the bottom!

---

## 🎉 That's It!
Render will automatically install dependencies, build the frontend, start the backend, and give you your permanent, live HTTPS link:

👉 **`https://my-purchase-tracker.onrender.com`**

- Runs **24 hours a day, 7 days a week**.
- Never expires.
- Accessible on every smartphone, tablet, and PC across the globe!
