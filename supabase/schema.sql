-- ============================================================
-- UrunanKuy — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users profile (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE DEFAULT SUBSTRING(uuid_generate_v4()::TEXT, 1, 8),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Members
CREATE TABLE IF NOT EXISTS public.trip_members (
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

-- Expense Categories (enum-like)
-- Values: food, transport, accommodation, activity, shopping, other

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('food', 'transport', 'accommodation', 'activity', 'shopping', 'other')),
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Splits
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_amount NUMERIC(15,2) NOT NULL CHECK (share_amount >= 0),
  share_type TEXT DEFAULT 'equal' CHECK (share_type IN ('equal', 'percentage', 'exact')),
  share_percentage NUMERIC(5,2), -- stored for percentage type
  UNIQUE (expense_id, user_id)
);

-- Settlements
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  from_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  to_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- PROFILES: user can see & edit own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow trip members to see each other's profiles
CREATE POLICY "profiles_select_trip_members" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm1
      INNER JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
      WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
    )
  );

-- TRIPS: members can see their trips
CREATE POLICY "trips_select_member" ON public.trips
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = trips.id AND user_id = auth.uid()
    )
  );

-- Allow anyone to view trip by invite_code (for join flow)
CREATE POLICY "trips_select_by_invite" ON public.trips
  FOR SELECT USING (true); -- controlled by invite_code; we filter in app

CREATE POLICY "trips_insert_auth" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "trips_update_admin" ON public.trips
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = trips.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- TRIP MEMBERS
-- Helper function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_my_trips()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trip_id FROM trip_members WHERE user_id = auth.uid();
$$;

CREATE POLICY "trip_members_select" ON public.trip_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "trip_members_insert" ON public.trip_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "trip_members_delete_own" ON public.trip_members
  FOR DELETE USING (user_id = auth.uid());

-- EXPENSES: trip members can see/add
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_insert_member" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "expenses_update_member" ON public.expenses
  FOR UPDATE USING (
    paid_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "expenses_delete_member" ON public.expenses
  FOR DELETE USING (
    paid_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- EXPENSE SPLITS
CREATE POLICY "expense_splits_select" ON public.expense_splits
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "expense_splits_insert" ON public.expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      INNER JOIN public.trip_members tm ON e.trip_id = tm.trip_id
      WHERE e.id = expense_splits.expense_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "expense_splits_delete" ON public.expense_splits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      INNER JOIN public.trip_members tm ON e.trip_id = tm.trip_id
      WHERE e.id = expense_splits.expense_id AND tm.user_id = auth.uid()
    )
  );

-- SETTLEMENTS
CREATE POLICY "settlements_select" ON public.settlements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "settlements_insert_member" ON public.settlements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = settlements.trip_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "settlements_delete" ON public.settlements
  FOR DELETE USING (from_user = auth.uid());

-- ============================================================
-- INDEXES (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_trip_members_user ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON public.expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_trip ON public.settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON public.trips(invite_code);
