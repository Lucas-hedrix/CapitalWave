-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
  cash_balance DECIMAL DEFAULT 0.00 NOT NULL,
  margin_used DECIMAL DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Positions Table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  average_entry_price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, asset_symbol)
);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Buy', 'Sell', 'Deposit', 'Withdrawal')),
  asset_symbol TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  status TEXT DEFAULT 'Completed' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profiles." ON public.profiles FOR SELECT USING ( auth.uid() = id );
CREATE POLICY "Users can insert own profiles." ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profiles." ON public.profiles FOR UPDATE USING ( auth.uid() = id );

CREATE POLICY "Users can view own portfolios." ON public.portfolios FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own portfolios." ON public.portfolios FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own portfolios." ON public.portfolios FOR UPDATE USING ( auth.uid() = user_id );

CREATE POLICY "Users can view own positions." ON public.positions FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own positions." ON public.positions FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own positions." ON public.positions FOR UPDATE USING ( auth.uid() = user_id );

CREATE POLICY "Users can view own transactions." ON public.transactions FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own transactions." ON public.transactions FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own transactions." ON public.transactions FOR UPDATE USING ( auth.uid() = user_id );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );

  -- Create initial empty portfolio for the user with $10,000 mock funds
  INSERT INTO public.portfolios (user_id, cash_balance)
  VALUES (new.id, 10000.00);

  -- Create initial deposit transaction record
  INSERT INTO public.transactions (user_id, type, asset_symbol, quantity, price)
  VALUES (new.id, 'Deposit', 'USD', 10000.00, 1.00);

  RETURN new;
END;
$$;

-- Trigger that calls the function after a row is inserted in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
