
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, FileText } from 'lucide-react';

export default function TermsOfServiceModal({ onClose, onAgree }) {
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
                className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
                <header className="p-6 border-b border-purple-500/20 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Terms of Service</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </Button>
                </header>

                <main className="p-6 overflow-y-auto min-h-0" onScroll={handleScroll} ref={scrollRef}>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-4">
                        <h3 className="text-white">1. Acceptance of Terms</h3>
                        <p>Welcome to EqoFlow – a decentralized social fabric and creator economy where individuals, communities, and businesses share thoughts and ideas in real time. These Terms of Service ("Terms") govern your access to and use of the EqoFlow platform, apps, websites, APIs, email notifications, technology, and related services (collectively, the "Services"), owned, operated, or branded by EqoFlow Technologies LLC, a Nevada limited liability company ("EqoFlow", "we", "us", or "our").</p>
                        <p>These Terms apply to all users, including registered account holders and visitors. By creating an account or using the Services, you agree to be bound by these Terms. If you do not agree, do not access or use the Services.</p>
                        
                        <h3 className="text-white">2. Eligibility and User Requirements</h3>
                        <p>You must meet the following requirements to use EqoFlow's Services:</p>
                        <ul className="list-disc pl-5">
                            <li>Be at least 13 years old (or the minimum age required in your country) to use the Services.</li>
                            <li>Provide accurate, current, and complete information when creating/updating your account and keep it up to date.</li>
                            <li>Use the Services only for lawful purposes and in accordance with these Terms and all applicable regulations.</li>
                            <li>If you're using the Services on behalf of a company, organization, or community, you confirm you have authority to bind them to these Terms.</li>
                        </ul>
                        
                        <h3 className="text-white">3. Privacy & Data Handling</h3>
                        <p>Your privacy is important to us and we're committed to handling your data responsibly. Personal information is collected and processed in accordance with our forthcoming Privacy Policy. We use industry-standard encryption and security protocols to protect your data.</p>
                        <p>By using the Services, you consent to our data practices. EqoFlow will not sell, rent, or share your personal information with third parties, except as required to operate the Services or comply with applicable laws.</p>
                        
                        <h3 className="text-white">4. Account Security</h3>
                        <p>You must register for an account to access core features of the Services. You are solely responsible for:</p>
                        <ul className="list-disc pl-5">
                            <li>Maintaining the confidentiality of your password and access credentials;</li>
                            <li>Notifying EqoFlow immediately if you suspect any unauthorized use of your account;</li>
                            <li>Ensuring that all activity under your account complies with these Terms.</li>
                        </ul>
                        
                        <h3 className="text-white">5. User Conduct and Content Sharing</h3>
                        <p>EqoFlow is committed to maintaining a safe space for sharing and creativity. You agree not to use the Services to:</p>
                        <ul className="list-disc pl-5">
                            <li>Create, post, or share content that is defamatory, obscene, sexually explicit, hateful, violates laws or regulations, or promotes violence;</li>
                            <li>Dehumanize, harass, threaten, or discriminate against others;</li>
                            <li>Engage in harmful, fraudulent, or deceptive activities;</li>
                            <li>Infringe on the intellectual property or privacy rights of others;</li>
                            <li>Spread spam or malware, conduct phishing, or otherwise misuse the Services for unsolicited or malicious purposes;</li>
                            <li>Impersonate another person or misrepresent your affiliation with any individual or entity;</li>
                            <li>Use bots, scrapers, or other automated means to access, collect, or manipulate data on the Services;</li>
                            <li>Circumvent or disrupt security features, or attempt to access source code, accounts, data, or systems without authorization;</li>
                            <li>Reverse engineer, decompile, or modify any part of the Services;</li>
                            <li>Engage in any other activity that violates these Terms or interferes with the intended use of the Services.</li>
                        </ul>
                        
                        <h3 className="text-white">6. Political Content</h3>
                        <p>Users may discuss political topics, but all posts and comments must remain politically neutral and respectful of differing viewpoints. Content that is intended to incite rage, violence, or hostility, whether through inflammatory language, targeted attacks, or provocative imagery, is strictly prohibited. We reserve the right to remove any content that violates this policy and to take appropriate action against repeat offenders, including suspension or termination of access.</p>
                        
                        <h3 className="text-white">7. User Content & Licensing</h3>
                        <p>EqoFlow's Services are designed to facilitate creative expression, meaningful interactions, and community building. We prioritize creators by offering tools and policies that encourage originality, safety, and fair monetization. You retain ownership of the original content you create and post.</p>
                        <p>By using the Services, you grant EqoFlow a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, modify, publish, publicly display, distribute, and create derivative works from your content for the purpose of operating, promoting, and improving the Services. This license remains in effect unless and until you delete your content or deactivate your account, in which case EqoFlow will cease use of your content except where retention is required by law or for legitimate business purposes.</p>
                        
                        <h3 className="text-white">8. Use of AI</h3>
                        <p>The Services include AI-powered tools for content creation, moderation, and discovery.</p>
                        <ul className="list-disc pl-5">
                            <li>AI outputs are generated based on patterns in data and may not always be accurate, complete, or appropriate.</li>
                            <li>You're responsible for reviewing and verifying AI-generated content before sharing it.</li>
                            <li>You may not use AI features, or create or distribute AI-generated or AI-modified content, in any way that violates these Terms.</li>
                        </ul>
                        
                        <h3 className="text-white">9. Moderation</h3>
                        <p>The Services use a combination of automated systems and human review to moderate user-reported or system-flagged content. Violations of these Terms may result in the removal of content, suspension, or termination of accounts. If you feel that your content has been removed without due cause, you can submit an appeal via email to support@eqoflow.app within 30 days of the removal.</p>
                        
                        <h3 className="text-white">10. Intellectual Property</h3>
                        <p>EqoFlow's name, logo, trademarks, design elements, software code, and proprietary technology and materials used or displayed in the Services are owned by EqoFlow or our licensors. These assets are protected by intellectual property laws.</p>
                        <ul className="list-disc pl-5">
                            <li>You may not use EqoFlow's trademarks, branding, or copyrighted materials without prior written consent.</li>
                            <li>Using the Services does not grant you any rights to EqoFlow's intellectual property, except as expressly permitted by these Terms.</li>
                            <li>All rights not expressly granted to you are reserved by EqoFlow.</li>
                        </ul>
                        
                        <h3 className="text-white">11. DMCA / Copyright Infringement Process</h3>
                        <p>EqoFlow respects the intellectual property rights of others and expects users of the Services to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), EqoFlow is in the process of designating an agent to receive notices of alleged copyright infringement and has adopted a policy to respond to notices of alleged copyright infringement that comply with applicable law.</p>
                        <p>If you believe that your copyrighted work has been copied or used in a way that constitutes copyright infringement, submit an email with "DMCA Takedown Notice" as the subject to support@eqoflow.app while we finalize our registration.</p>
                        
                        <h3 className="text-white">12. Subscriptions, Billing, and Payment Terms</h3>
                        <p>EqoFlow offers free and paid subscription plans, as well as in-platform purchases for premium features.</p>
                        <ul className="list-disc pl-5">
                            <li>Paid plans are billed in advance on a recurring monthly or annual basis.</li>
                            <li>All fees are non-refundable except where required by law.</li>
                            <li>You must provide valid payment information and authorize recurring charges.</li>
                            <li>Failure to pay will result in loss of paid features and may include account suspension.</li>
                            <li>Reward payouts to creators are processed according to the terms of each program; creators are responsible for applicable taxes and compliance with local laws.</li>
                        </ul>
                        
                        <h3 className="text-white">13. Blockchain Integrations and Digital Wallets</h3>
                        <p>The Services include features that utilize blockchain technology, including the ability to connect digital wallets for identity verification, content ownership, rewards, or other platform interactions.</p>
                        <p>By connecting a digital wallet to the Services, you acknowledge and agree that:</p>
                        <ul className="list-disc pl-5">
                            <li>You are solely responsible for the security and management of your wallet and private keys.</li>
                            <li>EqoFlow does not store or have access to your private keys and cannot recover lost or stolen assets;</li>
                            <li>Blockchain transactions may be irreversible and subject to network fees;</li>
                            <li>You are responsible for complying with all applicable laws and regulations related to digital assets and blockchain use;</li>
                            <li>EqoFlow may use blockchain technology to verify content authenticity, facilitate rewards, or support decentralized features, but does not guarantee the performance or reliability of any blockchain network.</li>
                        </ul>
                        
                        <h3 className="text-white">14. Utility Token</h3>
                        <p>EqoFlow intends to offer a native utility token, $EQOFLO, designed to support platform interactions, rewards, governance, or other utility-based functions. Certain features and services on the platform may be purchased or accessed using $EQOFLO.</p>
                        <p>By acquiring, holding, or using $EQOFLO, you acknowledge and agree that:</p>
                        <ul className="list-disc pl-5">
                            <li>$EQOFLO is a utility token and does not represent equity, ownership, or entitlement to profits or dividends;</li>
                            <li>$EQOFLO is not intended as an investment product;</li>
                            <li>EqoFlow does not guarantee the value, liquidity, or future availability of $EQOFLO;</li>
                            <li>EqoFlow may modify, suspend, or discontinue the token program at any time;</li>
                            <li>Transactions involving $EQOFLO may be irreversible and subject to blockchain network fees;</li>
                            <li>EqoFlow is not responsible for losses resulting from market volatility, wallet mismanagement, or unauthorized access;</li>
                            <li>You are solely responsible for complying with all applicable laws and regulations related to cryptocurrency, including tax obligations and securities laws in your jurisdiction.</li>
                        </ul>
                        
                        <h3 className="text-white">15. Third Parties</h3>
                        <p>The Services may integrate with third-party services or contain links to external sites. EqoFlow is not responsible for the content, policies, or practices of third parties. Use of third-party services is at your own risk and subject to their respective terms.</p>
                        
                        <h3 className="text-white">16. Service Availability and Disclaimer</h3>
                        <p>The Services are provided on an "as is" and "as available" basis, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee uninterrupted access, error-free operation, or that content will always be accurate, complete, or secure.</p>
                        
                        <h3 className="text-white">17. Changes to Services</h3>
                        <p>We reserve the right to modify, suspend, or discontinue any part of the Services at any time, with or without notice. This includes changes to features, functionality, pricing, or availability. This may include experimental features or beta components that are subject to change or removal.</p>
                        
                        <h3 className="text-white">18. Updates to Terms</h3>
                        <p>EqoFlow may update these Terms periodically. If material changes are made, we will notify you via the Services or by email where feasible. Continued use of the Services after changes take effect constitutes your acceptance of the revised Terms.</p>
                        
                        <h3 className="text-white">19. Account Suspension and Termination</h3>
                        <p>Upon termination, your rights under these Terms will immediately cease.</p>
                        <ul className="list-disc pl-5">
                            <li>You may deactivate your account at any time.</li>
                            <li>We may suspend or terminate accounts that violate these Terms, compromise the integrity of the Services, disrupt other users' experience, or are subject to legal or regulatory action.</li>
                            <li>Termination due to a breach of these terms does not entitle you to any refund or compensation, except where required by applicable law.</li>
                        </ul>
                        
                        <h3 className="text-white">20. Limitation of Liability</h3>
                        <p>EqoFlow does not endorse or guarantee the accuracy of user-generated content. You are solely responsible for your posts and interactions. EqoFlow disclaims liability for content posted by users, any loss or damage arising from reliance on such content, or disputes between users.</p>
                        <p>To the fullest extent permitted by law, EqoFlow's total liability arising out of or relating to these Terms or your use of the Services shall not exceed the greater of: (a) the amount you paid to EqoFlow in the six (6) months prior to the claim, or (b) one hundred dollars (100 USD).</p>
                        
                        <h3 className="text-white">21. Indemnification</h3>
                        <p>You agree to indemnify, defend, and hold harmless EqoFlow, its officers, directors, employees, agents, affiliates, and partners from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorneys' fees) arising out of or related to:</p>
                        <ul className="list-disc pl-5">
                            <li>Your breach of these Terms or violation of any law or third-party right;</li>
                            <li>Your use of the Services or submission of content;</li>
                            <li>Your participation in any rewards program;</li>
                            <li>Claims by other users or third parties, or any regulatory or enforcement action related to your conduct.</li>
                        </ul>
                        
                        <h3 className="text-white">22. Dispute Resolution, Governing Law, and Jurisdiction</h3>
                        <p>In the event of a dispute, EqoFlow encourages amicable resolution through direct communication. If a resolution cannot be reached, these Terms, and any dispute or claim arising out of or in connection with EqoFlow's Services, shall be governed by and construed in accordance with the laws of the State of Nevada, without regard to its conflict of law provisions.</p>
                        
                        <h3 className="text-white">23. Class Action Waiver</h3>
                        <p>You agree that any claims will be brought only in your individual capacity, and not as a plaintiff or class member in any purported class, collective, or representative proceeding. You waive any right to participate in a class action lawsuit or class-wide arbitration.</p>
                        
                        <h3 className="text-white">24. Export Control and Sanctions Compliance</h3>
                        <p>EqoFlow is committed to full compliance with all applicable export control and economic sanctions laws and regulations, including but not limited to the U.S. Export Administration Regulations (EAR), the International Traffic in Arms Regulations (ITAR), and regulations administered by the U.S. Department of the Treasury's Office of Foreign Assets Control (OFAC), as well as similar laws in other relevant jurisdictions.</p>
                        
                        <h3 className="text-white">25. Miscellaneous</h3>
                        <ul className="list-disc pl-5">
                            <li>These Terms constitute the entire agreement between you and EqoFlow regarding your use of the Services and supersede any prior agreements or understandings.</li>
                            <li>These Terms do not create any agency, partnership, joint venture, or employment relationship between you and EqoFlow.</li>
                            <li>You may not assign or transfer your rights or obligations under these Terms without prior written consent from EqoFlow.</li>
                        </ul>
                        
                        <h3 className="text-white">26. Contact Information</h3>
                        <p>For questions or concerns about these Terms, legal notices, or to report violations, email us at support@eqoflow.app</p>
                    </div>
                </main>

                <footer className="p-6 border-t border-purple-500/20 flex flex-col gap-4 flex-shrink-0 bg-slate-900/50">
                    {!scrolledToBottom && (
                        <p className="text-sm text-gray-400 text-center">Please scroll to the bottom to continue</p>
                    )}
                    
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="agree-terms"
                            checked={isChecked}
                            onCheckedChange={setIsChecked}
                            disabled={!scrolledToBottom}
                            className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-purple-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label htmlFor="agree-terms" className="text-sm text-white leading-relaxed cursor-pointer">
                            I have read and agree to the Terms of Service
                        </label>
                    </div>
                    <Button
                        onClick={handleAgreeClick}
                        disabled={!isChecked || !scrolledToBottom}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:bg-gray-500 text-white"
                    >
                        Agree and Continue
                    </Button>
                </footer>
            </motion.div>
        </div>
    );
}
