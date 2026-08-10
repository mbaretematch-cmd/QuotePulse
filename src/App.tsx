import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calculator, 
  LayoutDashboard, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Check, 
  ShieldCheck, 
  Briefcase,
  Layers3,
  Users,
  Target,
  Zap,
  Server,
  Database,
  Smartphone,
  Bell,
  Cpu,
  Cloud,
  Activity,
  Workflow,
  Globe,
  TrendingUp,
  Coins,
  BarChart3
} from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zrcdlgbcoswfuhfmmasg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vDUe8iihMX82M8yD9wXP2A_BvWZsYpB';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Quote {
  id: string;
  created_at: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_type: string;
  tier: string;
  scope_units: number;
  addons: string[];
  estimated_price: number;
  status: 'New' | 'Contacted' | 'Proposal Sent' | 'Won' | 'Lost';
}

type Currency = 'GBP' | 'USD' | 'EUR';

const CURRENCIES: Record<Currency, { symbol: string; rate: number; label: string }> = {
  GBP: { symbol: '£', rate: 1.0, label: 'GBP (£)' },
  USD: { symbol: '$', rate: 1.35, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 1.17, label: 'EUR (€)' }
};

const SERVICE_OPTIONS = [
  { id: 'clinic-setup', name: 'Clinical Flow System', icon: Target, basePrice: 450, unitLabel: 'Treatment Rooms', unitPrice: 75, desc: 'Setup optimization & patient throughput management for medical practices.' },
  { id: 'custom-booking', name: 'Queue & Engine Engine', icon: Users, basePrice: 350, unitLabel: 'Staff Members', unitPrice: 50, desc: 'Advanced multi-provider booking platform with logic-based queuing.' },
  { id: 'workflow-auto', name: 'Operations Automation', icon: Layers3, basePrice: 500, unitLabel: 'Active Workflows', unitPrice: 100, desc: 'Automating repetitive internal business processes & reporting.' },
];

const TIER_OPTIONS = [
  { id: 'standard', name: 'Standard Build', multiplier: 1.0, desc: 'Ready in ~5 business days' },
  { id: 'priority', name: 'Priority Express', multiplier: 1.3, desc: 'Launched in 48 hours' },
];

