import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using the Elite Esports platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 16 years of age to participate in tournaments on the Elite Esports platform. By creating an account, you represent and warrant that you meet this age requirement. Users under 18 must have parental consent to participate in paid tournaments.',
  },
  {
    title: '3. Account Responsibility',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You are fully responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. Elite Esports is not liable for any loss or damage arising from your failure to protect your account.',
  },
  {
    title: '4. Tournament Rules',
    content: 'All participants must comply with the specific rules of each tournament. Using cheats, hacks, exploits, or any unauthorized third-party software is strictly prohibited and will result in immediate disqualification and a permanent ban. Results disputes must be raised within 15 minutes of match completion. Tournament organizer decisions are final.',
  },
  {
    title: '5. Entry Fees & Prizes',
    content: 'Entry fees are non-refundable once a tournament has begun. Prize distributions will be processed within 7 business days of tournament completion. Elite Esports reserves the right to withhold prizes in cases of suspected fraud, rule violations, or disputes. All prize winnings may be subject to applicable taxes.',
  },
  {
    title: '6. Wallet & Transactions',
    content: 'Deposits are subject to admin verification and may take up to 24 hours to process. Withdrawals are processed manually and may take up to 3-5 business days. Minimum deposit amount is ₹10 and minimum withdrawal is ₹50. Elite Esports is not responsible for delays caused by payment processors or banking institutions.',
  },
  {
    title: '7. Fair Play & Conduct',
    content: 'All users are expected to maintain sportsmanlike conduct at all times. Harassment, abuse, hate speech, or discriminatory behavior towards other users will result in account suspension or permanent ban. Any attempt to manipulate match outcomes, collude with opponents, or engage in match-fixing is strictly prohibited.',
  },
  {
    title: '8. Intellectual Property',
    content: 'All content, branding, logos, and materials on the Elite Esports platform are the property of Elite Esports and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit written permission.',
  },
  {
    title: '9. Privacy',
    content: 'Your use of the platform is subject to our Privacy Policy. By using our services, you consent to the collection and use of your information as described in our Privacy Policy. We are committed to protecting your personal information and maintaining its confidentiality.',
  },
  {
    title: '10. Limitation of Liability',
    content: 'Elite Esports shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid in entry fees in the 30 days preceding the incident. We do not guarantee uninterrupted or error-free service.',
  },
  {
    title: '11. Termination',
    content: 'Elite Esports reserves the right to suspend or terminate your account at any time for violations of these terms, suspicious activity, or at our sole discretion. Upon termination, your right to use the platform will immediately cease. Any pending tournament winnings may be forfeited in cases of policy violation.',
  },
  {
    title: '12. Contact',
    content: 'If you have questions about these Terms and Conditions, please contact us at support@eliteesports.com. We are committed to resolving any concerns promptly and fairly.',
  },
];

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Terms & Conditions</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10 space-y-5">
        <div className="bg-app-card rounded-[16px] p-4 space-y-1">
          <p className="text-[13px] font-medium text-brand-primary">Last Updated</p>
          <p className="text-[15px] text-text-secondary font-normal">March 20, 2026</p>
        </div>

        <p className="text-[14px] text-text-secondary font-normal leading-relaxed px-1">
          Please read these Terms and Conditions carefully before using the Elite Esports platform.
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
