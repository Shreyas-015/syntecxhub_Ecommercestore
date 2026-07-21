import React, { useState } from "react";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useToast } from "../context/ToastContext";
import { 
  Sparkles, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  Lock, 
  Eye, 
  Shield, 
  Save, 
  RefreshCw 
} from "lucide-react";

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Language State
  const [language, setLanguage] = useState("en");

  // Notifications State
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  // Privacy State
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Global configurations updated successfully in local session ledger.", "success");
    }, 1000);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    showToast(`Visual Theme switched to ${!isDarkMode ? "Dark" : "Light"} mode.`, "info");
    // Optionally trigger HTML class toggle
    document.documentElement.classList.toggle("dark");
  };

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="space-y-2 text-center max-w-md mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono group cursor-pointer">
              <SettingsIcon className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" />
              <span>Control Panel</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Global Settings
            </h1>
            <p className="text-xs text-slate-400">
              Customize your shopping ecosystem preferences and local security parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Sidebar Information / Summary Card */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl h-fit space-y-5 shadow-xs">
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm font-display">Configuration Hub</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  These configurations apply directly to your active device sandbox. Certain features are simulated placeholder controls to prepare for full-stack deployment in Phase 3.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Current Language</span>
                  <span className="font-mono font-bold text-slate-700 uppercase">{language}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Visual Scheme</span>
                  <span className="font-mono font-bold text-slate-700">{isDarkMode ? "Dark Theme" : "Light Theme"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Privacy Ledger</span>
                  <span className="font-mono font-bold text-slate-700">{isPrivateProfile ? "Enforced" : "Standard"}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full py-2.5 text-xs font-semibold"
                  onClick={handleSaveSettings}
                  isLoading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Configuration
                </Button>
              </div>
            </div>

            {/* Main Settings Sections */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Theme Settings */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Sun className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Appearance</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Configure visual themes for your viewing preferences.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-700 block">Dark Mode Theme</label>
                    <span className="text-[10px] text-slate-400 block max-w-xs">Reduce eye fatigue using the dark twilight aesthetic coordinates.</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                      isDarkMode ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span className="sr-only">Toggle Dark Mode</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? "translate-x-6" : "translate-x-1"
                      } flex items-center justify-center`}
                    >
                      {isDarkMode ? <Moon className="w-2.5 h-2.5 text-blue-600" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
                    </span>
                  </button>
                </div>
              </div>

              {/* Language Settings */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Globe className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Language & Region</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Select your localized translation parameters.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">UI Interface Language</label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      showToast(`Language changed to ${e.target.value === "en" ? "English" : e.target.value === "es" ? "Spanish" : "French"}.`, "info");
                    }}
                    className="w-full sm:max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Bell className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Notification Preferences</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Manage updates and promotion log dispatches.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-700 block">Email Newsletters</label>
                      <span className="text-[10px] text-slate-400 block">Receive premium item drops and security notifications.</span>
                    </div>
                    <button
                      onClick={() => setNotifEmail(!notifEmail)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                        notifEmail ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifEmail ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* SMS */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-700 block">SMS Alerts</label>
                      <span className="text-[10px] text-slate-400 block">Receive instantaneous delivery dispatch and track codes on mobile.</span>
                    </div>
                    <button
                      onClick={() => setNotifSms(!notifSms)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                        notifSms ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifSms ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-700 block">Push Notifications</label>
                      <span className="text-[10px] text-slate-400 block">Enable desktop alerts for order status and secure logins.</span>
                    </div>
                    <button
                      onClick={() => setNotifPush(!notifPush)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                        notifPush ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPush ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-50">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Security & Privacy</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Protect your personal data ledger and credentials.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  
                  {/* Private Profile */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-700 block">Secure Private Vault</label>
                      <span className="text-[10px] text-slate-400 block">Obfuscate addresses and personal details from standard cookies.</span>
                    </div>
                    <button
                      onClick={() => setIsPrivateProfile(!isPrivateProfile)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                        isPrivateProfile ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isPrivateProfile ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-700 block">Analytics & Telemetry Tracking</label>
                      <span className="text-[10px] text-slate-400 block">Share anonymous usage diagnostics to help us improve performance.</span>
                    </div>
                    <button
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                        analyticsEnabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          analyticsEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
};
