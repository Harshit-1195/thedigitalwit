# Setting up login (Supabase, Google, Microsoft, email)

You don't need any of this for the site to work. Every calculator and tool runs
without it. Login only switches on **saving**. Until you finish these steps, the
login page shows "Sign-in isn't switched on yet."

Allow about 45 minutes. Dashboards get redesigned from time to time, so if a
button has moved, look for the same words nearby.

> **Two addresses you'll need throughout.** Write them down as you go:
> - **Your site address.** While testing that's `http://localhost:3000`. After launch it's your real domain, for example `https://thedigitalwit.com`.
> - **Your Supabase callback URL.** It looks like `https://abcdefgh.supabase.co/auth/v1/callback`. Step 1 shows where to find it.

---

## 1. Create the Supabase project

1. Go to **supabase.com**, sign up (free), and click **New project**.
2. Pick a name (e.g. `thedigitalwit`), set a strong database password (save it in your password manager), and choose the region closest to most of your users.
3. When it finishes, open **Project Settings → API** (on some accounts it's called **API Keys**). Copy two things:
   - the **Project URL** (`https://abcdefgh.supabase.co`)
   - the **publishable key** (starts with `sb_publishable_`; older projects call it the **anon public** key)
4. Your **callback URL** is the Project URL with `/auth/v1/callback` added to the end.

## 2. Put the keys in the project

1. In the `thedigitalwit` folder, copy `.env.example` to a new file named `.env.local`.
2. Replace the two placeholder values with what you copied:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
3. Stop the site (Ctrl+C) and run `npm run dev` again. The login buttons become active.

`.env.local` is never uploaded anywhere; it stays on your computer.

## 3. Create the "saved items" table

1. In Supabase, open **SQL Editor → New query**.
2. Open `supabase/migrations/0001_saved_items.sql` from this project, copy all of it, paste it in, and click **Run**.
3. You should see "Success. No rows returned."

This creates the table and its security rules, so each person can only ever see,
add or delete **their own** saved items.

## 4. Tell Supabase where your site lives

**Authentication → URL Configuration:**

- **Site URL:** `http://localhost:3000` while testing. Change it to your real domain after launch.
- **Redirect URLs:** add both of these (and your real domain later):
  - `http://localhost:3000/**`
  - `https://YOUR-DOMAIN/**`

Without this, Supabase refuses to send people back to your site after sign-in.

## 5. Email sign-in

**Authentication → Sign In / Providers → Email:**

- Make sure **Email** is enabled and **Confirm email** is on. That's what makes an
  account active only once the email is verified.

**Authentication → Emails → Templates → Magic Link:** replace the body so the email
has both a link and a code (the login page accepts either):

```html
<h2>Sign in to thedigitalwit</h2>
<p><a href="{{ .ConfirmationURL }}">Click here to sign in</a></p>
<p>Or enter this code on the sign-in page: <strong>{{ .Token }}</strong></p>
<p>If you didn't ask for this, you can ignore this email.</p>
```

Do the same for the **Confirm signup** template, so new users also get a code.

**Before launch:** Supabase's built-in email sender only allows a handful of emails
per hour and is meant for testing. Under **Authentication → Emails → SMTP Settings**,
connect a proper sender (for example Resend, Postmark or Amazon SES; most have a
free tier). *Verify the current limits in the Supabase docs.*

## 6. "Continue with Google"

1. Go to **console.cloud.google.com** and create a project (top bar → project picker → **New project**).
2. Open **Google Auth Platform** (older screens say **APIs & Services → OAuth consent screen**):
   - **Branding:** app name `thedigitalwit`, your support email, your logo if you have one.
   - **Audience:** choose **External**.
   - **Data access:** the default `email`, `profile` and `openid` scopes are all you need.
3. Open **Clients → Create client**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `http://localhost:3000` and your real domain
   - **Authorized redirect URIs:** your **Supabase callback URL** from step 1
4. Copy the **Client ID** and **Client secret**.
5. In Supabase, open **Authentication → Sign In / Providers → Google**, switch it on, paste both, and save.
6. When you launch, go back to **Audience** and click **Publish app**. Until then only test users you've added can sign in.

## 7. "Continue with Microsoft" (covers Outlook, Hotmail and work accounts)

1. Go to **portal.azure.com** (a free Microsoft account works) and search for **App registrations → New registration**.
   - Name: `thedigitalwit`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**. This is the option that includes Outlook.com and Hotmail.
   - Redirect URI: platform **Web**, value = your **Supabase callback URL**.
   - Click **Register**.
2. On the app's **Overview** page, copy the **Application (client) ID**.
3. Open **Certificates & secrets → New client secret**. Pick the longest expiry offered and copy the **Value** right away (not the "Secret ID"; it's only shown once). Put a reminder in your calendar a few weeks before it expires.
4. Open **Token configuration → Add optional claim → ID** and tick **email** and **xms_edov**, then save (accept the prompt to add the Microsoft Graph permission). This tells Supabase the email address is verified, which is what lets a Microsoft sign-in join an existing account with the same email.
5. In Supabase, open **Authentication → Sign In / Providers → Azure**, switch it on, paste the client ID and secret value, and set **Azure Tenant URL** to `https://login.microsoftonline.com/common`. Save.

*Microsoft renames these screens often. Verify against Microsoft's and Supabase's
current "Login with Azure" guides if anything looks different.*

## 8. One account per email

You don't need to switch anything on. When someone signs in with Google or
Microsoft using an email that already has an account, Supabase links them into
the **same account** automatically, as long as the provider confirms the email is
verified. Google always does; Microsoft does once you've added the claim in step 7.4.

## 9. Test it

1. Run `npm run dev` and open `http://localhost:3000/login`.
2. Try each of the three options.
3. Open any calculator, click **Load example**, then **Save scenario**.
4. Open **Account → My saved items** in the header. Your scenario should be listed; **Open** brings it back.

## When you launch

Add the same two values (`NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) in your hosting provider's environment
variables. Then add your real domain to:

- Supabase **Site URL** and **Redirect URLs** (step 4)
- Google **Authorized JavaScript origins** (step 6)

The Supabase callback URL itself doesn't change.
