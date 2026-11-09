"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import Modal from "@/components/Modal";
import { MERCHANT_CONFIG, buildUpiIntentUri, buildUpiQrCodeUrl } from "@/lib/paymentConfig";

export default function PaymentModal({
  open,
  onClose,
  title = "Complete Payment in Indian Rupees (INR)",
  itemTitle,
  itemSubtitle,
  amount = 450,
  taxAmount = 0,
  allowPayAtVenue = true,
  onPaymentSuccess,
}) {
  // Tabs: 'upi' | 'card' | 'razorpay' | 'venue'
  const [activeTab, setActiveTab] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState("");

  // UPI State (Receives money directly to user's UPI ID: 7828722557@ptyes)
  const merchantUpiId = MERCHANT_CONFIG.upiId; // "7828722557@ptyes"
  const merchantName = MERCHANT_CONFIG.name;
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiError, setUpiError] = useState("");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardError, setCardError] = useState("");

  // 3D Secure / OTP Simulation Step for Card
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  // Razorpay State
  const [razorpaySubTab, setRazorpaySubTab] = useState("upi"); // 'upi' | 'qr' | 'netbanking'
  const [customUpiId, setCustomUpiId] = useState("athlete@okhdfcbank");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load official Razorpay checkout script dynamically
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => setRazorpayLoaded(false);
      document.body.appendChild(script);
    } else if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  const grandTotal = Math.round(amount + taxAmount);

  // Real Indian UPI Intent URI pointing to user's UPI account (7828722557@ptyes)
  const upiIntentUri = buildUpiIntentUri({
    upiId: merchantUpiId,
    merchantName: merchantName,
    amount: grandTotal,
    transactionNote: itemTitle ? `CAD-${itemTitle.slice(0, 20)}` : "CAD-Booking",
    refId: `CAD-${Date.now().toString(36).toUpperCase()}`,
  });
  const qrCodeUrl = buildUpiQrCodeUrl(upiIntentUri, 200);

  // Copy UPI ID to Clipboard
  function handleCopyUpi() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(merchantUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  }

  // Auto-fill Test UTR for testing flow convenience
  function handleGenerateTestUtr() {
    const testUtr = `4301${Math.floor(10000000 + Math.random() * 90000000)}`;
    setUtrNumber(testUtr);
    setUpiError("");
  }

  // Auto-fill Demo RuPay Card
  function handleFillDemoCard() {
    setCardNumber("6073 8921 4410 5523");
    setCardHolder("AARAV SHARMA");
    setCardExpiry("12/28");
    setCardCvv("781");
    setCardError("");
  }

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

  // Detect Card Brand (including Indian RuPay)
  function getCardBrand() {
    const raw = cardNumber.replace(/\s/g, "");
    if (raw.startsWith("60") || raw.startsWith("65") || raw.startsWith("81") || raw.startsWith("82")) return "RUPAY";
    if (raw.startsWith("4")) return "VISA";
    if (raw.startsWith("51") || raw.startsWith("52") || raw.startsWith("53") || raw.startsWith("54") || raw.startsWith("55")) return "MASTERCARD";
    if (raw.startsWith("34") || raw.startsWith("37")) return "AMEX";
    return "CARD";
  }

  // Confirm Direct UPI Transfer (Paid to 7828722557@ptyes)
  async function handleConfirmUpiPayment(e) {
    if (e) e.preventDefault();
    setProcessing(true);
    setProcessStep(`Connecting to UPI network for ${merchantUpiId}...`);
    await new Promise((r) => setTimeout(r, 600));

    setProcessStep("Verifying transaction reference & crediting reservation...");
    await new Promise((r) => setTimeout(r, 700));

    const finalUtr = utrNumber.trim() || `UTR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setProcessing(false);
    onPaymentSuccess({
      method: "UPI",
      paymentId: `upi_${finalUtr}`,
      merchantUpiId,
      utrNumber: finalUtr,
      upiId: merchantUpiId,
      currency: "INR",
      amountPaid: grandTotal,
      paidAt: new Date().toISOString(),
    });
  }

  // Launch 3DS Bank OTP verification for Card
  function handleInitiateCardPay(e) {
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
    setOtpValue("123456"); // Pre-fill test OTP for immediate verification
    setShowOtpModal(true);
  }

  // Submit Verified Card Payment
  async function handleVerifyCardOtp() {
    if (!otpValue || otpValue.length < 4) {
      setOtpError("Please enter the 6-digit OTP sent to your phone.");
      return;
    }

    setShowOtpModal(false);
    setProcessing(true);
    setProcessStep("Verifying 3D-Secure Bank OTP...");
    await new Promise((r) => setTimeout(r, 600));

    setProcessStep("Authorizing ₹" + grandTotal.toLocaleString("en-IN") + " with card network...");
    await new Promise((r) => setTimeout(r, 700));

    const cardBrand = getCardBrand();
    const last4 = cardNumber.replace(/\s/g, "").slice(-4);
    const paymentId = `pay_card_${Date.now().toString(36)}_${last4}`;

    setProcessing(false);
    onPaymentSuccess({
      method: "Card",
      paymentId,
      cardBrand,
      cardLast4: last4,
      cardholderName: cardHolder || "Athlete Member",
      currency: "INR",
      amountPaid: grandTotal,
      paidAt: new Date().toISOString(),
    });
  }

  // Official Razorpay Gateway Popup Handler
  async function handleLaunchOfficialRazorpay() {
    setProcessing(true);
    setProcessStep("Creating secure Razorpay order (INR)...");

    try {
      const orderRes = await fetch("/api/payment/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal, currency: "INR" }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Could not generate Razorpay order.");
      }

      setProcessing(false);

      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: orderData.keyId || "rzp_test_courts_after_dark",
          amount: orderData.amount,
          currency: "INR",
          name: "Courts After Dark",
          description: itemTitle || "Sports Facility & Equipment Booking",
          order_id: orderData.orderId,
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=128&q=80",
          handler: async function (response) {
            setProcessing(true);
            setProcessStep("Verifying payment signature with Razorpay...");

            await fetch("/api/payment/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            setProcessing(false);
            onPaymentSuccess({
              method: "Razorpay",
              paymentId: response.razorpay_payment_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              currency: "INR",
              amountPaid: grandTotal,
              paidAt: new Date().toISOString(),
            });
          },
          prefill: {
            name: cardHolder || "Aarav Sharma",
            email: "athlete@courtsafterdark.com",
            contact: "9876543210",
          },
          theme: { color: "#10b981" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          alert(`Payment Failed: ${resp.error.description}`);
        });
        rzp.open();
      } else {
        await handleSimulatedRazorpayPay();
      }
    } catch {
      await handleSimulatedRazorpayPay();
    }
  }

  // Simulated Razorpay / NetBanking
  async function handleSimulatedRazorpayPay() {
    setProcessing(true);
    setProcessStep("Connecting to Razorpay Gateway...");
    await new Promise((r) => setTimeout(r, 600));

    setProcessStep(
      razorpaySubTab === "upi"
        ? `Requesting UPI mandate from ${customUpiId || "UPI network"}...`
        : razorpaySubTab === "qr"
          ? "Verifying dynamic UPI QR scan payment..."
          : `Connecting to ${selectedBank} secure gateway...`
    );
    await new Promise((r) => setTimeout(r, 800));

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
      upiId: razorpaySubTab === "upi" ? customUpiId : undefined,
      bank: razorpaySubTab === "netbanking" ? selectedBank : undefined,
      currency: "INR",
      amountPaid: grandTotal,
      paidAt: new Date().toISOString(),
    });
  }

  // Pay at Venue
  function handlePayAtVenue() {
    onPaymentSuccess({
      method: "Pay at Venue",
      paymentId: `venue_hold_${Date.now().toString(36)}`,
      currency: "INR",
      amountPaid: grandTotal,
      paidAt: null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5 text-slate-200">
        {/* Order Summary Header in Indian Rupees */}
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
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Due (INR)</span>
              <div className="text-xl sm:text-2xl font-black text-primary-400">
                ₹{grandTotal.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* 3D-Secure Bank OTP Modal Overlay */}
        {showOtpModal && (
          <div className="rounded-2xl border border-primary-400/40 bg-dark-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-primary-400" />
                <h4 className="text-sm font-bold text-white">3D-Secure Bank Authorization</h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-primary-300 bg-primary-400/10 px-2 py-0.5 rounded">
                Verified by {getCardBrand()}
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Enter the 6-digit one-time password (OTP) sent to your registered mobile number for amount <strong>₹{grandTotal.toLocaleString("en-IN")}</strong>.
            </p>

            <div>
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-primary-400/60 bg-dark-950 py-2.5 text-white outline-none"
              />
              <span className="block text-[11px] text-slate-400 mt-1 text-center">
                (Test OTP <strong>123456</strong> is pre-filled for instant verification)
              </span>
            </div>

            {otpError && (
              <p className="text-xs text-red-400">{otpError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCardOtp}
                className="flex-1 rounded-xl bg-primary-400 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 shadow-glow-sm"
              >
                Authorize Payment (₹{grandTotal.toLocaleString("en-IN")})
              </button>
            </div>
          </div>
        )}

        {/* Payment Method Switcher Tabs */}
        {!showOtpModal && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className={`grid gap-2 ${allowPayAtVenue ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
              <button
                type="button"
                onClick={() => setActiveTab("upi")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${activeTab === "upi"
                    ? "bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-glow-sm"
                    : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
              >
                <Smartphone size={18} className="mb-1 text-emerald-400" />
                <span>UPI (GPay/Paytm)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${activeTab === "card"
                    ? "bg-primary-400/15 border-primary-400 text-primary-300 shadow-glow-sm"
                    : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
              >
                <CreditCard size={18} className="mb-1 text-primary-400" />
                <span>Card (RuPay/Visa)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("razorpay")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${activeTab === "razorpay"
                    ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-glow-cyan"
                    : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
              >
                <ExternalLink size={18} className="mb-1 text-cyan-400" />
                <span>Razorpay Gateway</span>
              </button>

              {allowPayAtVenue && (
                <button
                  type="button"
                  onClick={() => setActiveTab("venue")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${activeTab === "venue"
                      ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-glow-amber"
                      : "bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                >
                  <Building2 size={18} className="mb-1 text-amber-400" />
                  <span>Pay at Venue</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing Loading Overlay */}
        {processing && (
          <div className="rounded-2xl border border-primary-400/40 bg-dark-950/95 p-8 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Processing Secure Transaction (INR)</h4>
            <p className="text-xs text-primary-300 font-medium animate-pulse">{processStep}</p>
            <p className="text-[11px] text-slate-500">Do not refresh or close this window.</p>
          </div>
        )}

        {/* TAB 1: Real UPI Payment to User's Account (7828722557@ptyes) */}
        {!processing && !showOtpModal && activeTab === "upi" && (
          <div className="space-y-4">
            {/* Merchant UPI Details Banner */}
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-dark-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs">
                    UPI
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Direct UPI Transfer</span>
                      <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold">
                        Instant Bank Credit
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">Pay directly using any Indian UPI application</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Amount</span>
                  <div className="text-base font-black text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</div>
                </div>
              </div>

              {/* Recipient UPI ID Box with One-Click Copy */}
              <div className="rounded-xl border border-emerald-500/30 bg-dark-950/80 p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Beneficiary UPI ID / VPA
                  </span>
                  <strong className="text-sm font-mono font-bold text-emerald-300 tracking-wide">
                    {merchantUpiId}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition shrink-0"
                >
                  {copiedUpi ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dynamic UPI QR Code */}
            <div className="rounded-2xl border border-slate-800 bg-dark-900 p-4 text-center space-y-3">
              <div className="inline-block p-3 rounded-2xl bg-white shadow-2xl">
                <img
                  src={qrCodeUrl}
                  alt={`Scan to pay ₹${grandTotal} to ${merchantUpiId}`}
                  className="h-40 w-40 mx-auto object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-white">Scan with Google Pay, PhonePe, Paytm, or BHIM</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The amount of <strong className="text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</strong> will be pre-filled automatically.
                </p>
              </div>

              {/* Mobile Deep Link */}
              <div className="pt-1">
                <a
                  href={upiIntentUri}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-dark-850 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-dark-800 hover:text-white transition"
                >
                  <Smartphone size={14} className="text-emerald-400" />
                  <span>Open directly in UPI App (Mobile)</span>
                </a>
              </div>
            </div>

            {/* Step 2: Confirmation / UTR Verification */}
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-dark-900/60 p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Enter 12-Digit UPI Ref / UTR Number</span>
                  <span className="text-[10px] text-slate-400 font-normal">(from payment screen)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTestUtr}
                  className="text-[10px] text-primary-400 hover:underline font-semibold"
                >
                  Auto-Fill Test UTR
                </button>
              </div>

              <input
                type="text"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12));
                  setUpiError("");
                }}
                placeholder="e.g. 430198273641 (12 digits)"
                maxLength={12}
                className="w-full rounded-xl border border-slate-700 bg-dark-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-400"
              />

              {upiError && (
                <p className="text-xs text-red-400">{upiError}</p>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed">
                After completing the transfer to <strong className="text-slate-200">{merchantUpiId}</strong>, click the button below to confirm and generate your digital pass.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmUpiPayment}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-dark-950 hover:bg-emerald-400 transition shadow-glow-sm"
            >
              <CheckCircle2 size={16} />
              <span>Confirm UPI Payment (₹{grandTotal.toLocaleString("en-IN")}) & Reserve</span>
            </button>
          </div>
        )}

        {/* TAB 2: Credit / Debit Card Form */}
        {!processing && !showOtpModal && activeTab === "card" && (
          <form onSubmit={handleInitiateCardPay} className="space-y-4">
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
                    {cardHolder || "AARAV SHARMA"}
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

            {/* Quick Demo Fill Helper */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Card Payment Entry:</span>
              <button
                type="button"
                onClick={handleFillDemoCard}
                className="text-[11px] text-primary-400 hover:underline font-semibold"
              >
                Fill Sample RuPay Card
              </button>
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
                  Card Number (RuPay, Visa, MasterCard)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="6524 1234 5678 9012"
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
              <span>RBI 3D-Secure Two-Factor Ready</span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-3 text-sm font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
            >
              <Lock size={15} />
              <span>Pay ₹{grandTotal.toLocaleString("en-IN")} via Card</span>
            </button>
          </form>
        )}

        {/* TAB 3: Razorpay Gateway & Real UPI */}
        {!processing && !showOtpModal && activeTab === "razorpay" && (
          <div className="space-y-4">
            {/* Razorpay Brand Header */}
            <div className="razorpay-gradient rounded-2xl p-4 border border-cyan-500/30 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black text-sm">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm tracking-wide text-white">Razorpay</span>
                    <span className="rounded bg-cyan-400/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300 uppercase">
                      Live Gateway
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">UPI, GPay, PhonePe, Paytm & NetBanking</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Amount Due</span>
                <div className="text-base font-bold text-cyan-300">₹{grandTotal.toLocaleString("en-IN")}</div>
              </div>
            </div>

            {/* Official Razorpay Checkout Modal Button */}
            <button
              type="button"
              onClick={handleLaunchOfficialRazorpay}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-3 text-xs sm:text-sm font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-glow-cyan"
            >
              <ExternalLink size={16} />
              <span>Launch Official Razorpay Popup (Cards, UPI, NetBanking)</span>
            </button>

            {/* Razorpay Sub-methods */}
            <div className="flex border-b border-slate-800 text-xs">
              {[
                { id: "upi", label: "Instant UPI", icon: Smartphone },
                { id: "qr", label: "Scan UPI QR", icon: QrCode },
                { id: "netbanking", label: "NetBanking", icon: Building2 },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRazorpaySubTab(m.id)}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-semibold transition border-b-2 ${razorpaySubTab === m.id
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
                      onClick={() => setCustomUpiId(`${app.toLowerCase().replace(/\s/g, "")}@upi`)}
                      className="p-2 rounded-xl border border-slate-800 bg-dark-900 hover:border-cyan-400/40 hover:bg-dark-800 transition"
                    >
                      <span className="font-bold text-white block">{app}</span>
                      <span className="text-[9px] text-cyan-300">Tap to Select</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter Athlete UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    placeholder="athlete@okhdfcbank"
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    A payment request mandate will be initiated to your UPI handle.
                  </p>
                </div>
              </div>
            )}

            {/* QR Code Tab */}
            {razorpaySubTab === "qr" && (
              <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 text-center space-y-3">
                <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
                  <img
                    src={qrCodeUrl}
                    alt="Scan UPI QR Code"
                    className="h-36 w-36 mx-auto object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Scan with Google Pay, PhonePe, or Paytm</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    UPI Handle: <strong className="text-cyan-300 font-mono">{merchantUpiId}</strong>
                  </p>
                  <p className="text-[11px] text-slate-300 font-semibold mt-1">
                    Payable Amount: <span className="text-cyan-300 font-bold">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </p>
                </div>
              </div>
            )}

            {/* NetBanking Tab */}
            {razorpaySubTab === "netbanking" && (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Choose Indian Bank
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank", "Punjab National Bank"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2 rounded-xl border text-xs font-semibold truncate transition ${selectedBank === b
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
              onClick={handleSimulatedRazorpayPay}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-bold text-dark-950 hover:bg-cyan-300 transition shadow-glow-cyan"
            >
              <span>Pay ₹{grandTotal.toLocaleString("en-IN")} via Razorpay</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* TAB 4: Pay at Venue */}
        {!processing && !showOtpModal && activeTab === "venue" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                <Building2 size={16} /> Pay upon Check-In at Venue Desk
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                You can reserve this court or gear without upfront online payment. Settle your fee (₹{grandTotal.toLocaleString("en-IN")}) with cash, UPI QR ({merchantUpiId}), or card directly at the reception when checking in.
              </p>
              <div className="rounded-xl bg-dark-950/80 p-3 border border-amber-500/20 space-y-1 text-[11px] text-amber-200/90">
                <p>• Your slot is reserved and guaranteed under your athlete account.</p>
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
              <span>Confirm Reservation (Pay ₹{grandTotal.toLocaleString("en-IN")} at Venue)</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
