# Putting thedigitalwit on the internet

This guide assumes you've never deployed a website. You won't need the command
line. Allow about an hour the first time, most of it waiting.

**What you'll end up with:** the site live at a free address like
`https://thedigitalwit.vercel.app`, optionally on your own domain, and every
change you make going live automatically about two minutes after you publish it.

**What it costs:** nothing to start.
- **GitHub** stores your code (free).
- **Vercel** runs the website. Its free "Hobby" plan is for personal,
  non-commercial use; if thedigitalwit makes money (ads, sponsorships, paid
  plans) you'll need Vercel Pro. Check Vercel's current pricing page.
- **Supabase** (login) has a free tier.
- **A domain name** is optional, roughly $10–20 a year.

Screens change from time to time; if a button has moved, look for the same words.

---

## Before you start: a quick local check

In Terminal:
```
cd ~/thedigitalwit
npm run check
npm run build
```
Both should finish without errors. (`npm run check` ends with "Tests … passed".)

---

## Step 1. Create two free accounts

1. **GitHub:** go to **github.com** and sign up.
2. **Vercel:** go to **vercel.com**, click **Sign Up**, choose the Hobby plan,
   and pick **Continue with GitHub**. This connects the two accounts.

## Step 2. Put your code on GitHub (with GitHub Desktop)

GitHub Desktop is a normal Mac app that does the uploading for you.

1. Download it from **desktop.github.com**, open it, and sign in with your GitHub account.
2. Choose **File → Add Local Repository…** and select the `thedigitalwit` folder
   in your home folder.
3. It will say the folder "does not appear to be a Git repository". Click
   **create a repository** in that message.
   - Name: `thedigitalwit`
   - Leave **Git ignore** as **None** (the project already has its own list of files to leave out).
   - Click **Create Repository**.
4. **Safety check:** in the left-hand list of files, make sure you do **not** see
   `.env.local` or `node_modules`. They're excluded on purpose, because `.env.local`
   holds your private keys. If you see either one, stop and ask for help.
5. Click **Publish repository** (top bar). Keep **"Keep this code private"**
   ticked, then click **Publish Repository**.

Your code is now on GitHub, visible only to you.

## Step 3. Launch it on Vercel

1. On **vercel.com**, click **Add New… → Project**.
2. Find `thedigitalwit` in the list and click **Import**. (If it's missing, click
   **Adjust GitHub App Permissions** and give Vercel access to that repository.)
3. Vercel recognises it as **Next.js** automatically. Leave the build settings alone.
4. Open **Environment Variables**. If you've already done [AUTH_SETUP.md](AUTH_SETUP.md),
   add these two (copy the values from your `.env.local`):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://….supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |

   Haven't set up login yet? Skip this; the site works without it, and you can add them later (Step 6).

   For the AI in the "Describe your case" boxes, also add `ANTHROPIC_API_KEY` (from
   console.anthropic.com → API Keys). Optional: without it, a built-in reader is used.
5. Click **Deploy** and wait 2–3 minutes. When the confetti appears, click
   **Continue to Dashboard** and then **Visit**.

Your site is live at the address shown under **Domains** (something like
`thedigitalwit.vercel.app`).

## Step 4. Check the live site

Spend five minutes clicking through:

- [ ] Home page loads, stats count up, and the red strip scrolls.
- [ ] **Buy-Side → any calculator → Load example** shows a solved value.
- [ ] Header search finds "roas".
- [ ] **Media Mix Model → Load sample data → Fit model** returns a result. This one
      runs on Vercel's servers, so it confirms the server side works.
- [ ] **Creative Studio** opens with the sample creative scored across 50+ formats; **Export → Everything as .zip** downloads.
- [ ] On your phone: the menu opens and pages fit the screen.
- [ ] If you added the Supabase keys: **Log in** works. (Step 6 needs to be done first.)

## Step 5. Use your own domain (optional)

1. Buy a domain from any registrar (Namecheap, Cloudflare, Porkbun, GoDaddy…),
   or buy it directly in Vercel.
2. In Vercel: your project → **Settings → Domains → Add**, type your domain
   (e.g. `thedigitalwit.com`) and accept the suggestion to also add `www`.
3. Vercel shows one or two DNS records (usually an **A** record and a **CNAME**).
   Log in to your registrar, find **DNS settings**, and add exactly those records.
   (If you bought the domain in Vercel, this happens automatically.)
4. Wait. It's often minutes, but can take up to a day. Vercel shows a green tick
   and sets up the padlock (HTTPS) for you.
5. In Vercel → **Settings → Environment Variables**, add
   `NEXT_PUBLIC_SITE_URL` = `https://www.your-real-domain.com` (no trailing slash).
   This makes link previews and the sitemap use your domain.
6. Go to **Deployments**, open the menu (⋯) on the latest one, and click
   **Redeploy** so the new setting takes effect.

## Step 6. Connect login to the live site

Do this after [AUTH_SETUP.md](AUTH_SETUP.md), and again whenever your address changes.

1. **Vercel:** make sure the two `NEXT_PUBLIC_SUPABASE_…` variables are set
   (Settings → Environment Variables), then **Redeploy**.
2. **Supabase → Authentication → URL Configuration:**
   - **Site URL:** your live address (e.g. `https://www.thedigitalwit.com`)
   - **Redirect URLs:** add `https://www.thedigitalwit.com/**`, and also
     `https://thedigitalwit.vercel.app/**` if you'll use that address too.
3. **Google Cloud → your OAuth client → Authorized JavaScript origins:** add the live address.
4. **Google Auth Platform → Audience → Publish app**, so anyone (not just test users) can sign in.
5. **Supabase → Authentication → Emails → SMTP Settings:** connect a real email
   sender before you announce the site; the built-in one is only for testing.
6. Test all three sign-in options on the live site, then save and reopen a calculator scenario.

Microsoft needs no change for a new domain; it only knows about Supabase's address.

---

## Making changes later

1. Edit files on your computer and check them with `npm run dev`, then `npm run check`.
2. Open GitHub Desktop. Your changes are listed on the left. Type a short summary
   (e.g. "Update footer text") in the box at the bottom left, click
   **Commit to main**, then **Push origin**.
3. Vercel notices and publishes automatically. Watch it under **Deployments**;
   it's live about two minutes later.

## If something goes wrong

- **A deploy failed:** Vercel → **Deployments** → click the failed one → read the
  **Build Logs**. The live site keeps running the last version that worked. The
  usual cause is a typo in a data file. Run `npm run check` locally, fix it, and push again.
- **The new version is broken:** Vercel → **Deployments** → find the last good
  one → ⋯ → **Promote to Production**. That's an instant rollback; fix the
  problem at your own pace.
- **Login stopped working after a domain change:** recheck Step 6, items 2 and 3.
- **Changed an environment variable and nothing happened:** these only apply to
  new deploys. Use **Redeploy**.
