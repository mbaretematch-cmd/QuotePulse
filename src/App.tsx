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
  Filter, 
  Check, 
  ShieldCheck, 
  Briefcase
} from 'lucide-react';

// Initialize Supabase Client using Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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

const SERVICE_OPTIONS = [
  { id: 'clinic-setup', name: 'Medical/Clinic Patient Flow System', basePrice: 450, unitLabel: 'Treatment Rooms', unitPrice: 75 },
  { id: 'custom-booking', name: 'Custom Appointment & Queue Engine', basePrice: 350, unitLabel: 'Staff Members', unitPrice: 50 },
  { id: 'workflow-auto', name: 'Operations & Workflow Automation', basePrice: 500, unitLabel: 'Active Workflows', unitPrice: 100 },
];

const TIER_OPTIONS = [
  { id: 'standard', name: 'Standard Delivery', multiplier: 1.0, desc: 'Ready in 5 business days' },
  { id: 'priority', name: 'Priority Express', multiplier: 1.3, desc: 'Ready in 48 hours' },
];

const ADDON_OPTIONS = [
  { id: 'sms-notifications', name: 'Twilio Automated SMS Notifications', price: 150 },
  { id: 'branding-custom', name: 'Custom Branding & White-labeling', price: 200 },
  { id: 'priority-support', name: '12 Months SLA Support & Maintenance', price: 300 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'admin'>('calculator');
  
  // Calculator Form State
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [selectedTier, setSelectedTier] = useState(TIER_OPTIONS[0]);
  const [scopeUnits, setScopeUnits] = useState<number>(3);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['sms-notifications']);
  
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

  // Fallback data for local presentation testing
  const mockQuotes: Quote[] = [
    {
      id: '1',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      client_name: 'Dr. Alistair Vance',
      client_email: 'a.vance@harleystreetclinic.co.uk',
      client_phone: '+44 20 7946 0912',
      service_type: 'Medical/Clinic Patient Flow System',
      tier: 'Priority Express',
      scope_units: 4,
      addons: ['Twilio Automated SMS Notifications', 'Custom Branding & White-labeling'],
      estimated_price: 1180,
      status: 'New'
    },
    {
      id: '2',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      client_name: 'Sarah Jenkins',
      client_email: 'sarah@apexbarbers.co.uk',
      client_phone: '+44 161 496 0123',
      service_type: 'Custom Appointment & Queue Engine',
      tier: 'Standard Delivery',
      scope_units: 6,
      addons: ['Custom Branding & White-labeling'],
      estimated_price: 850,
      status: 'Contacted'
    }
  ];

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

      if (error || !data || data.length === 0) {
        setQuotes(mockQuotes);
      } else {
        setQuotes(data);
      }
    } catch {
      setQuotes(mockQuotes);
    } finally {
      setLoadingQuotes(false);
    }
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
    } catch {
      const localQuote: Quote = {
        ...newQuoteObj,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      setQuotes(prev => [localQuote, ...prev]);
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
    } catch {
      // Retain local state fallback
    }
  };

  const seedDemoQuotes = () => {
    setQuotes(mockQuotes);
  };

  const filteredQuotes = filterStatus === 'All' 
    ? quotes 
    : quotes.filter(q => q.status === filterStatus);

  const totalPipelineValue = quotes.reduce((acc, q) => acc + Number(q.estimated_price), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                QuotePulse
              </span>
              <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                UK Edition (£)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calculator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calculator className="h-4 w-4" />
              Client Estimator
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Lead Pipeline
              {quotes.length > 0 && (
                <span className="ml-1 bg-indigo-500/30 text-indigo-300 text-xs px-2 py-0.5 rounded-full font-bold">
                  {quotes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Estimator Configurator */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Instant Project Quote Estimator
                </h1>
                <p className="text-slate-400 mt-2 text-base">
                  Configure your business requirements below for an instant breakdown and fixed proposal cost.
                </p>
              </div>

              {/* Service Selection */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-4">
                  <Briefcase className="h-4 w-4" /> 1. Select Primary System Architecture
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {SERVICE_OPTIONS.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                        selectedService.id === service.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-base">{service.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Base Architecture: £{service.basePrice} + £{service.unitPrice} per {service.unitLabel.toLowerCase().slice(0, -1)}
                        </div>
                      </div>
                      {selectedService.id === service.id && (
                        <div className="bg-indigo-500 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Slider */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> 2. Scale & Operational Scope
                  </label>
                  <span className="text-sm font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">
                    {scopeUnits} {selectedService.unitLabel}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={scopeUnits}
                  onChange={(e) => setScopeUnits(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1 {selectedService.unitLabel.slice(0, -1)}</span>
                  <span>15 {selectedService.unitLabel}</span>
                </div>
              </div>

              {/* Addons */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-4 w-4" /> 3. Optional Module Integrations
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {ADDON_OPTIONS.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => handleAddonToggle(addon.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isChecked && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-sm font-medium">{addon.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-300">+£{addon.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" /> 4. Delivery & Deployment Timeline
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TIER_OPTIONS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selectedTier.id === tier.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-sm">{tier.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Sticky Summary Card */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Cost Summary</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-white">£{calculateTotal().toLocaleString()}</span>
                    <span className="text-sm text-slate-400">GBP (excl. VAT)</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Architecture ({selectedService.name})</span>
                    <span className="font-semibold">£{selectedService.basePrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>{scopeUnits} × {selectedService.unitLabel}</span>
                    <span className="font-semibold">£{scopeUnits * selectedService.unitPrice}</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Module Integrations ({selectedAddons.length})</span>
                      <span className="font-semibold">
                        +£{selectedAddons.reduce((a, id) => a + (ADDON_OPTIONS.find(o => o.id === id)?.price || 0), 0)}
                      </span>
                    </div>
                  )}
                  {selectedTier.multiplier > 1 && (
                    <div className="flex justify-between text-amber-400 text-xs font-semibold pt-1 border-t border-slate-800">
                      <span>Express Delivery Speed</span>
                      <span>+30%</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
                  >
                    Lock In Quote & Request Proposal
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Admin Lead Pipeline */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Lead Intake & Quote Pipeline
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Track incoming business quotes, review client project specs, and update conversion status.
                </p>
              </div>
              <button
                onClick={seedDemoQuotes}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                Seed Demo Lead Data
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Leads</span>
                <div className="text-3xl font-black text-white mt-2">{quotes.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Forecast</span>
                <div className="text-3xl font-black text-indigo-400 mt-2">£{totalPipelineValue.toLocaleString()}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Deal Size</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  £{quotes.length ? Math.round(totalPipelineValue / quotes.length).toLocaleString() : 0}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>
              {['All', 'New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    filterStatus === status
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Pipeline Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {loadingQuotes ? (
                <div className="p-12 text-center text-slate-500">Loading lead database...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No quotes match the selected filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Client Contact</th>
                        <th className="p-4">Requested System</th>
                        <th className="p-4">Est. Value</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filteredQuotes.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-white">{q.client_name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{q.client_email}</span>
                              {q.client_phone && <span>• {q.client_phone}</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-200 font-medium">{q.service_type}</div>
                            <div className="text-xs text-slate-500">{q.tier} ({q.scope_units} units)</div>
                          </td>
                          <td className="p-4 font-bold text-white">
                            £{Number(q.estimated_price).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                              q.status === 'New' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                              q.status === 'Contacted' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                              q.status === 'Won' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={q.status}
                              onChange={(e) => updateQuoteStatus(q.id, e.target.value as Quote['status'])}
                              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 font-medium focus:border-indigo-500 outline-none"
                            >
                              <option value="New">Mark New</option>
                              <option value="Contacted">Mark Contacted</option>
                              <option value="Proposal Sent">Mark Proposal Sent</option>
                              <option value="Won">Mark Won</option>
                              <option value="Lost">Mark Lost</option>
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

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            {submitSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Proposal Request Logged!</h3>
                <p className="text-slate-400 text-sm">
                  Your quote for <strong className="text-white">£{calculateTotal().toLocaleString()}</strong> has been captured into the pipeline.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Submit Quote Request</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter details to lock in your £{calculateTotal().toLocaleString()} estimate for 30 days.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. John Smith"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Business Email</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="john@clinic.co.uk"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="+44 20 7946 0912"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
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