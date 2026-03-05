import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STEPS = ['Account Details', 'Identity Verification'];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [kycBase64, setKycBase64] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all fields');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (error) throw error;
      
      // If we got here, account created successfully
      if (data.user) {
        useUserStore.getState().setUser(data.user);
        useUserStore.getState().setSession(data.session);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // If we're on step 1, we need to create the account before moving to step 2
    if (currentStep === 0) {
      const success = await handleCreateAccount();
      if (!success) return; // Don't advance if creation failed
    }

    if (currentStep === 1) {
      // Step 2: KYC Upload Check
      if (!kycBase64) {
        toast.error('Please upload your ID to continue.');
        return;
      }
      
      const user = useUserStore.getState().user;
      if (!user) return;
      
      setLoading(true);
      try {
        const { error } = await supabase
          .from('kyc_documents')
          .insert({
            user_id: user.id,
            document_url: kycBase64,
            status: 'pending'
          });

        if (error) throw error;
        useUserStore.getState().setKycStatus('pending');
        
        toast.success('Account created and ID submitted for review!');
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit ID.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-navy-light/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome to CapitalWave
          </h2>
          <p className="text-slate-400">Complete these steps to start trading.</p>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-2 z-10 w-1/3">
                <div 
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300",
                    i < currentStep ? "bg-success text-white" :
                    i === currentStep ? "bg-primary text-white ring-4 ring-primary/20" :
                    "bg-navy-lighter text-slate-500 border border-white/10"
                  )}
                >
                  {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={clsx(
                  "text-xs hidden sm:block transition-colors",
                  i <= currentStep ? "text-slate-200" : "text-slate-500"
                )}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-1 bg-navy-lighter rounded-full -mt-[3.25rem] sm:-mt-[4.25rem] mx-[16%] sm:mx-[16%] z-0 border border-white/5">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-success rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <div className="h-12" />
        </div>

        <div className="min-h-[300px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && <StepOne formData={formData} updateForm={updateForm} />}
              {currentStep === 1 && <StepTwo kycBase64={kycBase64} setKycBase64={setKycBase64} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-between pt-6 border-t border-white/5">
          {currentStep > 0 ? (
            <button 
              onClick={() => setCurrentStep(c => c - 1)}
              className="text-slate-400 hover:text-white font-medium transition-colors"
            >
              Back
            </button>
          ) : (
            <Link to="/" className="text-slate-400 hover:text-white font-medium transition-colors">
              Cancel
            </Link>
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 bg-white text-navy font-bold py-3 px-6 rounded-lg hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Continue'}
            {!loading && currentStep < STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
}

// Sub-components
function StepOne({ formData, updateForm }: { formData: any, updateForm: (f: any, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-slate-300">First Name</span>
          <input 
            type="text" 
            value={formData.firstName}
            onChange={(e) => updateForm('firstName', e.target.value)}
            className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
            placeholder="John" 
          />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-slate-300">Last Name</span>
          <input 
            type="text" 
            value={formData.lastName}
            onChange={(e) => updateForm('lastName', e.target.value)}
            className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
            placeholder="Doe" 
          />
        </label>
      </div>
      <label className="space-y-1.5 block">
        <span className="text-sm font-medium text-slate-300">Email Address</span>
        <input 
          type="email" 
          value={formData.email}
          onChange={(e) => updateForm('email', e.target.value)}
          className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
          placeholder="john@example.com" 
        />
      </label>
      <label className="space-y-1.5 block">
        <span className="text-sm font-medium text-slate-300">Secure Password</span>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
          <input 
            type="password" 
            value={formData.password}
            onChange={(e) => updateForm('password', e.target.value)}
            className="w-full bg-navy border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
            placeholder="••••••••" 
          />
        </div>
      </label>
    </div>
  );
}

function StepTwo({ kycBase64, setKycBase64 }: { kycBase64: string | null, setKycBase64: (val: string | null) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setKycBase64(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) handleFile(blob);
      }
    }
  };

  return (
    <div className="space-y-6 text-center" onPaste={onPaste}>
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Verify Your Identity</h3>
        <p className="text-sm text-slate-400">
          To comply with regulatory requirements, we need a photo of your government-issued ID.
        </p>
      </div>

      {!kycBase64 ? (
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById('kyc-upload')?.click()}
          className={clsx(
            "border-2 border-dashed bg-navy/50 rounded-xl p-8 transition-all cursor-pointer group flex flex-col items-center justify-center",
            isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-primary/50"
          )}
        >
          <input 
            type="file" 
            id="kyc-upload" 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <UploadCloud className={clsx(
            "w-10 h-10 mb-3 transition-colors",
            isDragging ? "text-primary scale-110" : "text-slate-500 group-hover:text-primary"
          )} />
          <p className="text-white font-medium mb-1">Click, drag & drop, or paste image here</p>
          <p className="text-xs text-slate-500">PNG or JPG (max. 5MB)</p>
        </div>
      ) : (
        <div className="relative rounded-xl border border-white/10 bg-navy/50 p-2 overflow-hidden group">
          <img src={kycBase64} alt="ID Preview" className="w-full h-48 object-cover rounded-lg opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setKycBase64(null)}
              className="bg-danger/90 hover:bg-danger text-white px-4 py-2 rounded-lg font-medium shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
            >
              Remove & Re-upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
