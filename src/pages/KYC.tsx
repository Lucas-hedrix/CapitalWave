import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function KYC() {
  const { user, kycStatus, setKycStatus } = useUserStore();
  
  const [kycBase64, setKycBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Authentication Error. Please log in again.');
      return;
    }
    if (!kycBase64) {
      toast.error('Please upload your ID to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_url: kycBase64,
          status: 'pending'
        });

      if (error) throw error;

      setKycStatus('pending');
      toast.success('ID submitted successfully! Awaiting approval.');
      setKycBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Identity Verification</h1>
        <p className="text-slate-400">Manage your KYC status to unlock full account features, including cash withdrawals.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 gap-y-12 items-start">
        
        {/* Left Col: Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 sm:p-8 relative overflow-hidden"
          onPaste={onPaste}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {kycStatus === 'pending' ? (
            <div className="text-center py-8 relative z-10">
              <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center text-warning mx-auto mb-6 ring-4 ring-warning/5">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Verification Pending</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Your ID represents a pending review by our compliance team. Full features will be unlocked upon approval.
              </p>
            </div>
          ) : kycStatus === 'approved' ? (
            <div className="text-center py-8 relative z-10">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mx-auto mb-6 ring-4 ring-success/5">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Verification Complete</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Your identity has been fully verified. You have full access to all platform features.
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {kycStatus === 'rejected' ? 'Verification Rejected' : 'Submit Your ID'}
                </h3>
                <p className="text-sm text-slate-400">
                  {kycStatus === 'rejected' 
                    ? 'Your previous submission was not accepted. Please upload a clearer copy of your government-issued ID.'
                    : 'To comply with regulatory requirements and unlock withdrawals, we need a photo of your government-issued ID.'}
                </p>
              </div>

              {!kycBase64 ? (
                <div 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    "border-2 border-dashed bg-navy/50 rounded-xl p-8 transition-all cursor-pointer group flex flex-col items-center justify-center",
                    isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-primary/50"
                  )}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
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

              {kycBase64 && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-primary to-sky-500 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Verification'
                  )}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        {/* Right Col: Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-primary">Why do we need this?</h4>
              <p className="text-sm text-primary/80 leading-relaxed">
                As a regulated financial institution, CapitalWave is required to comply with Anti-Money Laundering (AML) and Know Your Customer (KYC) laws to keep our platform secure.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Accepted Documents</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>State-issued Driver's License</span>
              </li>
              <li className="flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Passport or National ID Card</span>
              </li>
              <li className="flex gap-2 items-center text-danger">
                <ShieldX className="w-4 h-4" />
                <span>We do not accept school IDs, library cards, or expired documents.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
