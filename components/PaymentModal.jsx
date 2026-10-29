"use client";

import { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  QrCode,
  Building2,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import Modal from "@/components/Modal";

export default function PaymentModal({
  open,
  onClose,
  title = "Complete Payment",
  itemTitle,
  itemSubtitle,
  amount = 40,
  taxAmount = 0,
  onPaymentSuccess,
}) {
  const [activeTab, setActiveTab] = useState("card"); // 'card' | 'razorpay' | 'venue'
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState("");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardError, setCardError] = useState("");

  // Razorpay State
  const [razorpaySubTab, setRazorpaySubTab] = useState("upi"); // 'upi' | 'qr' | 'netbanking'
  const [upiId, setUpiId] = useState("athlete@okhdfcbank");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Format Card Number
  function handleCardNumberChange(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  }

  // Format Expiry
  function handleExpiryChange(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardExpiry(val);
  }

  // Detect Card Brand
  function getCardBrand() {
    const raw = cardNumber.replace(/\s/g, "");
    if (raw.startsWith("4")) return "VISA";
    if (raw.startsWith("51") || raw.startsWith("52") || raw.startsWith("53") || raw.startsWith("54") || raw.startsWith("55")) return "MASTERCARD";
    if (raw.startsWith("34") || raw.startsWith("37")) return "AMEX";
    if (raw.startsWith("60") || raw.startsWith("65") || raw.startsWith("81") || raw.startsWith("82")) return "RUPAY";
    return "CARD";
  }

  // Submit Card Payment
  async function handleCardPay(e) {
    e.preventDefault();
    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 15) {
      setCardError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setCardError("Please enter card expiry in MM/YY format.");
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setCardError("Please enter a valid 3 or 4 digit CVV/CVC.");
      return;
    }
    setCardError("");
    setProcessing(true);
    setProcessStep("Encrypting payment payload with 256-bit SSL...");

    await new Promise((r) => setTimeout(r, 700));
    setProcessStep("Authorizing transaction with card issuer...");
    await new Promise((r) => setTimeout(r, 800));

    const cardBrand = getCardBrand();
    const last4 = rawNum.slice(-4);
    const paymentId = `pay_card_${Date.now().toString(36)}_${last4}`;

    setProcessing(false);
    onPaymentSuccess({
      method: "Card",
      paymentId,
      cardBrand,
      cardLast4: last4,
      cardholderName: cardHolder || "Athlete Member",
      paidAt: new Date().toISOString(),
    });
  }

  // Submit Razorpay Payment
  async function handleRazorpayPay() {
    setProcessing(true);
    setProcessStep("Initializing Razorpay Secure Gateway...");
    await new Promise((r) => setTimeout(r, 600));

    setProcessStep(
      razorpaySubTab === "upi"
        ? `Requesting UPI mandate from ${upiId || "UPI network"}...`
        : razorpaySubTab === "qr"
        ? "Verifying dynamic QR scan payment..."
        : `Connecting to ${selectedBank} secure gateway...`
    );
    await new Promise((r) => setTimeout(r, 900));

    setProcessStep("Payment verified by Razorpay! Capturing order...");
    await new Promise((r) => setTimeout(r, 500));

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const razorpayPaymentId = `pay_${randomSuffix}${Date.now().toString(36)}`;
    const razorpayOrderId = `order_${randomSuffix}`;

    setProcessing(false);
    onPaymentSuccess({
      method: "Razorpay",
      paymentId: razorpayPaymentId,
      razorpayPaymentId,
      razorpayOrderId,
      upiId: razorpaySubTab === "upi" ? upiId : undefined,
      bank: razorpaySubTab === "netbanking" ? selectedBank : undefined,
      paidAt: new Date().toISOString(),
    });
  }

  // Pay at Venue
  function handlePayAtVenue() {
    onPaymentSuccess({
      method: "Pay at Venue",
      paymentId: `venue_hold_${Date.now().toString(36)}`,
      paidAt: null,
    });
  }

  const grandTotal = amount + taxAmount;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5 text-slate-200">
        {/* Order Summary Header */}
        <div className="rounded-2xl border border-slate-800 bg-dark-900/90 p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
                Reservation Item
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {itemTitle || "Sports Facility Session"}
              </h3>
              {itemSubtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{itemSubtitle}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Due</span>
              <div className="text-xl sm:text-2xl font-black text-primary-400">
                ${grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Switcher Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                activeTab === "card"
                  ? "bg-primary-400/15 border-primary-400 text-primary-300 shadow-glow-sm"
                  : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <CreditCard size={18} className="mb-1" />
              <span>Credit / Debit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("razorpay")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                activeTab === "razorpay"
                  ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-glow-cyan"
                  : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Smartphone size={18} className="mb-1" />
              <span>Razorpay / UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("venue")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                activeTab === "venue"
                  ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-glow-amber"
                  : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Building2 size={18} className="mb-1" />
              <span>Pay at Venue</span>
            </button>
          </div>
        </div>

        {/* Processing Loading Overlay */}
        {processing && (
          <div className="rounded-2xl border border-primary-400/40 bg-dark-950/95 p-8 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Processing Secure Payment</h4>
            <p className="text-xs text-primary-300 font-medium animate-pulse">{processStep}</p>
            <p className="text-[11px] text-slate-500">Do not refresh or close this window.</p>
          </div>
        )}

        {/* Tab 1: Credit / Debit Card Form */}
        {!processing && activeTab === "card" && (
          <form onSubmit={handleCardPay} className="space-y-4">
            {/* Visual Credit Card Preview */}
            <div className="credit-card-gradient rounded-2xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-9 rounded bg-amber-400/80 flex items-center justify-center text-[10px] font-bold text-dark-950 shadow-sm">
                    CHIP
                  </div>
                  <Lock size={13} className="text-slate-400" />
                </div>
                <span className="font-mono text-xs font-extrabold tracking-wider text-primary-300 bg-white/10 px-2 py-0.5 rounded">
                  {getCardBrand()}
                </span>
              </div>

              <div className="font-mono text-base sm:text-lg tracking-widest text-slate-100 mb-4">
                {cardNumber || "•••• •••• •••• ••••"}
              </div>

              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                    Cardholder
                  </span>
                  <span className="font-semibold uppercase tracking-wide truncate block max-w-[150px]">
                    {cardHolder || "ATHLETE NAME"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block text-right">
                    Expires
                  </span>
                  <span className="font-mono font-semibold">{cardExpiry || "MM/YY"}</span>
                </div>
              </div>
            </div>

            {cardError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                <AlertCircle size={14} className="shrink-0" />
                <span>{cardError}</span>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono outline-none focus:border-primary-400"
                    required
                  />
                  <CreditCard
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full rounded-xl border border-slate-700 bg-dark-900 px-2.5 py-2 text-xs text-white placeholder-slate-500 font-mono text-center outline-none focus:border-primary-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full rounded-xl border border-slate-700 bg-dark-900 px-2.5 py-2 text-xs text-white placeholder-slate-500 font-mono text-center outline-none focus:border-primary-400"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-primary-400" />
                256-Bit SSL Encrypted
              </span>
              <span>PCI-DSS Level 1 Compliant</span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-3 text-sm font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
            >
              <Lock size={15} />
              <span>Pay ${grandTotal.toFixed(2)} & Reserve</span>
            </button>
          </form>
        )}

        {/* Tab 2: Razorpay Gateway Simulator */}
        {!processing && activeTab === "razorpay" && (
          <div className="space-y-4">
            {/* Razorpay Brand Header */}
            <div className="razorpay-gradient rounded-2xl p-4 border border-cyan-500/30 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black text-sm">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm tracking-wide text-white">Razorpay</span>
                    <span className="rounded bg-cyan-400/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300 uppercase">
                      Trusted Gateway
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Fast UPI, Netbanking & QR Checkout</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Order Amount</span>
                <div className="text-base font-bold text-cyan-300">${grandTotal.toFixed(2)}</div>
              </div>
            </div>

            {/* Razorpay Sub-methods */}
            <div className="flex border-b border-slate-800 text-xs">
              {[
                { id: "upi", label: "UPI Apps", icon: Smartphone },
                { id: "qr", label: "Scan QR", icon: QrCode },
                { id: "netbanking", label: "NetBanking", icon: Building2 },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRazorpaySubTab(m.id)}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-semibold transition border-b-2 ${
                      razorpaySubTab === m.id
                        ? "border-cyan-400 text-cyan-400"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* UPI Tab */}
            {razorpaySubTab === "upi" && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  {["Google Pay", "PhonePe", "Paytm", "BHIM UPI"].map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setUpiId(`${app.toLowerCase().replace(/\s/g, "")}@upi`)}
                      className="p-2 rounded-xl border border-slate-800 bg-dark-900 hover:border-cyan-400/40 hover:bg-dark-800 transition"
                    >
                      <span className="font-bold text-white block">{app}</span>
                      <span className="text-[9px] text-primary-400">Instant</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Or Enter Any UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    A payment mandate prompt will be pushed to your UPI mobile app.
                  </p>
                </div>
              </div>
            )}

            {/* QR Code Tab */}
            {razorpaySubTab === "qr" && (
              <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 text-center space-y-3">
                <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
                  {/* Dynamic simulated QR graphic */}
                  <div className="h-36 w-36 bg-slate-900 rounded-lg p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="h-9 w-9 bg-cyan-400 rounded-sm"></div>
                      <div className="h-9 w-9 bg-cyan-400 rounded-sm"></div>
                    </div>
                    <div className="text-[9px] font-mono text-cyan-300 font-bold tracking-tight">
                      RAZORPAY CAD PAY
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="h-9 w-9 bg-cyan-400 rounded-sm"></div>
                      <div className="h-5 w-5 bg-white rounded-full mx-auto"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Scan with GPay, PhonePe or Paytm</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Point your camera or UPI scanner to pay ${grandTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* NetBanking Tab */}
            {razorpaySubTab === "netbanking" && (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Choose Bank
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank", "Punjab National Bank"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2 rounded-xl border text-xs font-semibold truncate transition ${
                        selectedBank === b
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-300"
                          : "border-slate-800 bg-dark-900 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleRazorpayPay}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-bold text-dark-950 hover:bg-cyan-300 transition shadow-glow-cyan"
            >
              <span>Pay ${grandTotal.toFixed(2)} via Razorpay</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Tab 3: Pay at Venue */}
        {!processing && activeTab === "venue" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                <Building2 size={16} /> Pay upon Check-In at Venue Desk
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                You can reserve this court or gear without upfront online payment. Settle your fee with cash, card, or UPI directly at the venue reception when checking in.
              </p>
              <div className="rounded-xl bg-dark-950/80 p-3 border border-amber-500/20 space-y-1 text-[11px] text-amber-200/90">
                <p>• Your slot is reserved and guaranteed under your name.</p>
                <p>• Please arrive at least 10 minutes before your scheduled start time.</p>
                <p>• Unclaimed slots after 15 minutes may be released to the waitlist queue.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayAtVenue}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-dark-950 hover:bg-amber-300 transition shadow-glow-amber"
            >
              <CheckCircle2 size={16} />
              <span>Confirm Reservation (Pay at Venue)</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

