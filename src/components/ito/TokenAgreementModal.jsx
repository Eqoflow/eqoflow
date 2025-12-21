import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, FileText } from 'lucide-react';

export default function TokenAgreementModal({ onClose, onAgree }) {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const scrollRef = useRef();

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 10) { // A 10px buffer
            setScrolledToBottom(true);
        }
    };

    const handleAgreeClick = () => {
        if (isChecked && scrolledToBottom) {
            onAgree();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
                <header className="p-6 border-b border-purple-500/20 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Token Distribution Agreement</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </Button>
                </header>

                <main className="p-6 overflow-y-auto" onScroll={handleScroll} ref={scrollRef}>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-4">
                        <p>This Token Distribution Agreement (“Agreement”) is entered into by and between EqoFlow Technologies LLC (“EqoFlow”), a limited liability company organized under the laws of the state of Nevada, and the recipient (“Recipient”), collectively referred to as the “Parties.”</p>
                        
                        <h3 className="text-white">1. Purpose of Token Distribution</h3>
                        <p>EqoFlow is distributing its native utility token, $EQOFLO (“Token”), to Recipients who wish to access and participate in the EqoFlow platform ecosystem. The Token is intended solely for functional use and participation within the network and is not offered as an investment.</p>
                        
                        <h3 className="text-white">2. Purchase Terms</h3>
                        <ul className="list-disc pl-5">
                            <li><strong>Token Price:</strong> As listed on EqoFlow’s official website at the time of purchase, which is incorporated herein by reference.</li>
                            <li><strong>Accepted Payment Methods:</strong> USDC (on Solana), credit card, debit card, or other approved processors.</li>
                            <li><strong>Minimum Purchase:</strong>
                                <ul className='list-[circle] pl-5'>
                                    <li>No minimum for transactions via the Solana network</li>
                                    <li>$100.00 USD minimum for transactions via debit/credit card.</li>
                                </ul>
                            </li>
                            <li><strong>Delivery Schedule:</strong> Tokens will be transferred to the Recipient’s designated wallet according to the token release and delivery schedule outlined in Section 5.</li>
                        </ul>

                        <h3 className="text-white">3. Recipient Representations</h3>
                        <p>The Recipient represents and warrants that:</p>
                        <ul className="list-disc pl-5">
                            <li>They are not a citizen or resident of any jurisdiction where token distributions are prohibited.</li>
                            <li>They are acquiring the Token for its intended utility and not for investment, speculative purposes, or with any expectation of future profit or financial return.</li>
                            <li>They acknowledge that they have no expectation of profit or financial return to be derived from the efforts of EqoFlow, its founders, or any third party.</li>
                            <li>They understand the risks associated with blockchain-based assets and token volatility.</li>
                            <li>They understand that they will have to complete any required Know Your Customer (KYC) and Anti-Money Laundering (AML) procedures prior to receiving Tokens.</li>
                        </ul>

                        <h3 className="text-white">4. Nature of the Token</h3>
                        <ul className="list-disc pl-5">
                            <li>The Token is a utility token designed for use within the EqoFlow platform.</li>
                            <li>It does not confer equity, voting rights, dividends, ownership, or any other financial stake in EqoFlow or its assets.</li>
                            <li>The Token is not and will not be registered as a security and is not intended to be treated as such under applicable law.</li>
                        </ul>

                        <h3 className="text-white">5. Token Release and Delivery</h3>
                        <p>To ensure the healthy and gradual decentralization of the EqoFlow platform, all tokens distributed will be subject to the following token release schedule:</p>
                        <h4 className="text-gray-200">5.1 Cliff Period</h4>
                        <p>The cliff period will end when the platform has achieved full operational liquidity, which will occur when all tokens scheduled for release have been allocated for distribution to all eligible Recipients. This will take place following the final phase of the initial token offering and be determined by EqoFlow in its sole discretion.</p>
                        <h4 className="text-gray-200">5.2 Release Schedule</h4>
                        <p>The release schedule will begin immediately following the conclusion of the cliff period and will proceed as outlined on the official EqoFlow website, which is incorporated herein by reference.</p>
                        <h4 className="text-gray-200">5.3 Claiming Unlocked Tokens</h4>
                        <p>Claiming of unlocked Tokens is managed via trust.swap for a secure and transparent process. Recipients must manually initiate the claim process via trust.swap, subject to platform availability, following Token unlock to receive their Tokens.</p>
                        <h4 className="text-gray-200">5.4 Delays</h4>
                        <p>EqoFlow reserves the right to delay delivery of Tokens in case of technical or regulatory issues.</p>
                        
                        <h3 className="text-white">6. Use of Funds</h3>
                        <p>Funds received through the Token Distribution will be allocated for use at the sole discretion of EqoFlow, including but not limited to:</p>
                        <ul className="list-disc pl-5">
                            <li>Platform development and maintenance</li>
                            <li>Operational expenses</li>
                            <li>Marketing and community growth initiatives</li>
                            <li>Legal and compliance efforts</li>
                        </ul>

                        <h3 className="text-white">7. Limitation of Liability</h3>
                        <p>EqoFlow shall not be liable for any indirect, incidental, or consequential damages, including but not limited to:</p>
                        <ul className="list-disc pl-5">
                            <li>Loss of Tokens due to incorrect wallet addresses or user error</li>
                            <li>Market fluctuations or loss of Token value</li>
                            <li>Regulatory changes affecting Token use or availability</li>
                            <li>Any failure of the EqoFlow platform to meet expectations regarding functionality or adoption.</li>
                        </ul>

                        <h3 className="text-white">8. Governing Law</h3>
                        <p>This Agreement shall be governed by and construed in accordance with the laws of the state of Nevada, without regard to conflict of law principles.</p>
                        
                        <h3 className="text-white">9. Miscellaneous</h3>
                        <ul className="list-disc pl-5">
                            <li>This Agreement constitutes the entire understanding between the Parties.</li>
                            <li>If any provision of this Agreement is deemed unenforceable, the remaining provisions shall remain in full force and effect.</li>
                            <li>By sending funds to EqoFlow with the intent of receiving $EQOFLO Tokens, the Recipient agrees to the terms set forth within this Agreement.</li>
                        </ul>
                    </div>
                </main>

                <footer className="p-6 border-t border-purple-500/20 flex-shrink-0 bg-slate-900/50">
                    <div className="flex items-center space-x-2 mb-4">
                        <Checkbox 
                            id="terms" 
                            disabled={!scrolledToBottom} 
                            checked={isChecked}
                            onCheckedChange={() => setIsChecked(!isChecked)}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                        >
                            I have read and understand the EqoFlow Token Distribution Agreement.
                        </label>
                    </div>
                    <Button
                        onClick={handleAgreeClick}
                        disabled={!isChecked || !scrolledToBottom}
                        className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 disabled:opacity-50 disabled:bg-gray-500 text-white"
                    >
                        Agree and Continue
                    </Button>
                    {!scrolledToBottom && (
                        <p className="text-center text-xs text-gray-400 mt-2">Please scroll to the bottom of the agreement to continue.</p>
                    )}
                </footer>
            </motion.div>
        </div>
    );
}