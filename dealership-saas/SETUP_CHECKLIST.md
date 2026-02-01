# ✅ Realtime Setup Checklist

Follow these steps in order to complete your realtime data sync setup:

## ✅ Step 1: Environment Variables (DONE)
- [x] `.env.local` file updated with your Supabase credentials
- [ ] **Restart your dev server**: `npm run dev` (IMPORTANT!)

## ✅ Step 2: Database Setup
- [ ] Open Supabase Dashboard: https://supabase.com/dashboard
- [ ] Go to **SQL Editor** → **New Query**
- [ ] Copy and paste the entire contents of `SUPABASE_QUICK_SETUP.sql`
- [ ] Click **Run** (or press Ctrl+Enter)
- [ ] Verify success message appears

## ✅ Step 3: Enable Realtime
- [ ] In Supabase Dashboard, go to **Database** → **Replication**
- [ ] Find the `vehicles` table in the list
- [ ] **Toggle ON** the Realtime switch for `vehicles`
- [ ] (Optional) Enable for `vehicle_images` and `documents` too

## ✅ Step 4: Storage Bucket Setup
- [ ] Go to **Storage** in Supabase Dashboard
- [ ] Click **New bucket**
- [ ] Name: `vehicles` (exact match required)
- [ ] Set to **Public**
- [ ] Click **Create bucket**

## ✅ Step 5: Test It!
- [ ] Restart your dev server: `npm run dev`
- [ ] Open two browser windows side-by-side
- [ ] Both navigate to: `http://localhost:3000/dashboard/inventory`
- [ ] In Window 1: Click "Add Vehicle" and create a vehicle
- [ ] Watch Window 2: Should automatically show the new vehicle! 🎉

## 🎯 What's Already Done For You:
- ✅ Environment variables configured
- ✅ Realtime listener component created
- ✅ Integrated into Inventory page
- ✅ SQL setup script ready

## 🚨 Common Issues:

**"Realtime not working"**
- Make sure you restarted the dev server after updating `.env.local`
- Check that Realtime is enabled in Supabase Dashboard → Database → Replication
- Open browser console (F12) and check for errors

**"Can't insert vehicles"**
- Check RLS policies are created (run the SQL script)
- Verify you're authenticated in Supabase
- Check browser console for specific error messages

**"Storage upload fails"**
- Verify `vehicles` bucket exists and is public
- Check Storage policies allow uploads

## 📞 Need Help?
- Check `REALTIME_SETUP.md` for detailed documentation
- Review Supabase logs: Dashboard → Logs
- Check browser console for client-side errors

---

**You're almost there! Just complete Steps 2-5 and you'll have realtime sync working! 🚀**
