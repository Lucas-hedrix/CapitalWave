import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Search, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'Deposits' | 'KYC'>('Deposits');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [kycdocs, setKycdocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch Deposits - we need to manually join with auth.users or profiles if available.
      // Since supabase JS doesn't easily join auth.users directly without RPC, we'll fetch all users from our local 'portfolios' or rely on the deposits table having user_id
      // For simplicity in this build, we fetch deposits and then fetch email/name if we have a profiles table. 
      // If no profiles table exists, we'll just show the user_id.

      const { data: depData, error: depError } = await supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (depError) throw depError;
      setDeposits(depData || []);

      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;
      setKycdocs(kycData || []);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeposit = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Deposit marked as ${newStatus}`);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error('Failed to update deposit');
      fetchAdminData(); // revert
    }
  };

  const handleUpdateKYC = async (id: string, newStatus: string) => {
     // Optimistic UI update
     setKycdocs(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    
     try {
       const { error } = await supabase
         .from('kyc_documents')
         .update({ status: newStatus })
         .eq('id', id);
 
       if (error) throw error;
       toast.success(`KYC marked as ${newStatus}`);
     } catch (error: any) {
       console.error('Update failed:', error);
       toast.error('Failed to update KYC');
       fetchAdminData(); // revert
     }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-danger" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Manage platform deposits and identity verification requests.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('Deposits')}
          className={clsx(
            "pb-3 text-sm font-semibold transition-colors border-b-2",
            activeTab === 'Deposits' ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-300"
          )}
        >
          Deposit Approvals
          {deposits.filter(d => d.status === 'pending').length > 0 && (
            <span className="ml-2 bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full">
              {deposits.filter(d => d.status === 'pending').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('KYC')}
          className={clsx(
            "pb-3 text-sm font-semibold transition-colors border-b-2",
            activeTab === 'KYC' ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-300"
          )}
        >
          KYC Approvals
          {kycdocs.filter(d => d.status === 'pending').length > 0 && (
            <span className="ml-2 bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full">
              {kycdocs.filter(d => d.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 bg-navy-lighter/50">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">User ID / Ref</th>
              <th className="p-4 font-medium">Details</th>
              <th className="p-4 font-medium">Document</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                  Loading records...
                </td>
              </tr>
            ) : activeTab === 'Deposits' ? (
              deposits.filter(d => d.id.includes(searchQuery) || d.user_id.includes(searchQuery)).length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No deposits found.</td></tr>
              ) : (
                deposits.filter(d => d.id.includes(searchQuery) || d.user_id.includes(searchQuery)).map(dep => (
                  <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-slate-400">{new Date(dep.created_at).toLocaleString()}</td>
                    <td className="p-4 text-xs font-mono text-slate-500 max-w-[150px] truncate" title={dep.user_id}>{dep.user_id}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">${Number(dep.amount).toLocaleString()} <span className="text-slate-400 text-sm font-normal">{dep.currency}</span></div>
                    </td>
                    <td className="p-4">
                      {dep.payment_receipt ? (
                         <button 
                           onClick={() => setSelectedImage(dep.payment_receipt)}
                           className="flex items-center gap-2 text-primary hover:text-white text-sm transition-colors"
                         >
                           <ImageIcon className="w-4 h-4" /> View Receipt
                         </button>
                      ) : <span className="text-slate-500 text-sm">No receipt</span>}
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "px-2.5 py-1 text-xs font-bold rounded-md inline-flex items-center gap-1",
                        dep.status === 'approved' ? "bg-emerald-500/20 text-emerald-400" :
                        dep.status === 'rejected' ? "bg-danger/20 text-danger" : "bg-amber-500/20 text-amber-500"
                      )}>
                        {dep.status === 'pending' && <Clock className="w-3 h-3" />}
                        {dep.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {dep.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {dep.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                       {dep.status === 'pending' && (
                         <>
                          <button onClick={() => handleUpdateDeposit(dep.id, 'approved')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleUpdateDeposit(dep.id, 'rejected')} className="px-3 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-bold rounded-lg transition-colors">
                            Reject
                          </button>
                         </>
                       )}
                    </td>
                  </tr>
                ))
              )
            ) : (
              kycdocs.filter(d => d.id.includes(searchQuery) || d.user_id.includes(searchQuery)).length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No KYC documents found.</td></tr>
              ) : (
                kycdocs.filter(d => d.id.includes(searchQuery) || d.user_id.includes(searchQuery)).map(kyc => (
                  <tr key={kyc.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-slate-400">{new Date(kyc.created_at).toLocaleString()}</td>
                    <td className="p-4 text-xs font-mono text-slate-500 max-w-[150px] truncate" title={kyc.user_id}>{kyc.user_id}</td>
                    <td className="p-4 text-slate-300">ID Verification</td>
                    <td className="p-4">
                      {kyc.document_url ? (
                         <button 
                           onClick={() => setSelectedImage(kyc.document_url)}
                           className="flex items-center gap-2 text-primary hover:text-white text-sm transition-colors"
                         >
                           <ImageIcon className="w-4 h-4" /> View ID
                         </button>
                      ) : <span className="text-slate-500 text-sm">No document</span>}
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "px-2.5 py-1 text-xs font-bold rounded-md inline-flex items-center gap-1",
                        kyc.status === 'approved' ? "bg-emerald-500/20 text-emerald-400" :
                        kyc.status === 'rejected' ? "bg-danger/20 text-danger" : "bg-amber-500/20 text-amber-500"
                      )}>
                        {kyc.status === 'pending' && <Clock className="w-3 h-3" />}
                        {kyc.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {kyc.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {kyc.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                       {kyc.status === 'pending' && (
                         <>
                          <button onClick={() => handleUpdateKYC(kyc.id, 'approved')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleUpdateKYC(kyc.id, 'rejected')} className="px-3 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-bold rounded-lg transition-colors">
                            Reject
                          </button>
                         </>
                       )}
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img src={selectedImage} alt="Document" className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10 bg-navy" />
          </div>
        </div>
      )}

    </div>
  );
}
