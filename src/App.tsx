/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  UserCircle, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  Target,
  ChevronRight,
  Loader2,
  Sparkles,
  Lightbulb,
  MapPin,
  CreditCard,
  MessageSquare,
  X,
  Home,
  History as HistoryIcon,
  Share2,
  RefreshCw,
  Heart,
  Wallet,
  Check,
  Calculator,
  ChevronDown,
  ArrowLeftRight,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFinancialGuidance, getDefaultDecisionResult, DecisionResult } from './services/geminiService';

// --- Types ---
type Priority = 'comfortable' | 'flexible' | 'ahead';

interface FinancialData {
  item: string;
  category: string;
  cost: number | null;
  priority: Priority | '';
  intent?: string;
  urgency?: string;
  paymentMethod?: 'onetime' | 'emi' | null;
  emiType?: 'nocost' | 'regular' | null;
  emiMonths?: number | null;
  emiAmount?: number | null;
  downPayment?: number | null;
  income: number | null;
  expenses: number | null;
  emi?: number | null;
  otherExpenses: number | null;
  location: string;
  lifestyle: string;
}

interface HistoryItem {
  id: string;
  data: FinancialData;
  guidance: DecisionResult;
  timestamp: number;
}

interface FollowUpReminder {
  id: string;
  item: string;
  cost: number;
  timestamp: number;
  responded: boolean;
  outcome?: 'Absolutely' | 'Mixed feelings' | 'Regret it';
}

// --- Components ---

const MobileContainer = ({ 
  children, 
  gradientClass, 
  onBack, 
  activeTab, 
  onTabChange, 
  currentScreen 
}: { 
  children: React.ReactNode; 
  gradientClass?: string; 
  onBack?: () => void; 
  activeTab?: string; 
  onTabChange?: (tab: string) => void; 
  currentScreen?: number;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isDarkScreen = false;

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab, currentScreen]);

  return (
    <div className={`relative w-full max-w-[450px] mx-auto h-[100dvh] sm:h-[850px] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl sm:my-8 border border-gray-100 transition-all duration-700 ${isDarkScreen ? 'bg-[#090A0F] border-white/10' : 'bg-white'}`}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 z-0 transition-all duration-700 ${gradientClass}`}></div>

      {/* Header — Clean with back button only, no profile icon */}
      {currentScreen !== 0 && (
        <div className={`relative z-10 px-8 pt-8 pb-4 flex items-center transition-colors duration-500 ${isDarkScreen ? 'text-white' : ''}`}>
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className={`p-2 rounded-full transition-colors ${isDarkScreen ? 'text-white hover:bg-white/10' : 'hover:bg-black/5 text-[#1A1A1A]'}`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <span className={`font-black text-xl tracking-tight transition-colors ${isDarkScreen ? 'text-white' : 'text-[#003B3B]'}`}>
              Sukoon
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        ref={contentRef}
        className={`relative z-10 flex-1 overflow-y-auto px-8 ${currentScreen === 0 ? 'pb-8 pt-4 flex flex-col justify-center min-h-full' : 'pb-28 pt-2'} scrollbar-none transition-colors duration-500 ${isDarkScreen ? 'text-white' : ''}`}
      >
        {children}
      </div>

      {/* Bottom Navigation (Only visible on Screen 1 onwards and History) */}
      {currentScreen !== 0 && (
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-white/90 backdrop-blur-md rounded-full border border-gray-100 shadow-xl z-30 flex items-center justify-around px-4">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'history', icon: HistoryIcon, label: 'History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex flex-col items-center justify-center transition-all ${
                  activeTab === tab.id ? 'text-[#1A1A1A] scale-110' : 'text-gray-400'
                }`}
              >
                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                <span className="text-[8px] font-bold uppercase tracking-widest mt-1">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="nav-dot" className="w-1 h-1 bg-[#1A1A1A] rounded-full mt-1" />
                )}
              </button>
            ))}
          </div>

          {/* Home Indicator Mock */}
          <div className="h-3 flex justify-center items-center z-20 pb-1">
            <div className="w-24 h-1 bg-black/5 rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
};

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A] leading-snug">{children}</h1>
    {subtitle && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>}
  </div>
);

const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false, 
  className = "" 
}: { 
  children: React.ReactNode, 
  onClick: () => void, 
  disabled?: boolean, 
  loading?: boolean, 
  className?: string 
}) => (
  <button
    disabled={disabled || loading}
    onClick={onClick}
    className={`w-full py-4 px-6 bg-[#1A1A1A] text-white rounded-[2rem] font-bold text-sm tracking-wide shadow-lg shadow-black/10 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 ${className}`}
  >
    {loading ? (
      <>
        <Loader2 className="animate-spin" size={18} />
        <span>Analyzing with Sukoon...</span>
      </>
    ) : children}
  </button>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", prefix }: any) => (
  <div className="mb-4">
    <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-4 text-sm font-semibold text-gray-500 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-8 pr-5' : 'px-5'} py-3.5 bg-white border border-[#E5E5E5] rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all font-medium text-[#1A1A1A]`}
      />
    </div>
  </div>
);

// Indian Currency Formatter helper for compact chips
const formatCompactIndian = (num: number | null): string => {
  if (num === null || isNaN(num) || num === 0) return "₹0";
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `₹${lk % 1 === 0 ? lk : lk.toFixed(1)} Lakh`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

const valueToSliderPos = (val: number | null, min: number, max: number): number => {
  if (val === null || val <= min) return 0;
  if (val >= max) return 100;
  const ratio = (val - min) / (max - min);
  return Math.pow(ratio, 0.45) * 100;
};

const sliderPosToValue = (pos: number, min: number, max: number): number => {
  if (pos <= 0) return min;
  if (pos >= 100) return max;
  const ratio = Math.pow(pos / 100, 1 / 0.45);
  const raw = min + ratio * (max - min);
  if (raw >= 10000000) return Math.round(raw / 100000) * 100000;
  if (raw >= 100000) return Math.round(raw / 10000) * 10000;
  if (raw >= 10000) return Math.round(raw / 1000) * 1000;
  if (raw >= 1000) return Math.round(raw / 100) * 100;
  return Math.round(raw);
};

const SliderInput = ({ label, value, onChange, min = 0, max = 20000000, prefix = "₹" }: any) => {
  const sliderPos = valueToSliderPos(value, min, max);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = Number(e.target.value);
    const calculatedVal = sliderPosToValue(pos, min, max);
    onChange(calculatedVal);
  };

  const handleTypeIn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
    } else {
      const num = Number(raw.replace(/[^0-9]/g, ''));
      onChange(isNaN(num) ? null : num);
    }
  };

  const compactBadge = formatCompactIndian(value);

  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-center mb-1.5 gap-2">
        <label className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider truncate">{label}</label>
        <div className="flex items-center gap-1.5 shrink-0">
          {value !== null && value >= 10000 && (
            <span className="text-[10px] font-bold text-[#15803d] bg-green-50 px-2 py-0.5 rounded-md border border-green-200/50 whitespace-nowrap">
              {compactBadge}
            </span>
          )}
          <div className="relative w-32">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px] font-medium">{prefix}</span>
            <input 
              type="number"
              value={value === null ? '' : value}
              onChange={handleTypeIn}
              placeholder="0"
              className="w-full pl-6 pr-2 py-1 bg-white border border-[#E5E5E5] rounded-lg text-xs font-bold text-right text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            />
          </div>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={sliderPos}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#1A1A1A]"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
        <span>{prefix}{min.toLocaleString('en-IN')}</span>
        <span>{prefix}{max >= 10000000 ? `${(max / 10000000).toFixed(0)} Cr` : `${(max / 100000).toFixed(0)}L`}</span>
      </div>
    </div>
  );
};

