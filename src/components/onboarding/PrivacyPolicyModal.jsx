
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Shield } from 'lucide-react';

export default function PrivacyPolicyModal({ onClose, onAgree }) {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const scrollRef = useRef();

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            setScrolledToBottom(true);
        }
    };

    const handleAgreeClick = () => {
        if (isChecked && scrolledToBottom) {
            onAgree();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
                <header className="p-6 border-b border-blue-500/20 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </Button>
                </header>

                <main className="p-6 overflow-y-auto min-h-0" onScroll={handleScroll} ref={scrollRef}>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-4">
                        <h2 className="text-white">EqoFlow Technologies LLC Privacy Policy</h2>
                        
                        <h3 className="text-white">1. Introduction</h3>
                        <p>Welcome to EqoFlow. This Privacy Policy explains how EqoFlow Technologies LLC ("EqoFlow", "we", "us", or "our") collects, uses, discloses, and protects any information that relates to an identified or identifiable living individual (referred to in this Privacy Policy as "Personal Data") when you access or use our platform, apps, website, APIs, notifications, technology, and related services (collectively, the "Services"), including when you visit our website at eqoflow.app or any website of ours that links to this Privacy Policy.</p>
                        <p>EqoFlow is committed to maintaining your trust by protecting and respecting your privacy and ensuring transparency in our data practices. By creating an account, accessing or using the Services, or otherwise providing Personal Data, you acknowledge that you have read and understood this Privacy Policy and agree to be bound by it. If you do not agree, do not access or use the Services. This Privacy Policy is incorporated by reference into, and subject to, our Terms of Service ("Terms").</p>
                        
                        <h3 className="text-white">2. Collection of Personal Data</h3>
                        <p>We collect Personal Data from various sources to operate, improve, personalize, and secure our Services. This data may be:</p>
                        <ul className="list-disc pl-5">
                            <li>Provided directly by you</li>
                            <li>Generated through your interactions with the Services</li>
                            <li>Submitted by other users</li>
                            <li>Obtained from integrated third-party services</li>
                        </ul>
                        <p>Examples of Personal Data we collect may include:</p>
                        <ul className="list-disc pl-5">
                            <li>Account information: Name, username, email address, password</li>
                            <li>Profile information: Bio, avatar, links, preferences</li>
                            <li>Demographics: Age, gender, interests</li>
                            <li>Content: Posts, comments, media, other materials you create or share using the Services</li>
                            <li>Communications: Messages sent to support, feedback, other correspondence</li>
                            <li>Submissions by other users: Reports or flags related to your content or behavior, mentions or tags in shared content</li>
                            <li>Activity and usage: Pages visited, features used, interactions with content and other users, timestamps, preferences, engagement metrics</li>
                            <li>Device and technical data: IP address, browser type, operating system, device identifiers</li>
                            <li>Location data: Approximate location based on IP address or device settings</li>
                            <li>Artificial Intelligence (AI) interactions: Prompts, generated outputs, feedback</li>
                            <li>Blockchain data: Wallet address, transaction history, token interactions, metadata related to decentralized identity and content ownership</li>
                            <li>Payment information: Billing details, transaction records</li>
                            <li>Authentication data: Credentials from connected social logins or other integrations</li>
                        </ul>
                        
                        <h3 className="text-white">3. Use of Personal Data</h3>
                        <p>We may use Personal Data we collect for the following purposes:</p>
                        
                        <h4 className="text-gray-200">3.1 Service Delivery</h4>
                        <p>Your Personal Data enables us to deliver and maintain access to the Services. This includes:</p>
                        <ul className="list-disc pl-5">
                            <li>Creating and managing your account</li>
                            <li>Providing access to platform features and content</li>
                            <li>Processing payments, subscriptions, and transactions</li>
                        </ul>
                        
                        <h4 className="text-gray-200">3.2 Personalization and Engagement</h4>
                        <p>We use Personal Data to tailor your experience, including:</p>
                        <ul className="list-disc pl-5">
                            <li>Customizing your experience based on preferences and activity</li>
                            <li>Recommending relevant content, creators, or communities</li>
                            <li>Supporting creator monetization and rewards programs</li>
                        </ul>
                        
                        <h4 className="text-gray-200">3.3 Communication</h4>
                        <p>To keep you informed and supported, we rely on your contact details and account activity. This includes:</p>
                        <ul className="list-disc pl-5">
                            <li>Transmitting service-related notifications, updates, and support responses</li>
                            <li>Sending account activity alerts (including transactional and security events)</li>
                            <li>Delivering promotional messages and targeted advertisements (where opted-in, if required)</li>
                        </ul>
                        
                        <h4 className="text-gray-200">3.4 Security and Moderation</h4>
                        <p>Maintaining a safe and secure environment requires us to process data related to system usage and user behavior. This includes:</p>
                        <ul className="list-disc pl-5">
                            <li>Monitoring system performance and troubleshooting technical issues</li>
                            <li>Detecting and preventing fraud, abuse, or violations of our Terms</li>
                            <li>Moderating content using automated and human review systems</li>
                            <li>Investigating and responding to user reports or flagged content</li>
                        </ul>
                        
                        <h4 className="text-gray-200">3.5 AI and Blockchain Features</h4>
                        <p>Interactions with AI tools and blockchain systems generate and utilize data for personalization, verification, and decentralization. This includes:</p>
                        <ul className="list-disc pl-5">
                            <li>Generating and delivering AI-powered content and recommendations</li>
                            <li>Verifying content authenticity and ownership via blockchain</li>
                            <li>Facilitating decentralized identity and wallet-based interactions</li>
                        </ul>
                        
                        <h4 className="text-gray-200">3.6 Legal and Compliance</h4>
                        <p>Where necessary, we use Personal Data to comply with legal requirements and uphold our contractual responsibilities. This includes:</p>
                        <ul className="list-disc pl-5">
                            <li>Complying with applicable laws, regulations, and legal obligations</li>
                            <li>Enforcing our Terms and protecting the rights of EqoFlow and our users</li>
                        </ul>
                        
                        <h4 className="text-gray-200">3.7 Research and Development</h4>
                        <p>Insights from usage and feedback guide our efforts to enhance and evolve the platform. This includes:</p>
                        <ul className="list-disc pl-5">
                            <li>Conducting surveys</li>
                            <li>Analyzing trends and engagement metrics to guide feature roadmaps</li>
                            <li>Developing, evaluating, and implementing new functionality</li>
                        </ul>
                        
                        <h3 className="text-white">4. Legal Basis for Processing</h3>
                        <p>EqoFlow processes Personal Data only as necessary to fulfill the purposes outlined in this Privacy Policy, unless otherwise required by law or with your consent. We process Personal Data in accordance with applicable data protection laws including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other relevant frameworks depending on your location.</p>
                        
                        <h3 className="text-white">5. Disclosure of Personal Data</h3>
                        <p>EqoFlow does discloses Personal Data in limited circumstances, as outlined below:</p>
                        
                        <h4 className="text-gray-200">5.1 Vendors, Consultants, and Service Providers</h4>
                        <p>We may disclose Personal Data to trusted third parties who help EqoFlow operate, maintain, and improve our Services. These may include entities that specialize in advertising networks, affiliate marketing programs, AI capabilities, authentication services, communication and collaboration applications, customer support solutions, fraud-prevention technologies, hosting and infrastructure platforms, payment processing providers, and social network integrations.</p>
                        
                        <h4 className="text-gray-200">5.2 Business Partners</h4>
                        <p>We may disclose Personal Data to strategic partners to enable integrations and joint offerings that would not be possible without such partnerships, such as community engagement features, co-branded promotions, cross-platform opportunities and rewards, and creator monetization programs.</p>
                        
                        <h4 className="text-gray-200">5.3 Blockchain Transactions</h4>
                        <p>When you engage in blockchain-based activities (e.g., wallet connections, token transactions), certain information, such as wallet addresses and transaction metadata, may be publicly visible on a decentralized ledger. Because blockchain networks are immutable and openly accessible, EqoFlow cannot modify or delete data recorded on-chain, nor can we control how third parties access or use that information.</p>
                        
                        <h4 className="text-gray-200">5.4 Legal and Regulatory Requirements</h4>
                        <p>We may disclose Personal Data when required or permitted by law, including to comply with applicable laws, regulations, or legal processes, respond to valid requests from law enforcement or government agencies, and enforce our Terms or protect the rights, safety, and integrity of EqoFlow and its users.</p>
                        
                        <h3 className="text-white">6. Cookies and Tracking Technologies</h3>
                        <p>EqoFlow uses cookies and other similar tracking technologies to enhance your experience, analyze usage patterns, support platform functionality, and deliver personalized content and services.</p>
                        
                        <h3 className="text-white">7. Behavioral Advertising and Analytics</h3>
                        <p>We may use Personal Data to deliver advertisements or marketing communications tailored to your interests. This may include combining Personal Data collected through our Services with Personal Data from approved third‑party partners.</p>
                        
                        <h3 className="text-white">8. User Rights</h3>
                        <p>EqoFlow respects your privacy rights and provides meaningful choices regarding how your Personal Data is collected, used, and disclosed. However, these privacy rights vary by region and are not absolute.</p>
                        
                        <h4 className="text-gray-200">8.1 Knowledge</h4>
                        <p>You have the right to know whether or not we are processing your Personal Data.</p>
                        
                        <h4 className="text-gray-200">8.2 Access and Correction</h4>
                        <p>You may access and update your account information and other Personal Data at any time by logging into your profile settings.</p>
                        
                        <h4 className="text-gray-200">8.3 Deletion</h4>
                        <p>You have access to delete your account at any time.</p>
                        
                        <h4 className="text-gray-200">8.4 Opt-Out of Communications</h4>
                        <p>You may opt out of receiving promotional emails by following the unsubscribe instructions in those messages. However, we will continue to send essential service communications, including account updates and security alerts.</p>
                        
                        <h4 className="text-gray-200">8.5 Portability</h4>
                        <p>You may export your Personal Data from your active account using the Download My Data button in the Account Management section of the Privacy Hub from within your profile settings.</p>
                        
                        <h3 className="text-white">9. Data Retention</h3>
                        <p>EqoFlow retains Personal Data only for as long as necessary to operate the Services, fulfill legal obligations, resolve disputes, and enforce our agreements. Retention periods vary depending on the type of data, its purpose, and applicable regulatory requirements. No purpose within this Privacy Policy will require us to keep your Personal Data for longer than forty-eight (48) months past termination of your account.</p>
                        
                        <h3 className="text-white">10. Data Security</h3>
                        <p>EqoFlow is committed to safeguarding your Personal Data through industry-standard measures designed to prevent accidental loss, unauthorized access, misuse, alteration, or disclosure.</p>
                        
                        <h3 className="text-white">11. Children's Privacy and COPPA Compliance</h3>
                        <p>EqoFlow's Services are not intended for children under the age of 13. We do not knowingly collect Personal Data from children under 13, in compliance with the Children's Online Privacy Protection Act (COPPA) and similar protections that may apply depending on jurisdiction.</p>
                        
                        <h3 className="text-white">12. International Data Transfers</h3>
                        <p>EqoFlow is a global platform, and your Personal Data may be transferred to, stored in, or processed in countries outside of your country of residence. These countries may have data protection laws that are different from those in your jurisdiction and may not provide the same level of protection.</p>
                        
                        <h3 className="text-white">13. Third-Party Services</h3>
                        <p>EqoFlow may link to or integrate with third-party platforms and services to enhance your experience. We engage third-party service providers who are contractually obligated to meet appropriate data protection and security standards.</p>
                        
                        <h3 className="text-white">14. Changes to This Privacy Policy</h3>
                        <p>We reserve the right to change this Privacy Policy at any time. If changes are made, we will notify you via the Services or by email where feasible. Continued use of the Services constitutes your acceptance of the Privacy Policy then in effect.</p>
                        
                        <h3 className="text-white">15. Contact Information</h3>
                        <p>For questions or concerns about this Privacy Policy, to exercise your data rights, or to report a privacy-related issue, contact us via e-mail at support@eqoflow.app</p>
                    </div>
                </main>

                <footer className="p-6 border-t border-blue-500/20 flex flex-col gap-4 flex-shrink-0 bg-slate-900/50">
                    {!scrolledToBottom && (
                        <p className="text-sm text-gray-400 text-center">Please scroll to the bottom to continue</p>
                    )}
                    
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="agree-privacy"
                            checked={isChecked}
                            onCheckedChange={setIsChecked}
                            disabled={!scrolledToBottom}
                            className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-blue-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <label htmlFor="agree-privacy" className="text-sm text-white leading-relaxed cursor-pointer">
                            I have read and agree to the Privacy Policy
                        </label>
                    </div>
                    <Button
                        onClick={handleAgreeClick}
                        disabled={!isChecked || !scrolledToBottom}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:bg-gray-500 text-white"
                    >
                        Agree and Continue
                    </Button>
                </footer>
            </motion.div>
        </div>
    );
}
