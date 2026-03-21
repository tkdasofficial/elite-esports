import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: 'We collect information you provide directly, including your name, email address, username, phone number, and payment information. We also collect gameplay data, tournament participation history, device information, and usage analytics to improve our services and provide personalized experiences.',
  },
  {
    title: 'How We Use Your Information',
    content: 'We use your information to operate and improve the platform, process transactions, send notifications about tournaments and account activity, verify your identity, prevent fraud, comply with legal obligations, and provide customer support. We analyze usage patterns to enhance user experience.',
  },
  {
    title: 'Information Sharing',
    content: 'We do not sell your personal information to third parties. We may share information with trusted service providers who assist us in operating the platform, conducting our business, or servicing you, as long as those parties agree to keep this information confidential. We may also disclose information when required by law.',
  },
  {
    title: 'Data Security',
    content: 'We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes SSL encryption, secure data storage, and regular security audits. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: 'Cookies & Tracking',
    content: 'We use cookies and similar tracking technologies to enhance your experience, remember your preferences, analyze platform usage, and deliver relevant content. You can control cookie settings through your browser preferences, though disabling cookies may limit certain platform features.',
  },
  {
    title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal information. You can request a copy of your data, opt out of marketing communications, and request data portability. To exercise these rights, contact our support team. We will respond to your request within 30 days.',
  },
  {
    title: 'Data Retention',
    content: 'We retain your personal information for as long as your account is active or as needed to provide services. You may request account deletion at any time. Upon deletion, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes.',
  },
  {
    title: 'Children\'s Privacy',
    content: 'Our platform is not directed to children under 16. We do not knowingly collect personal information from children under 16. If you believe a child has provided us with personal information, please contact us immediately and we will take steps to remove such information.',
  },
  {
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy. We encourage you to review this policy regularly.',
  },
  {
    title: 'Contact Us',
    content: 'If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Privacy Team at privacy@eliteesports.com or write to us at Elite Esports, Privacy Department, India. We are committed to addressing your concerns promptly.',
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center bg-app-bg/90 backdrop-blur-md border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Privacy Policy</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10 space-y-5">
        <div className="flex items-center gap-4 bg-brand-primary/8 rounded-[16px] p-4 border border-brand-primary/15">
          <div className="w-12 h-12 bg-brand-primary/15 rounded-2xl flex items-center justify-center shrink-0">
            <Shield size={22} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text-primary">Your Privacy Matters</p>
            <p className="text-[13px] text-text-secondary font-normal mt-0.5">Last updated: March 20, 2026</p>
          </div>
        </div>

        <p className="text-[14px] text-text-secondary font-normal leading-relaxed px-1">
          This Privacy Policy explains how Elite Esports collects, uses, and protects your personal information when you use our platform.
        </p>

        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-app-card rounded-[16px] p-4 space-y-2"
            >
              <h3 className="text-[15px] font-semibold text-text-primary">{section.title}</h3>
              <p className="text-[14px] text-text-secondary font-normal leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center py-4 space-y-1">
          <p className="text-[12px] text-text-muted font-normal">Elite Esports Platform</p>
          <p className="text-[11px] text-text-muted font-normal">© 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
