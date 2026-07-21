import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";

export const Contact: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && message.trim()) {
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    }
  };

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conscious Support Desk</span>
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              We're Prepared to Assist You
            </h1>
            <p className="text-xs text-slate-400">
              Submit query tickets or retrieve our corporate office coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* Left Col: Contact Information Cards */}
            <div className="space-y-4">
              
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Mail Room</h4>
                  <p className="text-xs text-slate-500">support@syntexstore.io</p>
                  <p className="text-xs text-slate-500">accounts@syntexstore.io</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Voice Lines</h4>
                  <p className="text-xs text-slate-500">+1 (800) 555-SYNTEX</p>
                  <p className="text-xs text-slate-500">Mon - Fri, 9am - 6pm EST</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">HQ Coordinates</h4>
                  <p className="text-xs text-slate-500">Suite 400, 100 Innovation Way</p>
                  <p className="text-xs text-slate-500">Silicon Valley, CA 94025</p>
                </div>
              </div>

            </div>

            {/* Center Col: Form */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-xs lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 font-display">Dispatch a Ticket</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jdoe@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Query Department</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  >
                    <option value="general">General Storefront Inquiry</option>
                    <option value="logistics">Shipping & Return Logistics</option>
                    <option value="tech">Bespoke Hardware Queries</option>
                    <option value="accounts">Corporate Accounts / Bulk</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Inquiry Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your inquiry details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 font-sans"
                  />
                </div>

                {submitted && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-xl text-xs font-medium border border-green-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Ticket dispatched! Our conscious desk technician will email you shortly.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 text-sm font-semibold"
                  icon={<Send className="w-4 h-4" />}
                >
                  Submit Support Request
                </Button>

              </form>

            </div>

          </div>

          {/* Map Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-500">
              <HelpCircle className="w-4.5 h-4.5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">HQ Spatial Grid Location</span>
            </div>
            
            <div className="w-full h-80 rounded-3xl bg-slate-100 border border-slate-200/80 overflow-hidden relative flex items-center justify-center group shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
              
              <div className="z-10 text-center space-y-2 p-6 max-w-sm">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-800 text-sm font-display">Silicon Valley Headquarters</h4>
                <p className="text-[11px] text-slate-400">
                  Google Maps API integration will be deployed in future sprints. For safety, location credentials remain locked.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
