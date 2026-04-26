# Supabase Storage Setup

This app keeps Firebase Auth and Firestore, and uses Supabase Storage only for driver document uploads.

## 1. Create the bucket

Create a bucket in Supabase Storage:

- Bucket name: `driver-documents`
- Visibility: `Private`

You can use a different bucket name, but then update `VITE_SUPABASE_DRIVER_BUCKET`.

## 2. Add frontend env vars

Create a `.env` file for the Vite app:

```txt
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
VITE_SUPABASE_DRIVER_BUCKET=driver-documents
```

Restart the dev server after adding the env file.

## 3. Enable Firebase Auth in Supabase

In Supabase:

1. Open `Authentication`
2. Open `Third-Party Auth`
3. Add the Firebase integration for your Firebase project

This app uses the current Firebase ID token to access Supabase Storage.

## 4. Give Firebase users the authenticated role

Supabase expects Firebase users to have the custom claim:

```txt
role: authenticated
```

Without that claim, Storage requests will be treated as `anon` and private bucket access will fail.

You can set it with the helper script in this repo:

```txt
npm run set:supabase-role -- your-firebase-uid
```

Before running it:

- Download a Firebase service account JSON from `Firebase -> Project settings -> Service accounts`
- Save it in the project root as `serviceAccountKey.json`

If you want to keep the JSON elsewhere, set:

```txt
FIREBASE_SERVICE_ACCOUNT_PATH=path-to-your-json
```

## 5. Add Storage policies

Create Storage policies on `storage.objects` so only your admin email can read and write driver files.

Example policy condition:

```sql
bucket_id = 'driver-documents'
and (auth.jwt() ->> 'email') = 'andinitravels@gmail.com'
```

Apply that condition to:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`

If you have multiple admins later, we can expand the policy.

## Notes

- Driver images are compressed in the browser before upload.
- New uploads store Supabase object paths in Firestore, not permanent public URLs.
- Existing `http` image URLs still render, so older records are not broken.
