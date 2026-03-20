import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const FAQS = [
  {
    category: 'Account',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Tap "Create Account" on the login screen, fill in your username, email, and password, then submit. Your account will be created instantly and you\'ll receive 500 coins as a welcome bonus.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the login page, tap "Forgot Password?" and enter your registered email address. You\'ll receive a reset link within a few minutes. Check your spam folder if you don\'t see it.',
      },
      {
        q: 'How do I change my username or profile details?',
        a: 'Go to Profile → tap the Edit (pencil) icon → update your details → tap Done. Changes take effect immediately across the platform.',
      },
      {
        q: 'Can I have multiple accounts?',
        a: 'No, each user is permitted only one account on Elite Esports. Multiple accounts violate our Terms of Service and may result in permanent bans for all associated accounts.',
      },
    ],
  },
  {
    category: 'Tournaments',
    items: [
      {
        q: 'How do I join a tournament?',
        a: 'Browse tournaments on the home page, tap on one to view details, then tap "Join Tournament" at the bottom. Ensure you have sufficient coins for the entry fee and a linked game profile for that game.',
      },
      {
        q: 'How do I add my game profile (IGN/UID)?',
        a: 'Go to Profile → My Games → Add. Select your game, enter your In-Game Name (IGN) and Game UID, then tap "Link Game Account". Your profile will be verified within 24 hours.',
      },
      {
        q: 'Can I cancel my tournament registration?',
        a: 'Yes, you can leave a tournament before it goes live. Open the match details and tap "Leave Tournament". Note that entry fee refunds depend on when you cancel relative to the tournament start time.',
      },
      {
        q: 'When will I receive my tournament results?',
        a: 'Results are typically published within 30 minutes of tournament completion. You\'ll receive a notification and can view results in the match details page.',
      },
    ],
  },
  {
    category: 'Wallet & Payments',
    items: [
      {
        q: 'How do I add money to my wallet?',
        a: 'Go to Wallet → Add Cash. Enter the amount, pay via UPI to the provided ID, then enter the 12-digit UTR (transaction reference). Admin will verify and credit within 2-24 hours.',
      },
      {
        q: 'How long does a withdrawal take?',
        a: 'Withdrawals are processed manually by our team and typically take 1-3 business days. You\'ll receive a notification once processed. Minimum withdrawal amount is ₹50.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept UPI transfers (PhonePe, Google Pay, Paytm, BHIM, etc.) for deposits. Withdrawals can be made to any UPI ID or as Google Play gift cards.',
      },
      {
        q: 'Why is my deposit still pending?',
        a: 'Deposits are manually verified by our admin team. This usually takes 2-12 hours during business hours (10 AM - 10 PM IST). If pending for more than 24 hours, contact support with your UTR number.',
      },
    ],
  },
  {
    category: 'Teams',
    items: [
      {
        q: 'How do I create a team?',
        a: 'Go to Profile → My Team → Create Team. Enter a team name and a tag (max 5 characters). Share your Team ID with friends so they can join.',
      },
      {
        q: 'How do I join an existing team?',
        a: 'Go to Profile → My Team → Join Team. Enter the Team ID provided by the team leader. You\'ll be added to the team instantly.',
      },
      {
        q: 'How many members can a team have?',
        a: 'Teams can have up to 5 members. The player who creates the team becomes the Leader and can manage team membership.',
      },
    ],
  },
];

const SUPPORT_CHANNELS = [
  { icon: Mail, label: 'Email Support', value: 'support@eliteesports.com', color: 'bg-brand-primary/15 text-brand-primary' },
  { icon: MessageCircle, label: 'Live Chat', value: 'Available 10 AM - 10 PM IST', color: 'bg-brand-success/15 text-brand-success' },
  { icon: Phone, label: 'Response Time', value: 'Usually within 4 hours', color: 'bg-brand-warning/15 text-brand-warning' },
];

function FaqItem({ item }: { item: { q: string; a: string }; [key: string]: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-app-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left active:bg-app-elevated transition-colors"
      >
        <span className="text-[15px] font-normal text-text-primary leading-snug flex-1">{item.q}</span>
        {open ? <ChevronUp size={16} className="text-text-muted shrink-0" /> : <ChevronDown size={16} className="text-text-muted shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-[14px] text-text-secondary font-normal leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Help Center</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10 space-y-6">
        <section className="space-y-3">
          <p className="ios-section-header">Contact Support</p>
          <div className="space-y-2">
            {SUPPORT_CHANNELS.map((ch, i) => (
              <div key={i} className="bg-app-card rounded-[14px] flex items-center gap-3.5 px-4 py-3.5">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${ch.color}`}>
                  <ch.icon size={17} />
                </div>
                <div>
                  <p className="text-[15px] font-normal text-text-primary">{ch.label}</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">{ch.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="ios-section-header">Frequently Asked Questions</p>
          {FAQS.map((cat, ci) => (
            <div key={ci} className="space-y-2">
              <p className="text-[13px] font-semibold text-text-secondary px-1">{cat.category}</p>
              <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
                {cat.items.map((item, ii) => (
                  <FaqItem key={ii} item={item} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="bg-brand-primary/8 rounded-[16px] p-4 border border-brand-primary/15 text-center space-y-2">
          <p className="text-[15px] font-semibold text-text-primary">Still need help?</p>
          <p className="text-[14px] text-text-secondary font-normal">Email us at support@eliteesports.com and we'll get back to you within 4 hours.</p>
        </div>
      </div>
    </div>
  );
}
