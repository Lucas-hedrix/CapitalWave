-- Run this in your Supabase SQL Editor to allow Administrator Updates!

-- 1. Create a policy for the deposits table
CREATE POLICY "Admins can update deposits" 
ON public.deposits 
FOR UPDATE 
USING ( auth.email() = 'gishisrael432@gmail.com' );

-- 2. Create a policy for the kyc_documents table
CREATE POLICY "Admins can update kyc_documents" 
ON public.kyc_documents 
FOR UPDATE 
USING ( auth.email() = 'gishisrael432@gmail.com' );

-- Note: Make sure RLS is actually enabled on these tables, otherwise they wouldn't be blocking updates.
-- If you haven't enabled RLS, run these:
-- ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- If you also need the Admin to VIEW all deposits (sometimes they default to visible if no RLS is on, but just in case):
CREATE POLICY "Admins can view all deposits" 
ON public.deposits 
FOR SELECT 
USING ( auth.email() = 'gishisrael432@gmail.com' );

CREATE POLICY "Admins can view all kyc" 
ON public.kyc_documents 
FOR SELECT 
USING ( auth.email() = 'gishisrael432@gmail.com' );