const ADDON_OPTIONS = [
  { id: 'sms-notifications', name: 'Twilio SMS Gateway Integration', price: 150 },
  { id: 'branding-custom', name: 'Custom Branding & UI White-labeling', price: 200 },
  { id: 'priority-support', name: '12 Months SLA Maintenance', price: 300 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'admin'>('calculator');
  const [currency, setCurrency] = useState<Currency>('GBP');
  
  // Calculator Form State
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [selectedTier, setSelectedTier] = useState(TIER_OPTIONS[0]);
  const [scopeUnits, setScopeUnits] = useState<number>(4);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['sms-notifications', 'priority-support']);
  
  // Lead Intake Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Admin Dashboard State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        setQuotes([]);
      } else {
        setQuotes(data);
      }
    } catch {
      setQuotes([]);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const currInfo = CURRENCIES[currency];

  const formatPrice = (gbpAmount: number) => {
    const converted = Math.round(gbpAmount * currInfo.rate);
    return `${currInfo.symbol}${converted.toLocaleString()}`;
  };

  const calculateTotal = () => {
    const base = selectedService.basePrice;
    const unitsCost = scopeUnits * selectedService.unitPrice;
    const addonsCost = selectedAddons.reduce((acc, addonId) => {
      const item = ADDON_OPTIONS.find(a => a.id === addonId);
      return acc + (item ? item.price : 0);
    }, 0);

    const subtotal = (base + unitsCost + addonsCost);
    return Math.round(subtotal * selectedTier.multiplier);
  };

  const handleAddonToggle = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newQuoteObj = {
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      service_type: selectedService.name,
      tier: selectedTier.name,
      scope_units: scopeUnits,
      addons: selectedAddons.map(id => ADDON_OPTIONS.find(a => a.id === id)?.name || id),
      estimated_price: calculateTotal(),
      status: 'New' as const
    };

    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert([newQuoteObj])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setQuotes(prev => [data[0], ...prev]);
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsModalOpen(false);
        setClientName('');
        setClientEmail('');
        setClientPhone('');
      }, 2000);
    }
  };

  const updateQuoteStatus = async (id: string, newStatus: Quote['status']) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    try {
      await supabase.from('quotes').update({ status: newStatus }).eq('id', id);
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const filteredQuotes = filterStatus === 'All' 
    ? quotes 
    : quotes.filter(q => q.status === filterStatus);

  const totalPipelineValue = quotes.reduce((acc, q) => acc + Number(q.estimated_price), 0);

  // System Topology Calculations (Extension #1)
  const hasSms = selectedAddons.includes('sms-notifications');
  const hasBranding = selectedAddons.includes('branding-custom');
  const hasSupport = selectedAddons.includes('priority-support');
  const totalActiveNodes = 3 + (hasSms ? 1 : 0) + (hasBranding ? 1 : 0) + (hasSupport ? 1 : 0);
  const estimatedRps = scopeUnits * 140;

  // Business ROI Calculations (Extension #2)
  const totalQuoteCostGBP = calculateTotal();
  const estimatedHoursSavedWeekly = Math.round(scopeUnits * 3.5) + (selectedService.id === 'workflow-auto' ? 8 : 4);
  const hourlyLaborCostGBP = 30; 
  const annualSavingsGBP = estimatedHoursSavedWeekly * 52 * hourlyLaborCostGBP;
  const paybackMonths = annualSavingsGBP > 0 ? (totalQuoteCostGBP / (annualSavingsGBP / 12)).toFixed(1) : '1.0';
  const processEfficiencyGain = Math.min(88, 30 + scopeUnits * 4);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Glow Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-950/30 rounded-full blur-[160px] opacity-70"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-950/20 rounded-full blur-[130px] opacity-60"></div>
      </div>

      {/* Modern SaaS Navigation */}
      <header className="sticky top-0 z-50 bg-[#07090e]/70 backdrop-blur-xl border-b border-white/[0.03]">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-10 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-500/10">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                QuotePulse
              </span>
              <span className="ml-2 text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                {currency} ({currInfo.symbol})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0e121a] p-1 rounded-full border border-white/[0.04]">
            {[
              { id: 'calculator', label: 'Agency Cost Calculator', icon: Calculator },
              { id: 'admin', label: 'Lampacho Lead Pipeline', icon: LayoutDashboard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                }`}
              >
                <tab.icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
             {/* EXTENSION #3: Multi-Currency Converter Switcher */}
             <div className="flex items-center gap-1 bg-[#0e121a] p-1 rounded-2xl border border-white/[0.04]">
                <Globe className="w-4 h-4 text-indigo-400 ml-2" />
                {(['GBP', 'USD', 'EUR'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                      currency === c 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : 'text-slate-400 hover:text-white hover:bg-[#121826]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
             </div>

             <div className="hidden md:flex items-center gap-3 pl-3 border-l border-white/[0.06]">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-white">Lampacho Creative</div>
                  <div className="text-[10px] text-emerald-400 font-bold">● Enterprise Verified</div>
                </div>
                <img src={`https://api.dicebear.com/8.x/initials/svg?seed=Stuart`} className="w-9 h-9 rounded-full border border-white/10" alt="Stuart" />
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1500px] mx-auto px-6 lg:px-10 py-10">
        {activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,460px] gap-12 items-start">
            
            {/* Left: Configurator Journey */}
            <div className="space-y-10">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 text-indigo-400 mb-2">
                   <Zap className="w-5 h-5" />
                   <span className="font-semibold tracking-wide uppercase text-sm">Automated Scope Estimator v2.0</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-white leading-[0.95]">
                  Instant Lampacho <span className="text-indigo-400">Creative</span> Quote
                </h1>
                <p className="text-lg text-slate-400 mt-4 leading-relaxed">
                  Design your ideal system architecture below. Receive an immediate, fixed-price breakdown—no generic spreadsheets, no hidden setup fees.
                </p>
              </div>

              {/* 1. System Cards */}
              <div className="border border-white/[0.04] bg-[#0c1018] rounded-3xl p-8 shadow-inner-dark">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-3 mb-6">
                  <Briefcase className="h-5 w-5 text-indigo-500" /> Stage 1: Define Your Core System Architecture
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {SERVICE_OPTIONS.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selectedService.id === service.id;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`group p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden text-left ${
                          isSelected
                            ? 'border-indigo-600 bg-gradient-to-b from-indigo-950/50 to-transparent text-white ring-2 ring-indigo-500/50 shadow-2xl'
                            : 'border-white/[0.04] bg-[#0e121a]/50 text-slate-300 hover:border-indigo-800/40 hover:bg-[#121826]'
                        }`}
                      >
                        {isSelected && (
                           <div className="absolute top-[-5px] right-[-5px] w-12 h-12 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-bl-3xl flex items-center justify-center text-white shadow-xl">
                             <Check className="w-6 h-6 stroke-[3]" />
                           </div>
                        )}
                        <div className={`p-3 rounded-xl inline-block mb-5 border transition-colors ${
                          isSelected ? 'bg-indigo-600/30 border-indigo-500' : 'bg-[#151b29] border-white/[0.03] group-hover:border-indigo-900 group-hover:bg-indigo-950/20'
                        }`}>
                          <Icon className={`h-7 w-7 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300'}`} />
                        </div>
                        <h3 className="font-extrabold text-lg tracking-tight mb-1">{service.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{service.desc}</p>
                        <div className={`text-xs p-3 rounded-lg border transition-colors ${isSelected ? 'bg-indigo-900/30 border-indigo-700' : 'bg-[#121826] border-white/[0.03]'}`}>
                          <span className="font-bold text-white">Setup {formatPrice(service.basePrice)}</span>
                          <span className="text-slate-500 mx-1">•</span>
                          <span className="text-slate-400">+{formatPrice(service.unitPrice)}/{service.unitLabel.slice(0, -1)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Slider and Addons Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scope Slider */}
                <div className="border border-white/[0.04] bg-[#0c1018] rounded-3xl p-8 shadow-inner-dark">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/[0.03]">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-500" /> Stage 2: Establish Operational Scale
                    </label>
                    <span className="text-sm font-black text-indigo-100 bg-indigo-600 border border-indigo-500 px-4 py-1.5 rounded-full shadow-lg">
                      {scopeUnits} {selectedService.unitLabel}
                    </span>
                  </div>
                  <div className="px-1 relative">
                      <div className="absolute inset-x-1 top-3 h-2.5 bg-[#121826] rounded-full border border-white/[0.03]"></div>
                      <div className="absolute left-1 top-3 h-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full border border-indigo-500" style={{ width: `${((scopeUnits - 1) / (15 - 1)) * 100}%` }}></div>
                      
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={scopeUnits}
                        onChange={(e) => setScopeUnits(parseInt(e.target.value))}
                        className="relative w-full h-8 bg-transparent appearance-none cursor-pointer accent-white opacity-0"
                      />
                      <div className="absolute top-[7px] w-7 h-7 bg-white rounded-full shadow-2xl pointer-events-none border-4 border-indigo-600 flex items-center justify-center transform -translate-x-1/2" style={{ left: `calc( ${((scopeUnits - 1) / (15 - 1)) * 100}% )` }}>
                        <Zap className="w-3.5 h-3.5 text-indigo-700" />
                      </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-2 font-medium">
                    <span>Minimal Startup (1 {selectedService.unitLabel.slice(0, -1)})</span>
                    <span>Growth Business (15 {selectedService.unitLabel})</span>
                  </div>
                </div>

                {/* Integration Addons */}
                <div className="border border-white/[0.04] bg-[#0c1018] rounded-3xl p-8 shadow-inner-dark">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-3 mb-6">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" /> Stage 3: Premium Integrations
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {ADDON_OPTIONS.map((addon) => {
                      const isChecked = selectedAddons.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleAddonToggle(addon.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                            isChecked
                              ? 'border-indigo-600/60 bg-indigo-950/20 text-white'
                              : 'border-white/[0.03] bg-[#0e121a]/50 text-slate-400 hover:border-indigo-800 hover:bg-[#121826]'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10 bg-[#151b29] group-hover:border-indigo-700'
                            }`}>
                              {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-sm font-medium ${isChecked ? 'text-indigo-50' : 'text-slate-300'}`}>{addon.name}</span>
                          </div>
                          <span className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-indigo-400'}`}>+{formatPrice(addon.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* EXTENSION #1: Live Interactive System Blueprint Visualizer */}
              <div className="border border-indigo-900/40 bg-gradient-to-br from-[#0c1018] via-[#090d15] to-[#0c1018] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Visualizer Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.04]">
                  <div>
                    <div className="flex items-center gap-2.5 text-indigo-400 mb-1">
                      <Workflow className="w-5 h-5" />
                      <span className="font-extrabold uppercase text-xs tracking-wider">Dynamic Topology Engine</span>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      Live Architecture Blueprint Map
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {totalActiveNodes} Connected Nodes
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
                      <Activity className="w-3.5 h-3.5" />
                      ~{estimatedRps.toLocaleString()} req/s
                    </span>
                  </div>
                </div>

                {/* Topology Network Visualizer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch relative">
                  
                  {/* Node 1: Client Gateway */}
                  <div className="bg-[#121826] border border-white/[0.06] rounded-2xl p-5 relative group hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400 border border-indigo-500/30">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Node 01</span>
                      </div>
                      <div className="text-sm font-extrabold text-white">Client Web Portal</div>
                      <div className="text-xs text-slate-400 mt-1">React 19 + Tailwind UI</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Design Tier</span>
                      <span className={`font-bold ${hasBranding ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {hasBranding ? 'White-Labeled' : 'Standard UI'}
                      </span>
                    </div>
                  </div>

                  {/* Node 2: Core Processing Engine */}
                  <div className="bg-gradient-to-b from-indigo-950/40 to-[#121826] border border-indigo-500/40 rounded-2xl p-5 relative group shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
                          <Server className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Core Engine</span>
                      </div>
                      <div className="text-sm font-extrabold text-white">{selectedService.name}</div>
                      <div className="text-xs text-indigo-300 mt-1 font-mono">
                        {scopeUnits} {selectedService.unitLabel}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Compute Cluster</span>
                      <span className="font-bold text-emerald-400 font-mono">{scopeUnits * 2} Worker Threads</span>
                    </div>
                  </div>

                  {/* Node 3: Addon Modules Gateway */}
                  <div className="bg-[#121826] border border-white/[0.06] rounded-2xl p-5 relative group hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400 border border-amber-500/30">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Node 03</span>
                      </div>
                      <div className="text-sm font-extrabold text-white">Integration Layer</div>
                      
                      <div className="mt-2 space-y-1.5">
                        <div className={`text-[11px] flex items-center gap-1.5 ${hasSms ? 'text-amber-300 font-bold' : 'text-slate-600'}`}>
                          <Bell className="w-3 h-3" /> Twilio Gateway {hasSms ? '✓' : '(Disabled)'}
                        </div>
                        <div className={`text-[11px] flex items-center gap-1.5 ${hasSupport ? 'text-emerald-300 font-bold' : 'text-slate-600'}`}>
                          <ShieldCheck className="w-3 h-3" /> 24/7 SLA Watch {hasSupport ? '✓' : '(Disabled)'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Ext. Adapters</span>
                      <span className="font-bold text-white font-mono">{selectedAddons.length} Active</span>
                    </div>
                  </div>

                  {/* Node 4: Database Infrastructure */}
                  <div className="bg-[#121826] border border-white/[0.06] rounded-2xl p-5 relative group hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 border border-emerald-500/30">
                          <Database className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Node 04</span>
                      </div>
                      <div className="text-sm font-extrabold text-white">Supabase Cloud</div>
                      <div className="text-xs text-slate-400 mt-1">PostgreSQL + RLS Security</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Sprint Mode</span>
                      <span className="font-bold text-indigo-400">{selectedTier.name}</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Technical Spec Banner */}
                <div className="mt-6 p-4 rounded-2xl bg-[#0e121a] border border-white/[0.03] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-indigo-400" />
                    <span>Auto-Scaling Cloud Hosting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>Global Edge CDN Deployment</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-slate-300">
                    <span className="text-emerald-400 font-bold">99.9% Uptime Guarantee</span>
                  </div>
                </div>
              </div>

              {/* EXTENSION #2: Business ROI & Cost-Savings Estimator */}
              <div className="border border-emerald-900/40 bg-gradient-to-br from-[#0c1018] via-[#090d15] to-[#0c1018] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* ROI Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.04]">
                  <div>
                    <div className="flex items-center gap-2.5 text-emerald-400 mb-1">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-extrabold uppercase text-xs tracking-wider">Financial Impact Analysis</span>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      Business ROI & Savings Forecast
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    +{processEfficiencyGain}% Efficiency Boost
                  </span>
                </div>

                {/* ROI Metric Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Metric 1: Hours Saved */}
                  <div className="bg-[#121826] border border-white/[0.06] rounded-2xl p-6 relative group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/30">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Time Recovery</span>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight">
                      ~{estimatedHoursSavedWeekly} <span className="text-base font-bold text-slate-400">hrs/wk</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Manual data entry & status calls eliminated across {scopeUnits} {selectedService.unitLabel.toLowerCase()}.
                    </div>
                  </div>

                  {/* Metric 2: Annual Cost Savings */}
                  <div className="bg-gradient-to-b from-emerald-950/30 to-[#121826] border border-emerald-500/40 rounded-2xl p-6 relative group shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-600/30">
                        <Coins className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Annual Return ({currency})</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight">
                      {formatPrice(annualSavingsGBP)}
                    </div>
                    <div className="text-xs text-emerald-200/70 mt-2 leading-relaxed">
                      Estimated yearly operational cost savings at baseline baseline rates.
                    </div>
                  </div>

                  {/* Metric 3: Payback Horizon */}
                  <div className="bg-[#121826] border border-white/[0.06] rounded-2xl p-6 relative group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/30">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capital Recovery</span>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight">
                      {paybackMonths} <span className="text-base font-bold text-indigo-400">Months</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Full setup cost recovered through automated labor savings.
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. Timeline Choice */}
              <div className="border border-white/[0.04] bg-[#0c1018] rounded-3xl p-8 shadow-inner-dark mb-10">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-3 mb-6">
                  <Clock className="h-5 w-5 text-indigo-500" /> Stage 4: Launch & Deployment Sprint
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TIER_OPTIONS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`text-left p-5 rounded-2xl border transition-all relative ${
                        selectedTier.id === tier.id
                          ? 'border-indigo-600 bg-indigo-950/40 text-white shadow-2xl'
                          : 'border-white/[0.03] bg-[#0e121a]/50 text-slate-400 hover:border-indigo-800'
                      }`}
                    >
                       {selectedTier.id === tier.id && (
                          <div className="absolute top-[-4px] right-[-4px] w-10 h-10 bg-indigo-600 rounded-bl-2xl flex items-center justify-center text-white shadow-xl">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                       )}
                      <div className="font-extrabold text-lg tracking-tight mb-0.5">{tier.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Sticky Premium Summary Snapshot */}
            <div className="sticky top-32 z-30">
              <div className="bg-[#0c1018] border-2 border-indigo-800/40 rounded-3xl p-8 shadow-2xl shadow-indigo-950/30 space-y-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full blur-[70px] opacity-20"></div>
                
                <div className="border-b border-white/[0.04] pb-6 relative z-10">
                  <div className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Agency Price Snapshot</div>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-6xl font-black text-white tracking-tighter">
                      {formatPrice(calculateTotal())}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 bg-[#121826] px-3 py-1 rounded-full border border-white/5">
                      {currency}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2">Guaranteed setup cost (excluding mandatory VAT). 30-day price lock.</div>
                </div>

                <div className="space-y-4 text-sm relative z-10">
                  <div className="flex justify-between items-center text-slate-300">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-600"/> Base Build ({selectedService.name})
                    </div>
                    <span className="font-bold text-white">{formatPrice(selectedService.basePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4 text-slate-600" /> Setup for {scopeUnits} {selectedService.unitLabel}
                    </div>
                    <span className="font-bold text-white">{formatPrice(scopeUnits * selectedService.unitPrice)}</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between items-center text-slate-300">
                      <div className="flex items-center gap-2">
                         <ShieldCheck className="w-4 h-4 text-slate-600" /> Premium Integrations ({selectedAddons.length})
                      </div>
                      <span className="font-bold text-white">
                        +{formatPrice(selectedAddons.reduce((a, id) => a + (ADDON_OPTIONS.find(o => o.id === id)?.price || 0), 0))}
                      </span>
                    </div>
                  )}
                  {selectedTier.multiplier > 1 && (
                    <div className="flex justify-between text-amber-300 text-xs font-bold pt-2 border-t border-white/[0.04]">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Express Launch Surcharge</div>
                      <span>+30% Delivery Fee</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/[0.04] relative z-10">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2.5 group active:scale-[0.98]"
                  >
                    Generate Final Proposal
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                  </button>
                  <p className="text-center text-xs text-slate-600 mt-4 font-medium">Instantly receive a comprehensive PDF contract request.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* High-End Agency Admin Dashboard */
          <div className="space-y-10">
            <div className="max-w-3xl">
                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                   <LayoutDashboard className="w-5 h-5" />
                   <span className="font-semibold tracking-wide uppercase text-sm">Lampacho CRM Database v1.4</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-white leading-[0.95]">
                  Active <span className="text-emerald-400">Prospect</span> Pipeline
                </h1>
                <p className="text-lg text-slate-400 mt-4 leading-relaxed">
                  Analyze high-value incoming inquiries generated via the QuotePulse estimator. Track project value, client commitment, and manage outreach workflow.
                </p>
            </div>

            {/* Modern Metrics Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { title: 'Total Opportunities', value: quotes.length, color: 'white' },
                { title: 'Pipeline Forecast', value: formatPrice(totalPipelineValue), color: 'indigo-400' },
                { title: 'Avg Opportunity Size', value: formatPrice(quotes.length ? Math.round(totalPipelineValue / quotes.length) : 0), color: 'emerald-400' }
              ].map(metric => (
                  <div key={metric.title} className="bg-[#0c1018] border border-white/[0.04] rounded-3xl p-6 shadow-inner-dark relative overflow-hidden">
                      <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-xl opacity-20"></div>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{metric.title}</span>
                      <div className={`text-4xl font-black text-${metric.color} mt-3 tracking-tighter`}>{metric.value}</div>
                  </div>
              ))}
            </div>

            {/* Filter segmented control */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 p-1.5 bg-[#0e121a] rounded-full border border-white/[0.04] max-w-2xl">
              {['All', 'New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs font-bold px-5 py-2.5 rounded-full border transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-[#151b29] border-white/5 text-white shadow-xl'
                      : 'border-transparent text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Pipeline Table */}
            <div className="bg-[#0c1018] border border-white/[0.04] rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
              {loadingQuotes ? (
                <div className="p-16 text-center text-slate-500 font-medium">Accessing agency database pipeline...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-medium">No leads match the active filter criteria. Submit a test quote!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/[0.03] bg-[#0e121a] text-slate-500 text-xs font-extrabold uppercase tracking-widest">
                        <th className="p-5">Client Prospect</th>
                        <th className="p-5">Project Scope</th>
                        <th className="p-5">Value ({currency})</th>
                        <th className="p-5">Current Status</th>
                        <th className="p-5">Pipeline Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02] text-sm font-medium">
                      {filteredQuotes.map((q) => (
                        <tr key={q.id} className="hover:bg-[#121826]/30 transition-colors">
                          <td className="p-5">
                            <div className="font-extrabold text-white text-base tracking-tight">{q.client_name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2.5 mt-1 font-mono">
                              <span>{q.client_email}</span>
                              {q.client_phone && <span>• {q.client_phone}</span>}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="text-slate-100">{q.service_type}</div>
                            <div className="text-xs text-slate-500">{q.tier} / {q.scope_units} Units</div>
                          </td>
                          <td className="p-5 font-black text-white text-base tracking-tight">
                            {formatPrice(Number(q.estimated_price))}
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              q.status === 'New' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                              q.status === 'Contacted' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                              q.status === 'Won' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                 q.status === 'New' ? 'bg-indigo-400' :
                                 q.status === 'Contacted' ? 'bg-amber-400' :
                                 q.status === 'Won' ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}></span>
                              {q.status}
                            </span>
                          </td>
                          <td className="p-5">
                            <select
                              value={q.status}
                              onChange={(e) => updateQuoteStatus(q.id, e.target.value as Quote['status'])}
                              className="bg-[#121826] border border-white/5 text-xs text-slate-300 rounded-xl p-2.5 font-bold focus:border-indigo-500 outline-none hover:border-white/10"
                            >
                              <option value="New">Set to: New Inquiry</option>
                              <option value="Contacted">Set to: Initial Outreach</option>
                              <option value="Proposal Sent">Set to: Proposal Delivered</option>
                              <option value="Won">Set to: Closed (Won)</option>
                              <option value="Lost">Set to: Closed (Lost)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modern Intake Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0c1018] border border-white/[0.04] rounded-3xl p-10 max-w-lg w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-[-10px] left-[-10px] w-32 h-32 bg-gradient-to-br from-indigo-500/30 to-transparent rounded-full blur-2xl opacity-40"></div>
             
            {submitSuccess ? (
              <div className="text-center py-10 space-y-6 relative z-10">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 stroke-[3]" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter">Inquiry Registered!</h3>
                <p className="text-slate-400 leading-relaxed">
                  Your guaranteed Lampacho Creative estimate for <strong className="text-white text-lg font-bold">{formatPrice(calculateTotal())}</strong> has been captured. Our team will generate your comprehensive PDF contract proposal shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-6 relative z-10">
                <div>
                   <div className="flex items-center gap-2.5 text-indigo-400 mb-2">
                     <Calculator className="w-5 h-5"/>
                     <span className="font-semibold uppercase text-xs tracking-wide">Finalize Intake</span>
                   </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter">Contract Proposal Request</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Submit contact details to register this {formatPrice(calculateTotal())} setup fee. A full specifications contract will be delivered to the email address provided.
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">Primary Contact Name</label>
                    <div className="relative">
                      <User className="h-5 w-5 absolute left-4 top-3.5 text-slate-600" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. John Vance"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-[#121826] border border-white/[0.04] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">Business Email Address</label>
                    <div className="relative">
                      <Mail className="h-5 w-5 absolute left-4 top-3.5 text-slate-600" />
                      <input
                        type="email"
                        required
                        placeholder="email@organization.co.uk"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-[#121826] border border-white/[0.04] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">Phone (Optional Direct Line)</label>
                    <div className="relative">
                      <Phone className="h-5 w-5 absolute left-4 top-3.5 text-slate-600" />
                      <input
                        type="tel"
                        placeholder="+44 20 7946 0912"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-[#121826] border border-white/[0.04] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 bg-[#121826] hover:bg-[#182033] border border-white/5 text-slate-300 text-sm font-bold py-3.5 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-black py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Registering Inquiry...' : 'Submit Spec Sheet'}
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}