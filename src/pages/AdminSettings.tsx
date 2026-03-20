import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Settings, Shield, Wallet, Bell, Globe, Save, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Admin Settings</h1>
        <Button size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Save size={16} />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Wallet size={20} className="text-brand-blue flex-shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 truncate">Payment Details</h2>
          </div>
          <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
            <Input label="Admin UPI ID" placeholder="admin@upi" defaultValue="elite_admin@okaxis" />
            <Input label="Bank Account Number" placeholder="000000000000" defaultValue="9182736455" />
            <Input label="IFSC Code" placeholder="IFSC0000000" defaultValue="HDFC0001234" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Min Withdrawal" placeholder="₹100" defaultValue="₹100" />
              <Input label="Max Withdrawal" placeholder="₹10,000" defaultValue="₹5,000" />
            </div>
          </Card>
        </section>

        {/* Security Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Shield size={20} className="text-brand-red flex-shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 truncate">Security</h2>
          </div>
          <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate">Two-Factor Auth</p>
                <p className="text-xs text-slate-500 line-clamp-2">Require 2FA for admin login</p>
              </div>
              <div className="w-12 h-6 bg-brand-blue rounded-full relative flex-shrink-0">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate">Login Notifications</p>
                <p className="text-xs text-slate-500 line-clamp-2">Alert on new admin login</p>
              </div>
              <div className="w-12 h-6 bg-brand-blue rounded-full relative flex-shrink-0">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <Button variant="secondary" fullWidth className="mt-4 border-white/5 h-11 sm:h-10">
              <Lock size={16} className="mr-2" />
              Change Password
            </Button>
          </Card>
        </section>

        {/* Platform Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Globe size={20} className="text-brand-green flex-shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 truncate">Platform</h2>
          </div>
          <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
            <Input label="Platform Name" defaultValue="Elite Esports" />
            <Input label="Support Email" defaultValue="support@elite.com" />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate">Maintenance Mode</p>
                <p className="text-xs text-slate-500 line-clamp-2">Temporarily disable user access</p>
              </div>
              <div className="w-12 h-6 bg-white/10 rounded-full relative flex-shrink-0">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
              </div>
            </div>
          </Card>
        </section>

        {/* Notification Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Bell size={20} className="text-brand-yellow flex-shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 truncate">Notifications</h2>
          </div>
          <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate">Email Alerts</p>
                <p className="text-xs text-slate-500 line-clamp-2">Receive alerts on important events</p>
              </div>
              <div className="w-12 h-6 bg-brand-blue rounded-full relative flex-shrink-0">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate">Push Notifications</p>
                <p className="text-xs text-slate-500 line-clamp-2">Send push alerts to users</p>
              </div>
              <div className="w-12 h-6 bg-brand-blue rounded-full relative flex-shrink-0">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
