# Supabase Setup Guide for ProfileSeries

This guide will help you connect the ProfileSeries data to a real Supabase table.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be fully initialized

## Step 2: Create the Database Table

1. In your Supabase dashboard, go to the **SQL Editor**
2. Open the file `supabase_setup.sql` in this project
3. Copy and paste the SQL into the SQL Editor
4. Click **Run** to execute the SQL

This will create:
- The `profile_series` table with the correct schema
- Row Level Security (RLS) policies
- An index for better query performance
- Initial sample data

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 4: Configure Environment Variables

1. Create a `.env` file in the `project` directory (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Replace `your_project_url_here` and `your_anon_key_here` with your actual values from Step 3.

## Step 5: Restart Your Development Server

If your dev server is running, restart it to load the new environment variables:

```bash
npm run dev
```

## Step 6: Test the Connection

1. Open your application
2. Navigate to the Settings page
3. You should see the profile series loaded from Supabase
4. Try adding, editing, or deleting a profile series to verify the connection works

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env` file is in the `project` directory
- Verify the variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/updating the `.env` file

### "Error fetching profile series" in console
- Check that the `profile_series` table exists in your Supabase database
- Verify your RLS policies allow the operations you're trying to perform
- Check the Supabase dashboard logs for more details

### Data not appearing
- Check the browser console for errors
- Verify your Supabase credentials are correct
- Make sure the table has data (you can check in the Supabase Table Editor)

## Database Schema

The `profile_series` table has the following structure:

- `id` (UUID) - Primary key, auto-generated
- `name` (TEXT) - Name of the profile series
- `price_per_meter` (NUMERIC) - Price per meter
- `color_category` (TEXT) - Color category
- `created_at` (TIMESTAMP) - Auto-generated timestamp
- `updated_at` (TIMESTAMP) - Auto-generated timestamp

## Security Notes

The default RLS policy allows all operations. For production, you should:
1. Implement proper authentication
2. Create more restrictive RLS policies based on user roles
3. Consider using service role keys only on the server side

