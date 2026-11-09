"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Shield,
  Sparkles,
  Info,
  Calendar,
  CreditCard,
  User,
  ArrowRight,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import PaymentModal from "@/components/PaymentModal";

const INITIAL_PLANS = [
  {
    _id: "plan_badminton_2026",
    sportCategory: "Badminton",
    sessionYear: "2026-27",
    description: "Access to 12 indoor synthetic badminton courts at Shanti Devi Mittal Complex.",
    hostellerEdbFee: 4500,
    hostellerRegularFee: 5500,
    dayScholarFee: 7500,
    isSwimmingPlan: false,
    isActive: true,
  },
  {
    _id: "plan_gym_2026",
    sportCategory: "Gymnasium",
    sessionYear: "2026-27",
    description: "Unlimited workout access to LPU Fitness Centre / Fitness Edge.",
    hostellerEdbFee: 5000,
    hostellerRegularFee: 6000,
    dayScholarFee: 8000,
    isSwimmingPlan: false,
    isActive: true,
  },
  {
    _id: "plan_basketball_2026",
    sportCategory: "Basketball",
    sessionYear: "2026-27",
    description: "Access to 8 outdoor and 1 indoor basketball courts with floodlights.",
    hostellerEdbFee: 3500,
    hostellerRegularFee: 4500,
    dayScholarFee: 6000,
    isSwimmingPlan: false,
    isActive: true,
  },
  {
    _id: "plan_volleyball_2026",
    sportCategory: "Volleyball",
    sessionYear: "2026-27",
    description: "Access to 3 indoor and 6 outdoor volleyball courts with tournament nets.",
    hostellerEdbFee: 3000,
    hostellerRegularFee: 4000,
    dayScholarFee: 5500,
    isSwimmingPlan: false,
    isActive: true,
  },
  {
    _id: "plan_lawn_tennis_2026",
    sportCategory: "Lawn Tennis",
    sessionYear: "2026-27",
    description: "Access to synthetic floodlit lawn tennis courts with coach assistance.",
    hostellerEdbFee: 4000,
    hostellerRegularFee: 5000,
    dayScholarFee: 7000,
    isSwimmingPlan: false,
    isActive: true,
  },
  {
    _id: "plan_swimming_2026",
    sportCategory: "Swimming (Olympic Pool)",
    sessionYear: "2026-27",
    description: "All-weather Olympic 50m pool & warm-up pool with certified lifeguards.",
    isSwimmingPlan: true,
    hourlyRateHosteller: 50,
    hourlyRateDayScholar: 100,
    monthlyRateHosteller: 750,
    monthlyRateDayScholar: 1000,
    semesterRateHosteller: 2000,
    semesterRateDayScholar: 3000,
    hostellerRegularFee: 3500,
    dayScholarFee: 5000,
    registrationFee: 200,
    monthlyCoachingFee: 700,
    isActive: true,
  },
];