// --- Screen 0: Welcome Screen ---
const WelcomeScreen = ({ onNext }: { onNext: () => void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center min-h-full text-center relative px-2 pt-2 pb-0"
  >
    {/* Prominent Hero Logo */}
    <div className="mb-6 relative flex items-center justify-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-40 h-40 relative z-10 flex items-center justify-center"
      >
        <img 
          src="/assets/aistudio/Sukoon_Branding_Variations_Sheet_29bf22a6.png" 
          alt="Sukoon Logo" 
          className="w-full h-full object-contain drop-shadow-2xl"
        />
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-teal-500/20 rounded-full blur-3xl -z-0 pointer-events-none"
      />
    </div>

    {/* Title in Deep Teal #003B3B */}
    <motion.h1 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-[44px] sm:text-[48px] font-bold text-[#003B3B] leading-tight mb-2 tracking-tight text-center"
    >
      Sukoon
    </motion.h1>
    
    {/* Darkened, Legible Subtitle */}
    <motion.p 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-[12px] sm:text-[13px] text-gray-700 font-bold tracking-[0.14em] uppercase mb-5 text-center"
    >
      Financial Decision Guidance
    </motion.p>

    {/* Smart & Secure Info Card & Action Button */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full space-y-4 flex flex-col items-center"
    >
      {/* Centered Info Card with Green Shield, Light Green Tint & Refined Hierarchy */}
      <div className="w-full max-w-sm mx-auto p-6 sm:p-8 bg-green-50/80 rounded-3xl border border-green-200/60 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center gap-2 mb-3">
          <ShieldCheck size={26} className="text-[#15803d]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#1A1A1A]">
            Smart & Secure
          </span>
        </div>
        <p className="text-[13px] text-gray-600 font-normal leading-relaxed text-center">
          Make confident purchase decisions with AI-powered insights tailored to your unique financial situation.
        </p>
      </div>

      {/* Tactile Motion Action Button: "Check a Decision" in Branded Green */}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext} 
        className="w-full py-5 px-6 bg-[#15803d] text-white rounded-[2rem] font-bold text-sm tracking-wide shadow-lg shadow-[#15803d]/25 hover:bg-[#0d6e2e] hover:shadow-xl hover:shadow-[#15803d]/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <span>Check a Decision</span>
        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  </motion.div>
);

// --- Screen 1: Input Form (Spend, Category, Cost, Mindset, Intent, Urgency) ---
const Screen1 = ({ 
  data, 
  updateData, 
  onNext 
}: { 
  data: FinancialData, 
  updateData: (d: Partial<FinancialData>) => void, 
  onNext: () => void, 
  key?: string 
}) => {
  const isComplete = data.item.trim() !== '' && data.category !== '' && data.cost !== null && data.priority !== '';

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionTitle>What are you planning?</SectionTitle>
      
      <div className="space-y-3">
        <InputField 
          label="What's this spend for?" 
          value={data.item} 
          onChange={(e: any) => updateData({ item: e.target.value })}
          placeholder="e.g. iPhone 15 Pro, Europe Trip, Laptop"
        />
        
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1.5 uppercase tracking-wider">Category</label>
          <div className="relative">
            <select 
              value={data.category}
              onChange={(e) => updateData({ category: e.target.value })}
              className={`w-full px-5 py-3.5 bg-white border border-[#E5E5E5] rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 hover:border-gray-400 transition-colors cursor-pointer ${!data.category ? 'text-gray-500' : 'text-[#1A1A1A]'}`}
            >
              <option value="" className="text-gray-400">Select Category</option>
              <option className="text-[#1A1A1A]">Tech & Gadgets</option>
              <option className="text-[#1A1A1A]">Travel & Experiences</option>
              <option className="text-[#1A1A1A]">Home & Appliances</option>
              <option className="text-[#1A1A1A]">Luxury & Fashion</option>
              <option className="text-[#1A1A1A]">Vehicle & Mobility</option>
              <option className="text-[#1A1A1A]">Education & Upskilling</option>
              <option className="text-[#1A1A1A]">Health & Wellness</option>
              <option className="text-[#1A1A1A]">Major Life Events</option>
              <option className="text-[#1A1A1A]">Investment</option>
              <option className="text-[#1A1A1A]">Other</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight size={16} className="rotate-90 text-gray-400" />
            </div>
          </div>
        </div>

        <SliderInput 
          label="Estimated cost" 
          value={data.cost} 
          onChange={(val: number) => updateData({ cost: val })}
          min={100}
          max={20000000}
        />

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-3 uppercase tracking-wider">How will you pay?</label>
          
          <div className="space-y-3">
            {/* One-time payment */}
            <button
              type="button"
              onClick={() => updateData({ paymentMethod: 'onetime', emiMonths: null, emiAmount: null, emiType: null })}
              className={`w-full p-4 rounded-2xl border transition-all duration-150 text-left cursor-pointer hover:border-gray-400 hover:shadow-md active:scale-[0.99] ${
                data.paymentMethod === 'onetime' || (!data.paymentMethod && data.paymentMethod !== 'emi')
                  ? 'border-[#1A1A1A] bg-white shadow-lg ring-2 ring-[#1A1A1A]/10' 
                  : 'border-[#E5E5E5] bg-white hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm">One-time payment</p>
                  <p className="text-[12px] text-gray-500 mt-1">Pay full amount now</p>
                </div>
                {(data.paymentMethod === 'onetime' || (!data.paymentMethod && data.paymentMethod !== 'emi')) && (
                  <CheckCircle2 size={18} className="text-[#1A1A1A]" />
                )}
              </div>
            </button>

            {/* No-Cost EMI */}
            <button
              type="button"
              onClick={() => {
                const defaultMonths = data.emiMonths || 12;
                const defaultDown = data.downPayment || 0;
                const autoAmt = data.cost ? Math.round((data.cost - defaultDown) / defaultMonths) : null;
                updateData({ 
                  paymentMethod: 'emi', 
                  emiType: 'nocost', 
                  emiMonths: defaultMonths, 
                  emiAmount: data.emiAmount || autoAmt 
                });
              }}
              className={`w-full p-4 rounded-2xl border transition-all duration-150 text-left cursor-pointer hover:border-gray-400 hover:shadow-md active:scale-[0.99] ${
                data.paymentMethod === 'emi' && data.emiType === 'nocost'
                  ? 'border-[#1A1A1A] bg-white shadow-lg ring-2 ring-[#1A1A1A]/10' 
                  : 'border-[#E5E5E5] bg-white hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm">No-Cost EMI</p>
                  <p className="text-[12px] text-gray-500 mt-1">0% interest, spread payment</p>
                </div>
                {data.paymentMethod === 'emi' && data.emiType === 'nocost' && (
                  <CheckCircle2 size={18} className="text-[#1A1A1A]" />
                )}
              </div>
            </button>

            {/* Regular EMI */}
            <button
              type="button"
              onClick={() => {
                const defaultMonths = data.emiMonths || 12;
                const defaultDown = data.downPayment || 0;
                const autoAmt = data.cost ? Math.round(((data.cost - defaultDown) * 1.08) / defaultMonths) : null;
                updateData({ 
                  paymentMethod: 'emi', 
                  emiType: 'regular', 
                  emiMonths: defaultMonths, 
                  emiAmount: data.emiAmount || autoAmt 
                });
              }}
              className={`w-full p-4 rounded-2xl border transition-all duration-150 text-left cursor-pointer hover:border-gray-400 hover:shadow-md active:scale-[0.99] ${
                data.paymentMethod === 'emi' && data.emiType === 'regular'
                  ? 'border-[#1A1A1A] bg-white shadow-lg ring-2 ring-[#1A1A1A]/10' 
                  : 'border-[#E5E5E5] bg-white hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm">Regular EMI</p>
                  <p className="text-[12px] text-gray-500 mt-1">With interest rate</p>
                </div>
                {data.paymentMethod === 'emi' && data.emiType === 'regular' && (
                  <CheckCircle2 size={18} className="text-[#1A1A1A]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* EMI Details if EMI selected */}
        {data.paymentMethod === 'emi' && (
          <div className="space-y-3 mb-6 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            {/* EMI Amount Input (user enters exact amount) */}
            <InputField 
              label="Monthly EMI Amount" 
              value={data.emiAmount ?? ''} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData({ emiAmount: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="e.g. 6000"
              type="number"
              prefix="₹"
            />
            
            {/* EMI Duration */}
            <SliderInput 
              label="EMI Duration" 
              value={data.emiMonths || 12} 
              onChange={(val: number) => {
                updateData({ 
                  emiMonths: val,
                  ...(!data.emiAmount && data.cost ? { 
                    emiAmount: Math.round((data.cost - (data.downPayment || 0)) / val) 
                  } : {})
                });
              }} 
              min={3}
              max={24}
              step={3}
              prefix=""
            />
            
            {/* Down Payment (optional) */}
            <SliderInput 
              label="Down Payment (optional)" 
              value={data.downPayment || 0} 
              onChange={(val: number) => updateData({ downPayment: val })} 
              max={data.cost || 100000}
            />
            
            {/* Display Summary */}
            {Boolean(data.emiAmount && data.emiMonths) && (
              <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">EMI Summary</p>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-[#1A1A1A]">
                    ₹{(data.emiAmount || 0).toLocaleString('en-IN')}/month
                  </p>
                  <p className="text-[11px] text-gray-600">
                    for {data.emiMonths} months
                    {data.downPayment ? ` (after ₹${(data.downPayment).toLocaleString('en-IN')} down)` : ''}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Total amount: ₹{(((data.emiAmount || 0) * (data.emiMonths || 1)) + (data.downPayment || 0)).toLocaleString('en-IN')}
                  </p>
                  {data.emiType === 'regular' && (
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                      Note: This includes interest. Your actual monthly payment may vary.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="text-[17px] font-bold leading-tight mt-3 mb-2 text-[#1A1A1A]">What matters most?</h2>
      
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { 
            id: 'comfortable', 
            label: 'Safety-First', 
            desc: 'Peace of mind & security',
            tooltip: 'I prioritize peace of mind and security', 
            icon: ShieldCheck, 
            color: 'text-emerald-700', 
            bg: 'bg-emerald-50' 
          },
          { 
            id: 'flexible', 
            label: 'Be Flexible', 
            desc: 'Growth with present living',
            tooltip: 'I balance growth with present living', 
            icon: Zap, 
            color: 'text-blue-700', 
            bg: 'bg-blue-50' 
          },
          { 
            id: 'ahead', 
            label: 'Think Ahead', 
            desc: 'Long-term wealth building',
            tooltip: 'I prioritize long-term wealth building', 
            icon: Target, 
            color: 'text-purple-700', 
            bg: 'bg-purple-50' 
          }
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.tooltip}
            onClick={() => updateData({ priority: p.id as Priority })}
            className={`group flex flex-col items-center p-3 rounded-[1.5rem] border transition-all duration-200 text-center relative overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
              data.priority === p.id 
                ? 'border-[#1A1A1A] bg-white shadow-lg ring-4 ring-[#1A1A1A]/5 scale-[1.02]' 
                : 'border-[#E5E5E5] bg-white hover:border-gray-400 shadow-xs'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-200 group-hover:scale-110 ${
              data.priority === p.id ? p.bg : 'bg-gray-50 group-hover:bg-gray-100'
            }`}>
              <p.icon size={20} className={data.priority === p.id ? p.color : "text-gray-500 group-hover:text-gray-700"} />
            </div>
            <p className={`text-[12px] font-bold leading-tight mb-1 transition-colors ${
              data.priority === p.id ? "text-[#1A1A1A]" : "text-gray-700"
            }`}>
              {p.label}
            </p>
            <span className={`text-[9px] font-medium leading-tight line-clamp-2 px-0.5 transition-colors ${
              data.priority === p.id ? "text-gray-700 font-semibold" : "text-gray-400 group-hover:text-gray-500"
            }`}>
              {p.desc}
            </span>
          </button>
        ))}
      </div>

      {/* 2 Additional Context Questions */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1.5 uppercase tracking-wider">
            Why do you want this?
          </label>
          <div className="relative">
            <select
              value={data.intent || 'Lifestyle Upgrade'}
              onChange={(e) => updateData({ intent: e.target.value })}
              className="w-full px-5 py-3.5 bg-white border border-[#E5E5E5] rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 text-[#1A1A1A] hover:border-gray-400 transition-colors cursor-pointer"
            >
              <option value="Work / Productivity">Work / Productivity</option>
              <option value="Lifestyle Upgrade">Lifestyle Upgrade</option>
              <option value="Emotional Impulse">Emotional Impulse</option>
              <option value="Long-term Investment">Long-term Investment</option>
              <option value="Gift / Celebration">Gift / Celebration</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight size={16} className="rotate-90 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1.5 uppercase tracking-wider">
            How soon do you need it?
          </label>
          <div className="relative">
            <select
              value={data.urgency || 'Today'}
              onChange={(e) => updateData({ urgency: e.target.value })}
              className="w-full px-5 py-3.5 bg-white border border-[#E5E5E5] rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 text-[#1A1A1A] hover:border-gray-400 transition-colors cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Within 3 Months">Within 3 Months</option>
              <option value="Flexible / No Rush">Flexible / No Rush</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight size={16} className="rotate-90 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <PrimaryButton onClick={onNext} disabled={!isComplete}>Continue</PrimaryButton>
    </motion.div>
  );
};

// --- Screen 2: Financial Situation ---
const Screen2 = ({ 
  data, 
  updateData, 
  onNext, 
  loading,
  onDetectLocation,
  isLocating,
  locationNotice,
  setLocationNotice
}: { 
  data: FinancialData, 
  updateData: (d: Partial<FinancialData>) => void, 
  onNext: () => void, 
  loading: boolean,
  onDetectLocation: () => void,
  isLocating: boolean,
  locationNotice?: string | null,
  setLocationNotice?: (msg: string | null) => void,
  key?: string
}) => {
  const isIncomeValid = data.income !== null && data.income > 0;
  const isComplete = isIncomeValid && data.expenses !== null && data.location.trim() !== '';

  const totalMonthlyExpenses = (data.expenses || 0) + (data.otherExpenses || 0);
  const expensesExceed = isIncomeValid && totalMonthlyExpenses > (data.income || 0);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SectionTitle>Your monthly situation</SectionTitle>
      
      <div className="space-y-3">
        <div>
          <SliderInput 
            label="Monthly Income" 
            value={data.income} 
            onChange={(val: number) => updateData({ income: val })} 
            min={1000}
            max={5000000}
          />
          {!isIncomeValid && (
            <p className="text-[12px] font-semibold text-amber-600 mt-1 flex items-center gap-1.5">
              Add your monthly income so we can give you a real verdict.
            </p>
          )}
        </div>

        {/* Consolidated Monthly Fixed Expenses to prevent double-counting */}
        <div>
          <SliderInput 
            label="Monthly Fixed Expenses" 
            value={data.expenses} 
            onChange={(val: number) => updateData({ expenses: val })} 
            min={500}
            max={300000}
          />
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            Include rent, EMIs, subscriptions, utilities, groceries — all regular monthly obligations
          </p>
        </div>
        
        {/* Location Auto-Detection Field with MapPin Button */}
        <div className="pt-2">
          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1.5 uppercase tracking-wider">
            Your Location
          </label>
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={data.location} 
              onChange={(e) => {
                if (setLocationNotice) setLocationNotice(null);
                updateData({ location: e.target.value });
              }} 
              placeholder="Tap icon to detect, or enter city" 
              className="w-full pl-5 pr-12 py-3.5 bg-white border border-[#E5E5E5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all text-[#1A1A1A] placeholder:text-gray-400"
            />
            <button 
              type="button"
              onClick={onDetectLocation}
              disabled={isLocating}
              title="Auto-detect current location"
              className="absolute right-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              {isLocating ? (
                <Loader2 size={18} className="animate-spin text-[#15803d]" />
              ) : (
                <MapPin size={18} className="text-[#15803d]" />
              )}
            </button>
          </div>
          {locationNotice && (
            <p className="text-[11px] text-amber-600 mt-1 font-medium">
              {locationNotice}
            </p>
          )}
        </div>
      </div>

      {/* Soft non-blocking warning when expenses exceed income */}
      {expensesExceed && (
        <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-2.5 text-amber-800 text-[12px] font-medium mt-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>Your expenses exceed your income. We'll factor this in.</span>
        </div>
      )}

      <p className="text-[12px] text-gray-500 leading-relaxed mt-4 mb-6">
        This helps us guide your decision better — your data stays private and secure.
      </p>

      <PrimaryButton onClick={onNext} loading={loading} disabled={!isComplete}>
        Simulate
      </PrimaryButton>
    </motion.div>
  );
};

//// --- Screen 3: Analyzing Screen (Loading) ---
const LoadingScreen = ({ 
  onComplete, 
  data, 
  isGuidanceReady, 
  alreadyCompleted, 
  apiError: parentApiError,
  onRetry
}: { 
  onComplete: () => void, 
  data: FinancialData, 
  isGuidanceReady: boolean, 
  alreadyCompleted: boolean, 
  apiError?: boolean,
  onRetry?: () => void,
  key?: string 
}) => {
  const itemName = data.item && data.item.trim() ? data.item.trim() : 'item';
  const incomeStr = data.income ? data.income.toLocaleString('en-IN') : '0';
  const expensesStr = data.expenses ? data.expenses.toLocaleString('en-IN') : '0';
  const costStr = data.cost ? data.cost.toLocaleString('en-IN') : '0';
  const mindsetStr = 
    data.priority === 'comfortable' ? 'Stay comfortable' :
    data.priority === 'flexible' ? 'Be flexible' :
    data.priority === 'ahead' ? 'Think ahead' :
    (data.priority || 'Comfortable');
  const locationStr = data.location && data.location.trim() ? data.location.trim() : 'your city';

  const isEmiPlan = data.paymentMethod === 'emi';
  const effectiveEmi = isEmiPlan 
    ? (data.emiAmount && data.emiAmount > 0 
        ? data.emiAmount 
        : (data.emiMonths ? Math.round(((data.cost || 0) - (data.downPayment || 0)) / data.emiMonths) : null))
    : null;

  const steps = [
    `Analyzing your ₹${incomeStr} monthly cash flow...`,
    `Evaluating your ₹${expensesStr} fixed monthly obligations...`,
    ...(isEmiPlan 
      ? [`Calculating ₹${effectiveEmi?.toLocaleString('en-IN')}/mo EMI impact on monthly cash flow...`]
      : [`Evaluating upfront ₹${costStr} capital outlay...`]
    ),
    `Calculating the impact on your emergency safety net...`,
    `Aligning ${itemName} with your "${mindsetStr}" priority...`,
    `Factoring in cost-of-living trends in ${locationStr}...`,
    `Weighing the long-term opportunity cost of ${itemName}...`,
    `Benchmarking against similar financial profiles...`,
    `Calculating potential recurring ownership & maintenance costs...`,
    `Scanning market cycles for optimal purchase timing...`,
    `Finalizing your Sukoon Expert Guidance...`
  ];

  const [currentStep, setCurrentStep] = useState(alreadyCompleted ? steps.length : 0);
  const [isFinished, setIsFinished] = useState(alreadyCompleted);
  const [apiError, setApiError] = useState(!!parentApiError);
  const [currentAnalysisStage, setCurrentAnalysisStage] = useState(0);
  const [stagesCycled, setStagesCycled] = useState(alreadyCompleted);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const isGuidanceReadyRef = useRef(isGuidanceReady);

  const analysisStageMessages = [
    "Analyzing your financial constraints",
    "Evaluating affordability metrics",
    "Assessing financial impact",
    "Preparing your personalized verdict"
  ];

  const analysisStageDescriptions = [
    "Processing income, expenses, and obligations...",
    "Calculating debt-to-income and cash flow ratios...",
    "Calibrating verdict based on your stated priorities...",
    "Synthesizing personalized financial guidance..."
  ];

  useEffect(() => {
    isGuidanceReadyRef.current = isGuidanceReady;
  }, [isGuidanceReady]);

  useEffect(() => {
    if (parentApiError) {
      setApiError(true);
    }
  }, [parentApiError]);

  // Checklist sequence progression
  useEffect(() => {
    if (alreadyCompleted || apiError) {
      if (alreadyCompleted) {
        setIsFinished(true);
      }
      return;
    }

    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [alreadyCompleted, apiError, currentStep, steps.length]);

  // Dynamic status messages cycle continuously until verdict arrives
  useEffect(() => {
    if (currentStep === steps.length && !isFinished && !apiError) {
      // Cycle through status messages
      const stageInterval = setInterval(() => {
        setCurrentAnalysisStage(prev => {
          if (prev >= 3) {
            setStagesCycled(true);
            return 3;
          }
          return prev + 1;
        });
      }, 1800);

      // Check if verdict is ready: if verdict data hasn't arrived after 30 seconds, show error
      const timeoutTimer = setTimeout(() => {
        if (!isGuidanceReadyRef.current) {
          setApiError(true);
        }
      }, 30000);

      return () => {
        clearInterval(stageInterval);
        clearTimeout(timeoutTimer);
      };
    }
  }, [currentStep, isFinished, steps.length, apiError]);

  // Finish ONLY when verdict data has arrived AND checklist steps have completed
  useEffect(() => {
    if ((stagesCycled || currentStep === steps.length) && isGuidanceReady && !apiError && !isFinished) {
      const timer = setTimeout(() => {
        setIsFinished(true);
        onComplete();
      }, 400); // 400ms transition delay for smoothness
      return () => clearTimeout(timer);
    }
  }, [stagesCycled, currentStep, steps.length, isGuidanceReady, apiError, isFinished, onComplete]);

  // Auto-scroll list when checklist is animating
  useEffect(() => {
    if (listContainerRef.current && currentStep < steps.length) {
      const activeEl = listContainerRef.current.children[Math.min(currentStep, steps.length - 1)] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentStep, steps.length]);

  // Error handling screen
  if (apiError) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col items-center justify-center min-h-[400px] text-center px-4 my-auto select-none"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-sm">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-2">Analysis taking longer</h2>
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed max-w-xs">
          Our analysis engine is taking longer than expected. This sometimes happens with slow connections.
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          {onRetry && (
            <button
              onClick={() => {
                setApiError(false);
                setCurrentAnalysisStage(0);
                setStagesCycled(false);
                onRetry();
              }}
              className="w-full py-3.5 px-6 bg-[#1A1A1A] text-white rounded-[2rem] font-bold text-xs hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          )}
          <PrimaryButton onClick={onComplete}>Continue Anyway</PrimaryButton>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-between min-h-[580px] pb-[80px] pt-4 text-center select-none overflow-y-auto"
    >
      {/* Top Header Badge */}
      <div className="flex flex-col items-center gap-1.5 pt-2 mb-3 shrink-0">
        <div className="flex items-center gap-2 px-3.5 py-1 bg-green-50 rounded-full border border-green-200">
          <Sparkles size={12} className="text-[#15803d]" />
          <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-[0.2em]">
            Sukoon Intelligence
          </span>
        </div>
        <p className="text-[13px] text-gray-700 font-semibold mt-1">
          Analyzing "{itemName}"
        </p>
      </div>

      {currentStep === steps.length ? (
        /* Animated Progress Bar & Dynamic Status Messages without % or countdown */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px] py-10 my-auto w-full px-4"
        >
          {/* Animated Continuous Progress Bar with smooth linear forward progression - no reversing */}
          <div className="w-full max-w-xs mx-auto mb-8">
            <div className="h-2.5 bg-[#F0F0F0] rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                className="h-full bg-[#15803d] rounded-full relative overflow-hidden"
                initial={{ width: "15%" }}
                animate={{
                  width: isGuidanceReady ? "100%" : "95%"
                }}
                transition={
                  isGuidanceReady
                    ? { duration: 0.35, ease: "easeOut" }
                    : { duration: 28, ease: "linear" }
                }
              >
                {/* Moving shimmer light across the bar - linear infinite forward motion */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>

          {/* Dynamic Status Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAnalysisStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="text-center mb-8 px-4"
            >
              <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-2">
                {analysisStageMessages[currentAnalysisStage]}
              </h3>
              <p className="text-[12px] text-gray-500">
                {analysisStageDescriptions[currentAnalysisStage]}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Looping Loading Pills (dots) */}
          <div className="flex gap-2.5 justify-center">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-[#15803d]"
                animate={{ 
                  scale: [1, 1.35, 1],
                  opacity: [0.35, 1, 0.35] 
                }}
                transition={{ 
                  duration: 1.4, 
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        /* Sequential checklist */
        <div 
          ref={listContainerRef}
          className="w-full max-w-sm my-auto space-y-2 px-1 py-2 max-h-[380px] overflow-y-auto scrollbar-none"
        >
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -6 }}
                animate={{ 
                  opacity: isCompleted ? 1 : isCurrent ? 1 : 0.35, 
                  x: 0 
                }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  isCompleted 
                    ? 'bg-green-50/60 border-green-200/80 text-[#1A1A1A]' 
                    : isCurrent 
                    ? 'bg-white border-[#1A1A1A]/30 text-[#1A1A1A] shadow-sm ring-2 ring-[#15803d]/20' 
                    : 'bg-gray-50/50 border-gray-100 text-gray-400'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 size={15} className="text-[#15803d]" />
                  ) : isCurrent ? (
                    <Loader2 size={14} className="text-[#15803d] animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className="text-[11px] font-medium leading-snug">
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom Status Message */}
      <div className="w-full pt-4 flex flex-col items-center shrink-0">
        <p className="text-[11px] text-gray-500 font-medium tracking-wide">
          {currentStep === steps.length ? "Finalizing personalized analysis..." : "Calibrating every angle of your decision..."}
        </p>
      </div>
    </motion.div>
  );
};

// --- Feedback Component (😊 😐 😟) ---
const Feedback = ({ onFeedback }: { onFeedback: (feeling: string) => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  const feelings = [
    { icon: '😊', label: 'Feels right', question: "What made this guidance feel right for you? Tell us more..." },
    { icon: '😐', label: 'Still unsure', question: "What's still on your mind? How can we help you decide? Tell us more..." },
    { icon: '😟', label: 'Not a good decision', question: "What didn't work for you? How can we improve? Tell us more..." }
  ];

  const handleSelect = (i: number) => {
    setSelected(i);
    onFeedback(feelings[i].label);
  };

  const handleSave = () => {
    setIsSaved(true);
  };

  return (
    <div className="bg-white/40 rounded-[1.5rem] p-4 border border-[#F0F0F0] shadow-sm">
      {!isSaved ? (
        <>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mb-3">
            How do you feel about this guidance?
          </p>
          <div className="flex justify-center gap-3 mb-4">
            {feelings.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all cursor-pointer ${
                  selected === i 
                    ? 'bg-white border-2 border-[#1A1A1A] shadow-md scale-105' 
                    : 'bg-white/60 border border-transparent hover:bg-white'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-[10px] font-bold text-gray-600">{opt.label}</span>
              </button>
            ))}
          </div>
          {selected !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={feelings[selected].question}
                className="w-full p-3 bg-white border border-[#E5E5E5] rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] resize-none h-20 text-[#1A1A1A]"
              />
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                Submit Feedback
              </button>
            </motion.div>
          )}
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs font-bold text-green-600">Thank you for your feedback!</p>
        </div>
      )}
    </div>
  );
};

// --- TalkToExpert Component ---
const TalkToExpert = ({ onClick }: { onClick: () => void }) => (
  <button 
    type="button"
    onClick={onClick}
    className="w-full py-4 bg-white border border-[#E5E5E5] rounded-[2rem] flex items-center justify-center gap-2 text-xs font-bold text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
  >
    <MessageSquare size={16} />
    <span>Still unsure? Talk to an expert</span>
  </button>
);

// --- Screen 4: Verdict Screen (Original Remix Version + 100px bottom clearance) ---
const Screen3 = ({ 
  data, 
  guidance: propGuidance, 
  onNext, 
  onSmarter, 
  onTalkToExpert, 
  onReset,
  showAnimation,
  onRequest30DayPrompt,
  onOverrideAndGo
}: { 
  data: FinancialData, 
  guidance: DecisionResult | null, 
  onNext?: () => void, 
  onSmarter: () => void, 
  onTalkToExpert: () => void, 
  onReset: () => void, 
  showAnimation?: boolean, 
  onRequest30DayPrompt?: () => void,
  onOverrideAndGo?: () => void,
  key?: string 
}) => {
  const guidance = useMemo(() => {
    return propGuidance || getDefaultDecisionResult({
      item: data.item,
      category: data.category,
      cost: data.cost || 0,
      priority: data.priority || 'comfortable',
      income: data.income || 0,
      expenses: data.expenses || 0,
      emi: data.emi || 0,
      otherExpenses: data.otherExpenses || 0,
      location: data.location || 'India',
      lifestyle: data.lifestyle || 'Moderate',
      intent: data.intent || 'Lifestyle Upgrade',
      urgency: data.urgency || 'This Month',
      paymentMethod: data.paymentMethod,
      emiType: data.emiType,
      emiMonths: data.emiMonths,
      emiAmount: data.emiAmount,
      downPayment: data.downPayment
    });
  }, [propGuidance, data]);

  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);

  const rawDecision = guidance.decision;
  const isSafe = rawDecision === 'Safe' || rawDecision === 'GO';
  const isCaution = rawDecision === 'Caution' || rawDecision === 'CAUTION';
  const isWait = rawDecision === 'Wait' || rawDecision === 'WAIT';

  const Icon = isSafe ? CheckCircle2 : isCaution ? AlertTriangle : Clock;
  const badgeText = isSafe ? 'Safe to Spend' : isCaution ? 'Proceed with Caution' : 'Better to Wait';
  const color = isSafe ? '#15803d' : isCaution ? '#d97706' : '#dc2626';

  const priorityInfo = {
    comfortable: { label: 'Safety-First', icon: ShieldCheck, color: 'text-[#15803d]', bg: 'bg-[#DCFCE7]' },
    flexible: { label: 'Be Flexible', icon: Zap, color: 'text-[#1D4ED8]', bg: 'bg-[#DBEAFE]' },
    ahead: { label: 'Think Ahead', icon: Target, color: 'text-[#7E22CE]', bg: 'bg-[#F3E8FF]' }
  };

  const getReassurance = () => {
    const p = data.priority;
    if (p === 'comfortable') {
      if (isSafe) return "This purchase aligns with your safety-first goal to protect peace of mind and maintain security.";
      if (isCaution) return "This might add some strain to your finances, which challenges your safety-first goal.";
      return "Waiting will help you maintain the safety-first security and cushion you prioritize.";
    }
    if (p === 'flexible') {
      if (isSafe) return "You can enjoy this now while balancing growth and present living.";
      if (isCaution) return "This provides immediate joy but might limit your flexibility in the coming months.";
      return "Waiting ensures you maintain the flexibility to handle other opportunities.";
    }
    if (p === 'ahead') {
      if (isSafe) return "This is a solid long-term move that fits your wealth-building strategy.";
      if (isCaution) return "Think carefully if this purchase truly serves your long-term wealth building right now.";
      return "By waiting, you're making a smarter choice for long-term compounding.";
    }
    return "This decision has been calibrated against your stated priorities.";
  };

  const pInfo = priorityInfo[data.priority as Priority] || priorityInfo.comfortable;

  // The 4 Financial Insights cards: Cash Flow, Lifestyle Creep, Opportunity Cost, Market Cycle
  const insightsList = guidance.insights && guidance.insights.length >= 4 ? guidance.insights.slice(0, 4) : [
    { label: 'Cash Flow', text: 'Monthly surplus easily absorbs this commitment.', icon: '💸', detailedAnalysis: `Your monthly income of ₹${data.income?.toLocaleString('en-IN')} leaves sufficient buffer after your fixed expenses of ₹${data.expenses?.toLocaleString('en-IN')}.` },
    { label: 'Lifestyle Creep', text: 'Evaluated against secondary matching purchases.', icon: '🏠', detailedAnalysis: `This spend is intentional and aligned with your "${pInfo.label}" focus, minimizing unwanted habit inflation.` },
    { label: 'Opportunity Cost', text: 'Compounding potential preserved in liquid funds.', icon: '⚖️', detailedAnalysis: `At ₹${data.cost?.toLocaleString('en-IN')}, this allocation maintains your primary savings targets without derailment.` },
    { label: 'Market Cycle', text: 'Favorable purchase timing and price trend.', icon: '🏷️', detailedAnalysis: `Current market pricing for ${data.item || 'this item'} in ${data.location || 'your area'} is competitive and stable.` }
  ];

  const isEmi = data.paymentMethod === 'emi';
  const effectiveMonthlyEmi = isEmi
    ? (data.emiAmount && data.emiAmount > 0
        ? data.emiAmount
        : (data.emiMonths && data.emiMonths > 0
            ? Math.round(((data.cost || 0) - (data.downPayment || 0)) / data.emiMonths)
            : (data.cost || 0)))
    : 0;

  const monthlyIncome = guidance.explanation?.monthlyIncome || data.income || 0;
  const fixedExpenses = data.expenses || 0;
  const emiAmount = effectiveMonthlyEmi;
  const totalObligations = guidance.explanation?.totalObligations !== undefined 
    ? guidance.explanation.totalObligations 
    : (fixedExpenses + emiAmount);
  const buffer = guidance.explanation?.remainingBuffer !== undefined
    ? guidance.explanation.remainingBuffer
    : Math.max(0, monthlyIncome - totalObligations);

  const obligationPercentage = monthlyIncome > 0 ? Math.round((totalObligations / monthlyIncome) * 100) : 0;
  const bufferPercentage = monthlyIncome > 0 ? Math.round((buffer / monthlyIncome) * 100) : 0;

  const riskLevel = isSafe ? 'Low' : isCaution ? 'Moderate' : 'High';
  const riskColor = isSafe 
    ? 'text-green-700 bg-green-50 border-green-200' 
    : isCaution 
    ? 'text-amber-700 bg-amber-50 border-amber-200' 
    : 'text-red-700 bg-red-50 border-red-200';

  // Level 2 checks
  const isSavingsGood = bufferPercentage >= 20;
  const savingsPotential = `₹${buffer.toLocaleString('en-IN')}`;
  const savingsRate = `${bufferPercentage}%`;

  const isDebtGood = obligationPercentage <= 60;
  const debtRatio = obligationPercentage <= 50 
    ? `Healthy (${obligationPercentage}%)` 
    : obligationPercentage <= 70 
    ? `Manageable (${obligationPercentage}%)` 
    : `High (${obligationPercentage}%)`;

  const isEmergencyGood = isSafe || bufferPercentage >= 35;
  const emergencyFund = isSafe 
    ? `Protected (Surplus intact)` 
    : isCaution 
    ? `Moderate impact on liquid buffer` 
    : `Strained below safety threshold`;

  const isLifestyleGood = isSafe;
  const lifestyleImpact = isSafe 
    ? `Balanced with "${pInfo.label}" focus` 
    : isCaution 
    ? `Requires conscious budgeting` 
    : `High commitment risk`;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="pb-[100px] overflow-y-auto"
    >
      {/* 1. TOP: Verdict badge with icon */}
      <div className="flex flex-col items-center text-center mb-8 pt-2">
        <motion.div 
          initial={showAnimation ? { scale: 0.5, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-16 h-16 text-white rounded-full flex items-center justify-center mb-6 shadow-lg relative"
          style={{ backgroundColor: color, boxShadow: `0 10px 20px ${color}33` }}
        >
          <Icon size={36} />
          <div className="absolute -bottom-2 bg-white text-[#1A1A1A] text-[10px] font-bold px-4 py-1.5 rounded-full border border-gray-100 shadow-md whitespace-nowrap">
            {badgeText}
          </div>
        </motion.div>

        {/* 2. Sharp insight text below in bold */}
        <motion.div
          initial={showAnimation ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showAnimation ? 0.2 : 0 }}
          className="w-full p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm mb-6 relative overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: color }} />
          <h1 className="text-[16px] font-bold text-[#1A1A1A] leading-tight mb-2">
            {guidance.synthesis || guidance.sharpInsight}
          </h1>
          <p className="text-[12px] text-gray-500 italic leading-relaxed">
            {guidance.hook || "We ran your decision through a real-world financial check."}
          </p>
        </motion.div>

        {/* 3. Priority card showing selected mindset */}
        <motion.div
          initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: showAnimation ? 0.5 : 0 }}
          className={`w-full p-4 rounded-2xl flex items-center gap-3 text-left border ${pInfo.bg} border-black/5 mb-6`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm shrink-0">
            <pInfo.icon size={20} className={pInfo.color} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Priority: {pInfo.label}</p>
            <p className="text-[12px] font-medium text-[#1A1A1A] leading-tight">{getReassurance()}</p>
          </div>
        </motion.div>
      </div>

      {/* 4. “FINANCIAL INSIGHTS” section with 4 tappable cards: Cash Flow, Lifestyle Creep, Opportunity Cost, Market Cycle */}
      <div className="mb-8">
        <div className="flex flex-col items-center mb-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-1">Financial Insights</p>
          <p className="text-[11px] text-gray-500 font-medium italic">Tap on an insight to see detailed analysis</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {insightsList.map((item, i) => (
              <motion.div 
                key={i} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col col-span-1"
              >
                <motion.button 
                  onClick={() => setSelectedInsight(i)}
                  className={`h-full p-4 bg-white rounded-[2rem] border flex flex-col gap-2 items-center text-center shadow-sm transition-all relative ${
                    i === 0 ? 'border-[#15803d]/20 bg-[#15803d]/5' : 'border-[#F0F0F0]'
                  } hover:border-[#1A1A1A] hover:shadow-md cursor-pointer`}
                >
                  {i === 0 && (
                    <div className="absolute top-3 right-4">
                      <Sparkles size={10} className="text-[#15803d]" />
                    </div>
                  )}
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="text-[9px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-0.5 line-clamp-1">{item.label}</h4>
                    <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{item.text}</p>
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Insight Detail Modal */}
        <AnimatePresence>
          {selectedInsight !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-32">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedInsight(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-y-auto max-h-full scrollbar-hide"
              >
                <button 
                  onClick={() => setSelectedInsight(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-[#F9FAFB] rounded-3xl flex items-center justify-center text-4xl mb-6 border border-[#F0F0F0]">
                    {insightsList[selectedInsight].icon}
                  </div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                    {insightsList[selectedInsight].label}
                  </h3>
                  <h2 className="text-[18px] font-bold text-[#1A1A1A] leading-tight mb-4">
                    {insightsList[selectedInsight].text}
                  </h2>
                  
                  <div className="w-full h-px bg-gray-100 mb-6" />
                  
                  <div className="w-full p-6 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-[#1A1A1A]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563]">Expert Intelligence Analysis</span>
                    </div>
                    <p className="text-[12px] text-[#1A1A1A] leading-relaxed font-medium">
                      {insightsList[selectedInsight].detailedAnalysis}
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedInsight(null)}
                    className="mt-8 w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-black/10 hover:bg-black transition-colors cursor-pointer"
                  >
                    Close Analysis
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Progressive Disclosure Calculation Breakdown */}
      <motion.div 
        initial={showAnimation ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showAnimation ? 0.8 : 0 }}
        className="mb-6 space-y-4"
      >
        <details className="group bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden transition-all">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none hover:bg-gray-50/70 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#1A1A1A] group-open:bg-[#15803d]/10 group-open:text-[#15803d] transition-colors">
                <Calculator size={16} />
              </div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                See the calculation
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="px-5 pb-5 pt-1 text-left border-t border-gray-100/80">
            {/* The Numbers breakdown table */}
            <div className="py-2 space-y-2.5 text-[12px]">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Monthly Income</span>
                <span className="font-bold text-[#1A1A1A]">₹{monthlyIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Current Fixed Expenses</span>
                <span className="font-bold text-[#1A1A1A]">₹{fixedExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">{isEmi ? "New EMI" : "Purchase Outlay"}</span>
                <span className="font-bold text-[#1A1A1A]">₹{(isEmi ? emiAmount : (data.cost || 0)).toLocaleString('en-IN')}{isEmi ? "/mo" : ""}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Total Obligations</span>
                <span className="font-bold text-[#1A1A1A]">₹{totalObligations.toLocaleString('en-IN')} ({obligationPercentage}%)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Your buffer</span>
                <span className="font-bold text-[#15803d]">₹{buffer.toLocaleString('en-IN')} ({bufferPercentage}%)</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500 font-medium">Risk level</span>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${riskColor}`}>
                  {riskLevel}
                </span>
              </div>
            </div>

            {/* Level 2: Nested SUKOON SMART CHECKS */}
            <details className="group/checks mt-4 pt-3 border-t border-gray-100">
              <summary className="flex items-center justify-between cursor-pointer list-none select-none text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#1A1A1A] py-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#15803d]" />
                  <span>Sukoon Smart Checks</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 transition-transform duration-200 group-open/checks:rotate-180" />
              </summary>

              <div className="mt-2.5 space-y-2 pt-1 text-[11px]">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className={isSavingsGood ? "text-[#15803d] font-bold text-xs" : "text-amber-600 font-bold text-xs"}>
                    {isSavingsGood ? "✓" : "⚠"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-[#1A1A1A]">Monthly Savings Potential: </span>
                    <span className="text-gray-600">{savingsPotential} ({savingsRate})</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className={isDebtGood ? "text-[#15803d] font-bold text-xs" : "text-amber-600 font-bold text-xs"}>
                    {isDebtGood ? "✓" : "⚠"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-[#1A1A1A]">Debt-to-Income Balance: </span>
                    <span className="text-gray-600">{debtRatio}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className={isEmergencyGood ? "text-[#15803d] font-bold text-xs" : "text-amber-600 font-bold text-xs"}>
                    {isEmergencyGood ? "✓" : "⚠"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-[#1A1A1A]">Emergency Fund Safety: </span>
                    <span className="text-gray-600">{emergencyFund}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className={isLifestyleGood ? "text-[#15803d] font-bold text-xs" : "text-amber-600 font-bold text-xs"}>
                    {isLifestyleGood ? "✓" : "⚠"}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-[#1A1A1A]">Lifestyle Impact: </span>
                    <span className="text-gray-600">{lifestyleImpact}</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </details>

        {/* 6. Emoji feedback row */}
        <Feedback onFeedback={(feeling) => console.log('Feedback:', feeling)} />
      </motion.div>

      {/* 7, 8, 9. Buttons */}
      <motion.div 
        initial={showAnimation ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showAnimation ? 1 : 0 }}
        className="space-y-3"
      >
        <TalkToExpert onClick={onTalkToExpert} />
        <div className="pt-1">
          <PrimaryButton onClick={onSmarter} className="shadow-lg">
            <Sparkles size={18} />
            Smarter ways to make it happen
          </PrimaryButton>
        </div>
        <button 
          onClick={onReset} 
          className="w-full py-5 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-[2rem] font-bold text-base hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Wait & re-evaluate
        </button>
      </motion.div>
    </motion.div>
  );
};

const Screen4 = ({ 
  guidance, 
  onNext, 
  onDone, 
  onTalkToExpert, 
  showAnimation 
}: { 
  guidance: DecisionResult | null; 
  onNext?: () => void; 
  onBack?: () => void;
  onDone?: () => void; 
  onTalkToExpert: () => void; 
  showAnimation?: boolean; 
  key?: string; 
}) => {
  // Card 1 expanded by default
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [feedbackSelected, setFeedbackSelected] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const defaultOptions = useMemo(() => [
    {
      title: "Trade-in and Partial Down Payment",
      desc: "Exchange an existing device to compress your monthly outlay.",
      detailedPlan: "Offset the principal through device trade-in value and an upfront down payment to compress the EMI to under ₹3,500 monthly, leaving your surplus agile.",
      bgColor: "#1ABC9C",
      iconType: "exchange"
    },
    {
      title: "Dedicated 4-Month Capital Staging",
      desc: "Allocate surplus into a liquid yield buffer before executing.",
      detailedPlan: "Put funds into a high-yield liquid fund for 30–60 days to let the 'want' cool off; if you still need it after 30 days, use the capital plus the small interest earned to buy it guilt-free.",
      bgColor: "#F39C12",
      iconType: "growth"
    },
    {
      title: "Wait for Festive Sale / Exchange Offer",
      desc: "Time the purchase with upcoming seasonal discounts and bank cashback.",
      detailedPlan: "Major seasonal sales offer 10–15% instant bank discounts plus added trade-in bonuses, easily saving ₹8,000–₹15,000 without compromising your liquidity.",
      bgColor: "#003B3B",
      iconType: "discount"
    }
  ], []);

  const iconConfigs = [
    { bgColor: "#1ABC9C", iconType: "exchange" },
    { bgColor: "#F39C12", iconType: "growth" },
    { bgColor: "#003B3B", iconType: "discount" }
  ];

  const options = useMemo(() => {
    const raw = (guidance?.smarterOptions && guidance.smarterOptions.length > 0)
      ? guidance.smarterOptions
      : defaultOptions;

    return [0, 1, 2].map((idx) => {
      const item = raw[idx] || defaultOptions[idx];
      return {
        title: item.title || defaultOptions[idx].title,
        desc: item.desc || defaultOptions[idx].desc,
        detailedPlan: item.detailedPlan || defaultOptions[idx].detailedPlan,
        bgColor: iconConfigs[idx].bgColor,
        iconType: iconConfigs[idx].iconType
      };
    });
  }, [guidance, defaultOptions]);

  const feedbackFeelings = [
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '🥺', label: 'Unsure' }
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'exchange':
        return <ArrowLeftRight size={24} className="text-white" />;
      case 'growth':
        return <TrendingUp size={24} className="text-white" />;
      case 'discount':
        return <Tag size={24} className="text-white" />;
      default:
        return <Sparkles size={24} className="text-white" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="pb-8"
    >
      {/* Header — Headline & Subtitle (Single back arrow & Sukoon title are in MobileContainer) */}
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-[#1A1A1A] tracking-tight leading-tight">
          Here are better ways to make this work
        </h1>
        <p className="text-[14px] text-[#999999] mt-2">
          Tap an option to see the expert implementation plan
        </p>
      </div>

      {/* Cards Section */}
      <div className="space-y-4 mb-6">
        {options.map((opt, i) => {
          const isSelected = selectedIdx === i;
          const isTopRec = i === 0;

          return (
            <div key={i} className="flex flex-col">
              {isTopRec && (
                <div className="flex items-center gap-1.5 mb-2.5 px-1">
                  <Sparkles size={14} className="text-[#15803d]" />
                  <span className="text-[12px] font-bold text-[#15803d] uppercase tracking-wider">
                    Top Recommendation
                  </span>
                </div>
              )}

              {/* Card Container */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' || e.key === ' ') { 
                    e.preventDefault(); 
                    setSelectedIdx(isSelected ? null : i); 
                  } 
                }}
                className="w-full bg-white rounded-[16px] border border-[#E0E0E0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:bg-[#FAFAFA] transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* Collapsed / Header Row */}
                <div className="flex items-center gap-4">
                  {/* 48px × 48px Colored Circle */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: opt.bgColor }}
                  >
                    {renderIcon(opt.iconType)}
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-semibold text-[#1A1A1A] text-[16px] leading-snug">
                      {opt.title}
                    </h3>
                    <p className="text-[14px] text-[#666666] mt-0.5 leading-normal">
                      {opt.desc}
                    </p>
                  </div>

                  {/* Chevron (Rotates from right to down) */}
                  <div className="shrink-0 text-gray-400">
                    <ChevronRight 
                      size={20} 
                      className={`transition-transform duration-200 ${isSelected ? 'rotate-90 text-[#1A1A1A]' : 'text-gray-400'}`} 
                    />
                  </div>
                </div>

                {/* Expanded Section (Dropdown inside the card) */}
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#E0E0E0] mt-4 pt-3.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={13} className="text-[#15803d]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Expert Implementation Plan
                          </span>
                        </div>
                        <p className="text-[14px] text-[#1A1A1A] leading-[1.6] whitespace-pre-line">
                          {opt.detailedPlan}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA: Still unsure? Talk to an expert (link style, blue) */}
      <div className="text-center py-2 mb-6">
        <span className="text-[14px] text-[#1A1A1A]">Still unsure? </span>
        <button
          type="button"
          onClick={onTalkToExpert}
          className="text-[14px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] underline underline-offset-4 cursor-pointer transition-colors ml-0.5"
        >
          Talk to an expert
        </button>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-[20px] p-5 border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center mb-6">
        {!feedbackSubmitted ? (
          <>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              How do you feel about this guidance?
            </p>
            <div className="flex justify-center items-center gap-3.5">
              {feedbackFeelings.map((opt, i) => {
                const isChosen = feedbackSelected === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeedbackSelected(i)}
                    className={`w-16 h-16 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isChosen
                        ? 'bg-gray-50 border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10 shadow-sm scale-105'
                        : 'bg-white border-[#E0E0E0] hover:border-gray-400 hover:scale-105'
                    }`}
                    aria-label={opt.label}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {feedbackSelected !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2.5 overflow-hidden"
                >
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you'd prefer or need clarity on..."
                    className="w-full p-3 bg-gray-50 border border-[#E0E0E0] rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] resize-none h-18 text-[#1A1A1A]"
                  />
                  <button
                    type="button"
                    onClick={() => setFeedbackSubmitted(true)}
                    className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="py-2 flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs">
            <CheckCircle2 size={16} />
            <span>Thank you for your feedback!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Screen5 = ({ data, guidance, onNext }: { data: FinancialData, guidance: DecisionResult | null, onNext: () => void, key?: string }) => {
  console.log("Rendering Screen5. Props:", { data, guidance });

  const [selectedExpert, setSelectedExpert] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'message' | 'schedule'>('message');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [expertResponse, setExpertResponse] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'expert', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');

  const experts = [
    { id: 1, name: 'Arjun Mehta', role: 'Senior Wealth Advisor', exp: '12+ years', rating: '4.9', specialty: 'Wealth Growth', color: 'bg-blue-100', iconColor: 'text-blue-600', bio: 'Specializes in long-term wealth creation and high-value purchase planning.' },
    { id: 2, name: 'Priya Sharma', role: 'Budgeting Coach', exp: '8+ years', rating: '4.8', specialty: 'Lifestyle Balance', color: 'bg-green-100', iconColor: 'text-green-600', bio: 'Expert in balancing immediate lifestyle desires with sustainable monthly budgeting.' },
    { id: 3, name: 'Vikram Singh', role: 'Investment Strategist', exp: '15+ years', rating: '5.0', specialty: 'Risk Management', color: 'bg-purple-100', iconColor: 'text-purple-600', bio: 'Focuses on minimizing financial risk and optimizing opportunity costs for large spends.' },
    { id: 4, name: 'Ananya Iyer', role: 'Debt Specialist', exp: '10+ years', rating: '4.7', specialty: 'EMI Optimization', color: 'bg-orange-100', iconColor: 'text-orange-600', bio: 'Helps optimize debt-to-income ratios and find the best financing options for your goals.' },
  ];

  const slots = [
    { time: 'Today • 6:00 PM' },
    { time: 'Tomorrow • 11:00 AM' },
    { time: 'Tomorrow • 7:30 PM' },
    { time: 'This Weekend • Flexible' }
  ];

  const summary = useMemo(() => {
    const itemName = data?.item || 'this item';
    const itemCat = data?.category ? ` (${data.category})` : '';
    const itemCost = data?.cost ? ` costing ₹${data.cost.toLocaleString('en-IN')}` : '';
    const priority = data?.priority ? `"${data.priority}"` : 'my financial comfort';
    const incomeStr = data?.income ? `₹${data.income.toLocaleString('en-IN')}` : '₹0';
    const expensesStr = data?.expenses ? `₹${data.expenses.toLocaleString('en-IN')}` : '₹0';
    const emiVal = data?.emiAmount || data?.emi;
    const emiStr = emiVal ? ` and EMIs of ₹${emiVal.toLocaleString('en-IN')}` : '';
    const decision = guidance?.decision || 'Safe';
    const reason = guidance?.explanation?.reasoning || guidance?.confidence?.explanation || guidance?.sharpInsight || "Evaluated by Sukoon AI";
    return `I am planning to buy a ${itemName}${itemCat}${itemCost}. My priority is to ${priority}. My monthly income is ${incomeStr} with expenses of ${expensesStr}${emiStr}. The AI guidance suggested "${decision}" because: ${reason}`;
  }, [data, guidance]);

  const handleSendMessage = () => {
    if (!userMessage.trim() && !summary) return;
    setMessageSent(true);
    setIsTyping(true);
    
    // Initialize chat with user's first message
    setChatMessages([{ role: 'user', text: userMessage || "Sent my financial summary for review." }]);

    // Simulate expert response after 2 seconds
    setTimeout(() => {
      const surplus = Math.max(
        0, 
        (data?.income || 0) - (data?.expenses || 0) - (data?.emiAmount || data?.emi || 0) - (data?.otherExpenses || 0)
      );
      const smarterTitle = guidance?.smarterOptions?.[0]?.title || "recommended plan";
      const response = `Hi! I've reviewed your ${data?.item || 'purchase'} plan. Given your ${data?.priority || 'comfortable'} priority and current ₹${surplus.toLocaleString('en-IN')} monthly surplus, I'd suggest looking into the "${smarterTitle}" option the AI mentioned. It aligns best with your long-term safety.`;
      setExpertResponse(response);
      setChatMessages(prev => [...prev, { role: 'expert', text: response }]);
      setIsTyping(false);
    }, 2000);
  };

  const handleFollowUp = () => {
    if (!followUpMessage.trim()) return;
    const msg = followUpMessage;
    setFollowUpMessage('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsTyping(true);

    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'expert', text: "That's a great question. Looking at your cash flow, if you wait for 2 more months, your safety net grows by 15%, making this purchase much more 'Comfortable' as per your goal." }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubscribe = () => {
    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribed(true);
      setIsSubscribing(false);
    }, 1500);
  };

  if (isConfirmed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <div className="w-20 h-20 bg-[#15803d] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#15803d]/20">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h2 className="text-[24px] font-bold text-[#1A1A1A] mb-2">Session Booked!</h2>
        <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
          Your session with <span className="font-bold text-[#1A1A1A]">{experts.find(e => e.id === selectedExpert)?.name}</span> for <span className="font-bold text-[#1A1A1A]">{slots[selectedSlot].time}</span> is confirmed. 
          Check your email for the invite.
        </p>
      </motion.div>
    );
  }

  if (selectedExpert !== null) {
    const expert = experts.find(e => e.id === selectedExpert)!;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
        <button onClick={() => setSelectedExpert(null)} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-[#1A1A1A] transition-colors">
          <ArrowLeft size={16} />
          <span className="text-[12px] font-bold uppercase tracking-widest">Back to Experts</span>
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className={`w-20 h-20 ${expert.color} rounded-3xl flex items-center justify-center shadow-sm`}>
            <UserCircle size={48} className={expert.iconColor} />
          </div>
          <div>
            <h2 className="text-[24px] font-bold text-[#1A1A1A]">{expert.name}</h2>
            <p className="text-[12px] text-gray-500 font-medium">{expert.role} • {expert.exp}</p>
            <div className="flex items-center gap-1 mt-1">
              <Sparkles size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[11px] font-bold text-[#1A1A1A]">{expert.rating} Rating</span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-[#F0F0F0] mb-8">
          <button 
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-4 text-[12px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'message' ? 'text-[#1A1A1A]' : 'text-gray-400'}`}
          >
            Message
            {activeTab === 'message' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />}
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-4 text-[12px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'schedule' ? 'text-[#1A1A1A]' : 'text-gray-400'}`}
          >
            Schedule
            {activeTab === 'schedule' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />}
          </button>
        </div>

        {activeTab === 'message' ? (
          <div className="space-y-6">
            {!messageSent ? (
              <>
                <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[#1A1A1A]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563]">Auto-Generated Summary</span>
                  </div>
                  <p className="text-[12px] text-gray-600 leading-relaxed italic">
                    "{summary}"
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider ml-1">Add your question (optional)</label>
                  <textarea 
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="e.g. Should I wait for the festive sale?"
                    className="w-full p-5 bg-white border border-[#E5E5E5] rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all min-h-[100px] resize-none"
                  />
                </div>
                <PrimaryButton onClick={handleSendMessage}>Send to Expert</PrimaryButton>
              </>
            ) : (
              <div className="space-y-6">
                {/* Chat History */}
                <div className="space-y-4">
                  <div className="flex flex-col items-end gap-2">
                    <div className="max-w-[85%] p-4 bg-[#1A1A1A] text-white rounded-2xl rounded-tr-none shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Initial Summary & Question</p>
                      <p className="text-[12px] leading-relaxed mb-2 opacity-80 italic">"{summary}"</p>
                      {userMessage && <p className="text-[13px] font-medium">{userMessage}</p>}
                    </div>
                  </div>

                  {chatMessages.slice(1).map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-[#1A1A1A] text-white rounded-tr-none' 
                          : 'bg-white border border-[#E5E7EB] rounded-tl-none'
                      }`}>
                        {msg.role === 'expert' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 ${expert.color} rounded-full flex items-center justify-center`}>
                              <UserCircle size={14} className={expert.iconColor} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">{expert.name}</span>
                          </div>
                        )}
                        <p className="text-[13px] leading-relaxed font-medium">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                      <span className="text-[12px] text-gray-500 font-medium">Expert is typing...</span>
                    </div>
                  )}
                </div>
                
                {expertResponse && !isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4">
                    {!isSubscribed ? (
                      <div className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <CreditCard size={80} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">Premium Access</span>
                          </div>
                          <h4 className="text-lg font-bold mb-2">Continue the conversation?</h4>
                          <p className="text-[12px] text-gray-300 mb-6 leading-relaxed">
                            Subscribe to <span className="text-white font-bold">Sukoon Plus</span> for unlimited 24/7 chat with {expert.name}.
                          </p>
                          <button 
                            onClick={handleSubscribe}
                            disabled={true}
                            className="w-full py-4 bg-white text-[#1A1A1A] rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed mb-3"
                          >
                            {isSubscribing ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <>
                                <CreditCard size={18} />
                                Subscribe for ₹499/mo
                              </>
                            )}
                          </button>
                          <p className="text-center text-[10px] font-bold text-yellow-400 uppercase tracking-widest opacity-80">
                            Premium access feature will be available soon
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-white border border-[#E5E7EB] rounded-3xl shadow-sm flex gap-3 items-end">
                          <textarea 
                            value={followUpMessage}
                            onChange={(e) => setFollowUpMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-2 text-sm focus:outline-none resize-none h-10"
                          />
                          <button 
                            onClick={handleFollowUp}
                            className="w-10 h-10 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors"
                          >
                            <MessageSquare size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expert Online</span>
                          </div>
                          <button onClick={onNext} className="text-[11px] font-bold text-[#1A1A1A] underline uppercase tracking-wider">
                            Done for now
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider">Available Slots</h4>
                {!isSubscribed && (
                  <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full uppercase tracking-widest">Premium Only</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {slots.map((slot, i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedSlot(i)}
                    disabled={!isSubscribed}
                    className={`w-full py-4 px-6 rounded-2xl border text-sm font-bold transition-all flex justify-between items-center ${
                      selectedSlot === i 
                        ? 'border-[#1A1A1A] bg-[#F9FAFB] text-[#1A1A1A] ring-4 ring-[#1A1A1A]/5' 
                        : 'border-[#F0F0F0] bg-white text-gray-600 hover:border-gray-300'
                    } ${!isSubscribed ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{slot.time}</span>
                      {!isSubscribed && <Clock size={14} className="text-gray-400" />}
                    </div>
                    {selectedSlot === i && isSubscribed && <CheckCircle2 size={16} className="text-[#1A1A1A]" />}
                  </button>
                ))}
              </div>
            </div>

            {!isSubscribed ? (
              <div className="p-6 bg-white border border-[#E5E7EB] rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Sparkles size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A]">Unlock Expert Scheduling</h4>
                    <p className="text-[11px] text-gray-500">Get priority access to {expert.name}</p>
                  </div>
                </div>
                <button 
                  onClick={handleSubscribe}
                  disabled={true}
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 mb-3 opacity-50 cursor-not-allowed"
                >
                  {isSubscribing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Subscribe for ₹499/mo
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Premium access feature will be available soon
                </p>
              </div>
            ) : (
              <PrimaryButton onClick={() => setIsConfirmed(true)}>Confirm Booking</PrimaryButton>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  if (!experts || experts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-center p-6">
        <Loader2 className="animate-spin text-[#15803d] mb-3" size={28} />
        <p className="text-sm text-gray-500 font-medium">Loading experts...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="pb-[120px] overflow-y-auto"
    >
      <h1 className="text-[28px] font-bold leading-tight mb-2 text-[#1A1A1A]">Talk to an expert</h1>
      <p className="text-[13px] text-gray-500 mb-8">Get personalized guidance from our top financial minds</p>

      <div className="p-6 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb size={18} className="text-[#1A1A1A]" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A1A1A]">Why talk to an expert?</span>
        </div>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          AI provides the data, but experts provide the context. A 15-min chat can save you months of financial stress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10">
        {experts.map((expert) => (
          <motion.button 
            key={expert.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedExpert(expert.id)}
            className="p-5 bg-white rounded-3xl border border-[#F0F0F0] flex gap-5 items-center shadow-sm text-left hover:border-[#1A1A1A] transition-all group cursor-pointer"
          >
            <div className={`w-16 h-16 ${expert.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
              <UserCircle size={36} className={expert.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-[#1A1A1A] text-base truncate">{expert.name}</h3>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg shrink-0">
                  <Sparkles size={10} className="text-yellow-600 fill-yellow-600" />
                  <span className="text-[10px] font-bold text-yellow-700">{expert.rating}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{expert.role} • {expert.exp}</p>
              <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">{expert.bio}</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#1A1A1A] transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      <button onClick={onNext} className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 transition-colors py-2 cursor-pointer">
        Skip for now
      </button>
    </motion.div>
  );
};


// --- Decision History Screen with Behavioral Insight ---
const HistoryScreen = ({ 
  history, 
  onView, 
  onDelete, 
  onClearAll 
}: { 
  history: HistoryItem[], 
  onView: (item: HistoryItem) => void, 
  onDelete: (id: string) => void, 
  onClearAll: () => void, 
  key?: string 
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Behavioral Insight calculations (shown only if >= 2 decisions)
  const patternStats = useMemo(() => {
    if (history.length < 2) return null;

    let goCount = 0;
    let cautionCount = 0;
    let waitCount = 0;
    let approvedSpend = 0;
    let avoidedSpend = 0;
    const flagCounts: Record<string, number> = {};

    history.forEach(item => {
      const d = item.guidance.decision;
      const norm = d === 'Safe' ? 'GO' : d === 'Wait' ? 'WAIT' : d === 'Caution' ? 'CAUTION' : d;
      const isOverridden = item.guidance.overridden;
      const cost = item.data.cost || 0;

      if (norm === 'GO' || isOverridden) {
        goCount++;
        approvedSpend += cost;
      } else if (norm === 'CAUTION') {
        cautionCount++;
        avoidedSpend += cost;
      } else if (norm === 'WAIT') {
        waitCount++;
        avoidedSpend += cost;
      }

      const flag = item.guidance.cautionFlag || 
        (norm === 'WAIT' ? 'Emergency safety net risk' : 'Discretionary buffer impact');
      if (flag) {
        flagCounts[flag] = (flagCounts[flag] || 0) + 1;
      }
    });

    let mostCommonFlag = "Discretionary buffer impact";
    let maxCount = 0;
    Object.entries(flagCounts).forEach(([flag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFlag = flag;
      }
    });

    return {
      total: history.length,
      goCount,
      cautionCount,
      waitCount,
      approvedSpend,
      avoidedSpend,
      mostCommonFlag
    };
  }, [history]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-1">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Decision History</h2>
          <p className="text-[13px] text-gray-500 font-medium">Your past financial guidance</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => setConfirmClearAll(true)}
            className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-3.5 py-2 rounded-xl hover:bg-red-100 transition-all border border-red-100"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Behavioral Insight Block — shown ONLY if user has 2 or more decisions */}
      {patternStats && (
        <div className="bg-gradient-to-br from-[#1C2230] via-[#121622] to-[#0A0D14] text-white p-5 rounded-[2rem] border border-white/10 shadow-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Behavioral Pattern
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-2">Your Decision Pattern</h3>
          
          <div className="space-y-2.5 text-xs text-gray-300">
            <p className="text-gray-200">
              You've checked <span className="font-bold text-emerald-400">{patternStats.total}</span> decisions.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                {patternStats.goCount} GO
              </span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                {patternStats.cautionCount} CAUTION
              </span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold">
                {patternStats.waitCount} WAIT
              </span>
            </div>
            
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase tracking-wider">Approved spend</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ₹{patternStats.approvedSpend.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase tracking-wider">Avoided spend</span>
                <span className="font-bold text-rose-400 text-sm">
                  ₹{patternStats.avoidedSpend.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px]">
              <span className="text-gray-400">Most common flag: </span>
              <span className="font-semibold text-amber-300">{patternStats.mostCommonFlag}</span>
            </div>
          </div>
        </div>
      )}

      {/* History Items List */}
      <div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <HistoryIcon size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold text-sm">No history yet</p>
            <p className="text-[12px] text-gray-400 px-8 mt-1 leading-relaxed">
              Your decisions will appear here once you complete an analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const d = item.guidance.decision;
              const verdictLabel = d === 'Safe' ? 'GO' : d === 'Wait' ? 'WAIT' : d === 'Caution' ? 'CAUTION' : d;
              const isOverridden = item.guidance.overridden;
              const color = verdictLabel === 'GO' ? '#15803d' : verdictLabel === 'CAUTION' ? '#d97706' : '#dc2626';

              return (
                <div 
                  key={item.id}
                  className="relative group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <button 
                    onClick={() => onView(item)}
                    className="w-full p-4 text-left pr-10 cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <h4 className="font-bold text-[#1A1A1A] text-sm truncate max-w-[170px]">
                          {item.data.item}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-[#1A1A1A]">
                        ₹{item.data.cost?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1.5">
                      <span className="font-bold uppercase tracking-wider" style={{ color }}>
                        {isOverridden ? 'OVERRIDDEN & GO' : verdictLabel}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>

                    <p className="text-[11px] text-gray-600 line-clamp-1 italic">
                      "{item.guidance.sharpInsight || item.guidance.synthesis}"
                    </p>
                  </button>

                  <button 
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="absolute top-3.5 right-3 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
              <p className="text-sm font-bold text-[#1A1A1A] mb-4">Delete this decision?</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {confirmClearAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
              <p className="text-sm font-bold text-[#1A1A1A] mb-4">Clear all decision history?</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { onClearAll(); setConfirmClearAll(false); }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setConfirmClearAll(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Follow-up 30-Day Screen (Outcome Tracker) ---
const FollowUpScreen = ({ 
  reminder, 
  onRespond 
}: { 
  reminder: FollowUpReminder, 
  onRespond: (outcome: 'Absolutely' | 'Mixed feelings' | 'Regret it') => void 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-between min-h-[580px] py-10 text-center"
    >
      <div className="pt-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm border border-emerald-100">
          <Clock size={32} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          30-Day Check-In
        </span>
        <p className="text-sm text-gray-500 mb-2">
          You decided to buy <strong className="text-[#1A1A1A]">{reminder.item}</strong> (₹{reminder.cost.toLocaleString('en-IN')}) 30 days ago.
        </p>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mt-2 mb-6 tracking-tight">
          Was it worth it?
        </h2>
      </div>

      <div className="w-full space-y-3 px-2">
        <button
          onClick={() => onRespond('Absolutely')}
          className="w-full py-4 px-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-bold text-sm hover:bg-emerald-100 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>😍 Absolutely</span>
        </button>
        <button
          onClick={() => onRespond('Mixed feelings')}
          className="w-full py-4 px-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl font-bold text-sm hover:bg-amber-100 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>😐 Mixed feelings</span>
        </button>
        <button
          onClick={() => onRespond('Regret it')}
          className="w-full py-4 px-6 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl font-bold text-sm hover:bg-rose-100 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>😔 Regret it</span>
        </button>
      </div>

      <p className="text-[11px] text-gray-400 max-w-xs">
        Your response is saved privately to help refine your future purchasing instincts.
      </p>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [history, setHistory] = useState<number[]>([0]);
  const currentScreen = history[history.length - 1];
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<DecisionResult | null>(null);
  const [apiError, setApiError] = useState(false);
  const [hasSeenAnalysis, setHasSeenAnalysis] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // 30-Day Check-in Prompt state on GO verdict exit
  const [show30DayPrompt, setShow30DayPrompt] = useState(false);
  const [pendingFollowUp, setPendingFollowUp] = useState<FollowUpReminder | null>(null);

  const [data, setData] = useState<FinancialData>({
    item: '',
    category: '',
    cost: null,
    priority: '',
    intent: 'Lifestyle Upgrade',
    urgency: 'Today',
    income: null,
    expenses: null,
    emi: null,
    otherExpenses: null,
    location: '',
    lifestyle: 'Moderate'
  });

  const [isLocating, setIsLocating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);

  const updateData = (newData: Partial<FinancialData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const [activeTab, setActiveTab] = useState('home');

  const [decisionHistory, setDecisionHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('sukoon_history_v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sukoon_history_v2', JSON.stringify(decisionHistory));
  }, [decisionHistory]);

  // Check for 30-day follow-up on app open
  useEffect(() => {
    try {
      const storedReminders = localStorage.getItem('sukoon_30day_reminders');
      if (storedReminders) {
        const reminders: FollowUpReminder[] = JSON.parse(storedReminders);
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const pending = reminders.find(r => !r.responded && (now - r.timestamp >= thirtyDaysMs));
        if (pending) {
          setPendingFollowUp(pending);
        }
      }
    } catch (e) {
      console.warn("Could not check 30-day reminders", e);
    }
  }, []);

  const handleRespondFollowUp = (outcome: 'Absolutely' | 'Mixed feelings' | 'Regret it') => {
    if (!pendingFollowUp) return;
    try {
      const storedReminders = localStorage.getItem('sukoon_30day_reminders');
      if (storedReminders) {
        const reminders: FollowUpReminder[] = JSON.parse(storedReminders);
        const updated = reminders.map(r => r.id === pendingFollowUp.id ? { ...r, responded: true, outcome } : r);
        localStorage.setItem('sukoon_30day_reminders', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Failed to save follow-up response", e);
    }
    setPendingFollowUp(null);
  };

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }
    setIsLocating(true);

    const tryIpFallback = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const resData = await res.json();
          if (resData.city && resData.country_name) {
            updateData({ location: `${resData.city}, ${resData.country_name}` });
            return;
          }
        }
      } catch {
        // Silently fallback
      }
      setData(prev => ({ ...prev, location: prev.location || 'Mumbai, India' }));
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (response.ok) {
            const resData = await response.json();
            const city = resData.address?.city || resData.address?.town || resData.address?.village || resData.address?.state || "Unknown City";
            const country = resData.address?.country || "India";
            updateData({ location: `${city}, ${country}` });
          } else {
            await tryIpFallback();
          }
        } catch {
          await tryIpFallback();
        } finally {
          setIsLocating(false);
        }
      },
      async () => {
        await tryIpFallback();
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const completeDecision = (overridden: boolean = false) => {
    if (!guidance) return;
    const finalGuidance = overridden ? { ...guidance, overridden: true } : guidance;
    const historyItem: HistoryItem = {
      id: Math.random().toString(36).substring(7),
      data,
      guidance: finalGuidance,
      timestamp: Date.now()
    };
    setDecisionHistory(prev => [historyItem, ...prev]);
    setHasSimulated(false);
  };

  const runAnalysis = async () => {
    setApiError(false);
    setGuidance(null);

    const totalExpenses = (data.expenses || 0) + (data.emi || 0) + (data.otherExpenses || 0);
    const expensesExceed = data.income !== null && totalExpenses > data.income;

    const stressedNote = expensesExceed 
      ? `Note: User's expenses (₹${totalExpenses.toLocaleString('en-IN')}) exceed their income (₹${(data.income || 0).toLocaleString('en-IN')}). This is a financially stressed situation. Weight the verdict accordingly.` 
      : undefined;

    try {
      const result = await getFinancialGuidance({
        item: data.item,
        category: data.category,
        cost: data.cost || 0,
        priority: data.priority || 'comfortable',
        income: data.income || 0,
        expenses: data.expenses || 0,
        emi: data.emi || 0,
        otherExpenses: data.otherExpenses || 0,
        location: data.location || 'India',
        lifestyle: data.lifestyle || 'Moderate',
        intent: data.intent || 'Lifestyle Upgrade',
        urgency: data.urgency || 'This Month',
        paymentMethod: data.paymentMethod,
        emiType: data.emiType,
        emiMonths: data.emiMonths,
        emiAmount: data.emiAmount,
        downPayment: data.downPayment,
        stressedSituationNote: stressedNote
      });
      setGuidance(result);
    } catch (err) {
      console.warn("Could not retrieve AI guidance:", err);
      setApiError(true);
    }
  };

  const nextScreen = async () => {
    if (currentScreen === 2) {
      setHasSeenAnalysis(false);
      setHasSimulated(true);
      setHistory(prev => [...prev, 3]);
      await runAnalysis();
    } else {
      setHistory(prev => [...prev, Math.min(currentScreen + 1, 6)]);
    }
  };

  const prevScreen = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      if (isViewingHistory && newHistory.length === 1 && newHistory[0] === 0) {
        setActiveTab('history');
        setIsViewingHistory(false);
        return;
      }
      setHistory(newHistory);
    }
  };

  const goToScreen = (index: number) => {
    setHistory(prev => [...prev, index]);
  };

  const resetApp = () => {
    setGuidance(null);
    setHasSeenAnalysis(false);
    setIsViewingHistory(false);
    setHasSimulated(false);
    setApiError(false);
    setHistory([0]);
    setData({
      item: '',
      category: '',
      cost: null,
      priority: '',
      intent: 'Lifestyle Upgrade',
      urgency: 'Today',
      income: null,
      expenses: null,
      emi: null,
      otherExpenses: null,
      location: '',
      lifestyle: 'Moderate'
    });
  };

  const handleOverrideAndGo = () => {
    completeDecision(true);
    resetApp();
  };

  const handleSave30DayReminder = (remind: boolean) => {
    if (remind && data.cost) {
      const reminder: FollowUpReminder = {
        id: Date.now().toString(),
        item: data.item,
        cost: data.cost,
        timestamp: Date.now(),
        responded: false
      };
      try {
        const stored = localStorage.getItem('sukoon_30day_reminders');
        const list: FollowUpReminder[] = stored ? JSON.parse(stored) : [];
        list.push(reminder);
        localStorage.setItem('sukoon_30day_reminders', JSON.stringify(list));
      } catch (e) {
        console.warn("Could not save reminder", e);
      }
    }
    setShow30DayPrompt(false);
    resetApp();
  };

  const viewHistoryItem = (item: HistoryItem) => {
    setData(item.data);
    setGuidance(item.guidance);
    setHasSeenAnalysis(true);
    setIsViewingHistory(true);
    setActiveTab('home');
    setHistory([0, 4]); // Directly show Verdict screen for past decision
  };

  const deleteHistoryItem = (id: string) => {
    setDecisionHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    setDecisionHistory([]);
  };

  const gradients = [
    'screen-gradient-beige', // Welcome
    'screen-gradient-green', // Screen1
    'screen-gradient-beige', // Screen2
    'screen-gradient-beige', // Loading
    'screen-gradient-green', // Screen3 Verdict
    'screen-gradient-beige', // Screen4 Smarter
    'screen-gradient-beige', // Screen5 Expert
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F6] font-sans selection:bg-[#1A1A1A]/10 flex items-center justify-center p-0 sm:p-10">
      <MobileContainer 
        gradientClass={activeTab === 'home' ? gradients[currentScreen] : 'screen-gradient-beige'} 
        onBack={(activeTab === 'home' && currentScreen > 0 && currentScreen !== 3) ? prevScreen : undefined}
        activeTab={activeTab}
        currentScreen={currentScreen}
        onTabChange={(tab) => {
          if (tab === 'home') {
            if (activeTab !== 'home') {
              setActiveTab('home');
              resetApp();
            }
          } else {
            setActiveTab('history');
          }
        }}
      >
        {/* If pending 30-day review exists on app open, show it first */}
        {pendingFollowUp ? (
          <FollowUpScreen 
            reminder={pendingFollowUp} 
            onRespond={handleRespondFollowUp} 
          />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <>
                {currentScreen === 0 && (
                  <WelcomeScreen key="welcome" onNext={() => { resetApp(); nextScreen(); }} />
                )}
                {currentScreen === 1 && (
                  <Screen1 key="s1" data={data} updateData={updateData} onNext={nextScreen} />
                )}
                {currentScreen === 2 && (
                  <Screen2 
                    key="s2" 
                    data={data} 
                    updateData={updateData} 
                    onNext={nextScreen}
                    loading={loading}
                    onDetectLocation={handleDetectLocation}
                    isLocating={isLocating}
                  />
                )}
                {currentScreen === 3 && (
                  <LoadingScreen 
                    key="loading" 
                    data={data} 
                    isGuidanceReady={!!guidance} 
                    alreadyCompleted={hasSeenAnalysis}
                    apiError={apiError}
                    onRetry={runAnalysis}
                    onComplete={() => { 
                      if (!guidance) {
                        setGuidance(getDefaultDecisionResult({
                          item: data.item,
                          category: data.category,
                          cost: data.cost || 0,
                          priority: data.priority || 'comfortable',
                          income: data.income || 0,
                          expenses: data.expenses || 0,
                          emi: data.emi || 0,
                          otherExpenses: data.otherExpenses || 0,
                          location: data.location || 'India',
                          lifestyle: data.lifestyle || 'Moderate',
                          intent: data.intent || 'Lifestyle Upgrade',
                          urgency: data.urgency || 'This Month',
                          paymentMethod: data.paymentMethod,
                          emiType: data.emiType,
                          emiMonths: data.emiMonths,
                          emiAmount: data.emiAmount,
                          downPayment: data.downPayment
                        }));
                      }
                      completeDecision(); 
                      setHasSeenAnalysis(true);
                      goToScreen(4); 
                    }}
                  />
                )}
                {currentScreen === 4 && (
                  <Screen3 
                    key="s3" 
                    data={data} 
                    guidance={guidance} 
                    onNext={nextScreen} 
                    onSmarter={() => goToScreen(5)} 
                    onTalkToExpert={() => goToScreen(6)}
                    onReset={resetApp}
                    onRequest30DayPrompt={() => setShow30DayPrompt(true)}
                    onOverrideAndGo={handleOverrideAndGo}
                  />
                )}
                {currentScreen === 5 && (
                  <Screen4 
                    key="s4" 
                    guidance={guidance} 
                    showAnimation={false}
                    onNext={nextScreen} 
                    onBack={prevScreen}
                    onDone={resetApp}
                    onTalkToExpert={() => goToScreen(6)}
                  />
                )}
                {currentScreen === 6 && (
                  <Screen5 
                    key="s5" 
                    data={data} 
                    guidance={guidance} 
                    onNext={resetApp} 
                  />
                )}
              </>
            )}

            {activeTab === 'history' && (
              <HistoryScreen 
                key="history" 
                history={decisionHistory} 
                onView={viewHistoryItem}
                onDelete={deleteHistoryItem}
                onClearAll={clearAllHistory}
              />
            )}
          </AnimatePresence>
        )}

        {/* 30-Day Check-in Prompt Dialog (Shown once on GO verdict exit) */}
        <AnimatePresence>
          {show30DayPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} />
                </div>
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2 leading-snug">
                  Want Sukoon to check in on this decision in 30 days?
                </h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  We'll do a quick 5-second check to see if "{data.item}" brought genuine peace of mind.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleSave30DayReminder(true)}
                    className="w-full py-3.5 bg-[#1A1A1A] text-white font-bold text-xs rounded-2xl hover:bg-black active:scale-98 transition-all shadow-md"
                  >
                    Yes, remind me
                  </button>
                  <button
                    onClick={() => handleSave30DayReminder(false)}
                    className="w-full py-3 bg-gray-100 text-gray-600 font-bold text-xs rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    No thanks
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </MobileContainer>
    </div>
  );
}