export default function MembershipsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [userMemberships, setUserMemberships] = useState([]);
  const [loading, setLoading] = useState(false);

  // Apply & Payment Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [plansRes, memsRes] = await Promise.all([
        fetch("/api/memberships/plans").then((r) => r.json()),
        user ? fetch("/api/memberships").then((r) => r.json()) : Promise.resolve({ memberships: [] }),
      ]);
      setPlans(plansRes.plans || []);
      setUserMemberships(memsRes.memberships || []);
    } catch (err) {
      showToast("Failed to load membership data.", "error");
    } finally {
      setLoading(false);
    }
  }

  const studentCat = user?.studentCategory || "Hosteller with EDB";
  const isEdb = studentCat.includes("EDB");
  const isHosteller = studentCat.includes("Hosteller");

  function calculateFee(plan) {
    if (!plan) return 0;
    if (user?.isComplimentaryApproved) return 0;
    if (isEdb) return plan.hostellerEdbFee ?? 4500;
    if (isHosteller) return plan.hostellerRegularFee ?? 5500;
    return plan.dayScholarFee ?? 7500;
  }

  function handleStartPayment(e) {
    if (e) e.preventDefault();
    if (!selectedPlan) return;

    if (!user) {
      showToast("Please log in with your LPU student account to register.", "error");
      window.location.href = "/login";
      return;
    }

    const fee = calculateFee(selectedPlan);
    if (fee === 0) {
      // Complimentary waiver (Medalist)
      submitMembershipRegistration({
        method: "Complimentary Pass",
        paymentId: `medalist_waiver_${Date.now()}`,
      });
    } else {
      // Open Payment Modal so student pays first before pass is activated
      setApplyModalOpen(false);
      setPaymentModalOpen(true);
    }
  }

  async function handlePaymentSuccess(paymentResult) {
    setPaymentModalOpen(false);
    await submitMembershipRegistration(paymentResult);
  }

  async function submitMembershipRegistration(paymentResult) {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan._id,
          paymentMethod: paymentResult.method || "UPI",
          paymentStatus: "Paid",
          paymentDetails: paymentResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit membership registration.");
      }
      showToast(data.message || "Payment verified! Membership activated successfully!");
      setApplyModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Institutional Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-[#a71d2a] uppercase tracking-wider flex items-center gap-1.5">
                <Award size={13} className="text-[#a71d2a]" /> Academic Session 2026–27
              </span>
              <span className="rounded bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                Official Fee Structure (Valid till 31 May 2027)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              LPU Sports Facility Membership Plans
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              University sports facilities operate under published academic session membership charges. Early Bird (EDB) rates apply to enrolled hostellers until <strong>31 August 2026</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
            <Building2 size={20} className="text-[#a71d2a]" />
            <div>
              <div className="text-base font-black text-slate-900">2026–27</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Academic Year</div>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Sportsperson / Medalist Banner */}
      {user?.isComplimentaryApproved && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-200 flex items-center justify-center text-amber-900 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-200/80 text-amber-900 px-2 py-0.5 text-[10px] font-bold uppercase">
                  National / Inter-University Medalist
                </span>
                <span className="text-xs text-slate-600 font-mono">Reg: #{user.regNo}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Complimentary All-Sports Pass Granted
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Approved by DSW Athletics. All facility booking fees and equipment rentals are 100% waived.
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-amber-200 text-amber-900 px-3 py-1.5 text-xs font-bold">
            Active All-Session Pass
          </span>
        </div>
      )}

      {/* Active User Memberships */}
      {userMemberships.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#a71d2a]" /> Your Active Sports Memberships
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userMemberships.map((mem) => (
              <div
                key={mem._id}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                    {mem.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {mem.paymentReference || "LPU-MEM"}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{mem.sportCategory}</h3>
                  <p className="text-xs text-slate-500">Session {mem.sessionYear || "2026-27"}</p>
                </div>
                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs text-slate-600">
                  <span>Student Tier:</span>
                  <span className="font-bold text-slate-800">{mem.studentCategory}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Fee Paid:</span>
                  <span className="font-extrabold text-[#a71d2a]">
                    {mem.isComplimentary ? "₹0 (Complimentary Pass)" : `₹${mem.applicableFee}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official 2026-27 Published Plans Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#a71d2a] uppercase tracking-wider block mb-1">
              Official University Rate Card
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              2026–27 Academic Session Sports Charges
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Published membership rates categorized by student enrollment status.
            </p>
          </div>
          {user && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-700">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Your Student Profile:</span>
              <strong className="text-[#a71d2a]">{user.name}</strong> • <span className="text-slate-900 font-semibold">{studentCat}</span>
            </div>
          )}
        </div>

        {loading ? (
          <Loading type="skeleton" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Sport / Facility</th>
                  <th className="py-3 px-4 text-[#a71d2a]">
                    Hosteller with EDB (₹)<br />
                    <span className="text-[10px] font-normal text-slate-500">(Until 31 Aug 2026)</span>
                  </th>
                  <th className="py-3 px-4 text-cyan-800">
                    Hosteller Regular (₹)<br />
                    <span className="text-[10px] font-normal text-slate-500">(Standard Rate)</span>
                  </th>
                  <th className="py-3 px-4 text-amber-800">
                    Day Scholar (₹)<br />
                    <span className="text-[10px] font-normal text-slate-500">(Full Session)</span>
                  </th>
                  <th className="py-3 px-4 text-slate-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {plans.map((plan) => {
                  const isFree = user?.isComplimentaryApproved;
                  const userFee = isFree
                    ? 0
                    : isEdb
                    ? plan.hostellerEdbFee
                    : isHosteller
                    ? plan.hostellerRegularFee
                    : plan.dayScholarFee;

                  const hasMembership = userMemberships.some(
                    (m) => m.sportCategory === plan.sportCategory && m.status === "Active"
                  );

                  return (
                    <tr key={plan._id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {plan.sportCategory}
                        {plan.sportCategory === "Swimming Pool" && (
                          <span className="block text-[10px] text-cyan-700 font-normal">
                            Olympic 50m Pool (Block 13)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#a71d2a]">
                        ₹{plan.hostellerEdbFee}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        ₹{plan.hostellerRegularFee}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        ₹{plan.dayScholarFee}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasMembership ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 size={12} /> Active Pass
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setApplyModalOpen(true);
                            }}
                            className="rounded-lg bg-[#a71d2a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#8e1520] transition cursor-pointer"
                          >
                            Apply (₹{userFee})
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Membership Modal */}
      {selectedPlan && (
        <Modal
          open={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Register for ${selectedPlan.sportCategory} Membership`}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartPayment}
                disabled={submitting}
                className="rounded-lg bg-[#a71d2a] px-5 py-2 text-xs font-bold text-white hover:bg-[#8e1520] transition cursor-pointer"
              >
                {submitting
                  ? "Processing..."
                  : calculateFee(selectedPlan) === 0
                  ? "Activate Complimentary Pass"
                  : `Pay ₹${calculateFee(selectedPlan).toLocaleString("en-IN")} via UPI & Activate`}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-700">
            <p>
              You are applying for the official <strong>2026–27 Academic Session Membership</strong> for{" "}
              <strong>{selectedPlan.sportCategory}</strong>.
            </p>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span>Selected Sport:</span>
                <strong className="text-slate-900">{selectedPlan.sportCategory}</strong>
              </div>
              <div className="flex justify-between">
                <span>Student Category:</span>
                <span className="font-semibold text-slate-800">{studentCat}</span>
              </div>
              <div className="flex justify-between border-t border-red-200 pt-2 font-bold text-sm text-slate-900">
                <span>Applicable Session Fee:</span>
                <span className="text-[#a71d2a]">
                  ₹{calculateFee(selectedPlan).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div>• Session pass valid through 31 May 2027.</div>
              <div>• Instant digital pass generated with QR verification token upon payment.</div>
              <div>• Real UPI payments go directly to university sports merchant ID (<strong>7828722557@ptyes</strong>).</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Real Payment Modal for Memberships (Must pay first before activation) */}
      {selectedPlan && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Pay & Activate ${selectedPlan.sportCategory} Membership`}
          itemTitle={`LPU ${selectedPlan.sportCategory} Session Pass`}
          itemSubtitle={`${studentCat} • Academic Year 2026–27`}
          amount={calculateFee(selectedPlan)}
          allowPayAtVenue={false}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
