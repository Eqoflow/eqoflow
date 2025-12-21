import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from 'lucide-react';

export default function NDA() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Non-Disclosure Agreement (NDA)
          </h1>
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-5 h-5" />
            <span>Confidential & Proprietary Information</span>
          </div>
        </div>

        <Card className="dark-card mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-xl">
              <p className="text-red-300 font-medium">
                This document contains highly confidential and proprietary information regarding QuantumFlow's 
                revolutionary decentralized social platform. Unauthorized disclosure is strictly prohibited and 
                subject to substantial financial penalties.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="p-8 space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                MUTUAL NON-DISCLOSURE AGREEMENT
              </h2>
              <p className="text-gray-300">
                Between QuantumFlow Technologies and Prospective Investor/Partner
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Effective Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">1. PARTIES</h3>
              <p className="text-gray-200">
                This Non-Disclosure Agreement ("Agreement") is entered into between:
              </p>
              <div className="ml-4 space-y-2">
                <p className="text-gray-200">
                  <strong className="text-white">"Company":</strong> QuantumFlow Technologies, a technology company 
                  developing revolutionary decentralized social media and financial infrastructure platforms.
                </p>
                <p className="text-gray-200">
                  <strong className="text-white">"Recipient":</strong> The individual or entity receiving confidential 
                  information for the purpose of evaluating potential investment, partnership, or business opportunities.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">2. PURPOSE</h3>
              <p className="text-gray-200">
                The parties wish to explore potential business opportunities, including but not limited to investment, 
                partnership, acquisition, joint venture, or strategic collaboration relating to QuantumFlow's 
                comprehensive decentralized social ecosystem.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">3. CONFIDENTIAL INFORMATION</h3>
              <p className="text-gray-200">
                "Confidential Information" includes, but is not limited to:
              </p>
              
              <div className="ml-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-white">A. Technical Information:</h4>
                  <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                    <li>QuantumFlow's decentralized social media platform architecture</li>
                    <li>$QFLOW token economics, tokenomics models, and financial algorithms</li>
                    <li>Smart contract implementations and blockchain integrations</li>
                    <li>Cross-platform identity verification systems and methodologies</li>
                    <li>NFT gating technology and access control mechanisms</li>
                    <li>Live streaming infrastructure and Mux integration protocols</li>
                    <li>AI-powered content moderation and recommendation algorithms</li>
                    <li>Virtual reality social spaces and 3D rendering technologies</li>
                    <li>Decentralized governance and DAO voting mechanisms</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white">B. Business Information:</h4>
                  <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                    <li>Financial projections, revenue models, and monetization strategies</li>
                    <li>User acquisition strategies and growth metrics</li>
                    <li>Partnership agreements and strategic alliances</li>
                    <li>Competitive analysis and market positioning strategies</li>
                    <li>Future product roadmap and development timelines</li>
                    <li>Investment terms, valuations, and funding requirements</li>
                    <li>Operational procedures and business processes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white">C. Platform Features:</h4>
                  <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                    <li>Engagement Point (EP) reward system and conversion mechanisms</li>
                    <li>Skills marketplace and peer-to-peer service exchange</li>
                    <li>Community token creation and management systems</li>
                    <li>Crowdsourcing and fundraising platform capabilities</li>
                    <li>Professional credential verification processes</li>
                    <li>Privacy hub and data monetization features</li>
                    <li>Direct messaging and encrypted communication systems</li>
                    <li>Trading platform and cryptocurrency exchange integration</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white">D. Proprietary Data:</h4>
                  <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                    <li>User data, analytics, and behavioral patterns</li>
                    <li>Source code, APIs, and technical specifications</li>
                    <li>Database schemas and data structures</li>
                    <li>Security protocols and authentication methods</li>
                    <li>Any information marked as "Confidential" or "Proprietary"</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">4. OBLIGATIONS</h3>
              <p className="text-gray-200">
                The Recipient agrees to:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                <li>Hold all Confidential Information in strict confidence</li>
                <li>Not disclose Confidential Information to any third parties without prior written consent</li>
                <li>Use Confidential Information solely for the evaluation purpose stated herein</li>
                <li>Take reasonable precautions to prevent unauthorized disclosure</li>
                <li>Not reverse engineer, decompile, or attempt to derive source code</li>
                <li>Not use Confidential Information to compete with or develop competing products</li>
                <li>Return or destroy all Confidential Information upon request</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">5. EXCEPTIONS</h3>
              <p className="text-gray-200">
                The obligations above do not apply to information that:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                <li>Is publicly available through no breach of this Agreement</li>
                <li>Was known to Recipient prior to disclosure</li>
                <li>Is independently developed without use of Confidential Information</li>
                <li>Is required to be disclosed by law or court order</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-red-400">6. LIQUIDATED DAMAGES</h3>
              <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-xl">
                <p className="text-red-200 font-medium">
                  The parties acknowledge that any breach of this Agreement would cause irreparable harm to the Company 
                  that cannot be adequately compensated by monetary damages alone. Therefore, in addition to any other 
                  remedies available at law or in equity:
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-red-100">
                    <strong>A. LIQUIDATED DAMAGES:</strong> Upon any unauthorized disclosure, use, or breach of this Agreement, 
                    Recipient shall immediately pay Company liquidated damages of THREE MILLION DOLLARS ($3,000,000 USD) 
                    for each separate breach or violation.
                  </p>
                  <p className="text-red-100">
                    <strong>B. INJUNCTIVE RELIEF:</strong> Company shall be entitled to immediate injunctive relief to 
                    prevent further breaches without posting bond or proving irreparable harm.
                  </p>
                  <p className="text-red-100">
                    <strong>C. ATTORNEY FEES:</strong> The breaching party shall pay all attorney fees, costs, and expenses 
                    incurred in enforcing this Agreement.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">7. NO RIGHTS GRANTED</h3>
              <p className="text-gray-200">
                This Agreement does not grant any rights in Confidential Information except as expressly stated. 
                No license, ownership interest, or other rights are granted in any intellectual property, patents, 
                trademarks, or copyrights.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">8. TERM</h3>
              <p className="text-gray-200">
                This Agreement shall remain in effect for five (5) years from the Effective Date, unless terminated 
                earlier by written agreement. The obligations regarding Confidential Information shall survive 
                termination indefinitely.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">9. GOVERNING LAW</h3>
              <p className="text-gray-200">
                This Agreement shall be governed by and construed in accordance with the laws of [JURISDICTION TO BE SPECIFIED], 
                without regard to conflict of law principles. Any disputes shall be resolved in the courts of 
                [JURISDICTION TO BE SPECIFIED].
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-purple-400">10. MISCELLANEOUS</h3>
              <ul className="list-disc list-inside ml-4 text-gray-200 space-y-1">
                <li>This Agreement constitutes the entire agreement between the parties</li>
                <li>Modifications must be in writing and signed by both parties</li>
                <li>If any provision is unenforceable, the remainder shall remain in full force</li>
                <li>This Agreement is binding upon successors and assigns</li>
                <li>Electronic signatures are acceptable and legally binding</li>
              </ul>
            </section>

            <div className="border-t border-gray-700 pt-8 mt-8">
              <h3 className="text-xl font-bold text-purple-400 mb-4">SIGNATURE SECTION</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">QUANTUMFLOW TECHNOLOGIES:</h4>
                  <div className="space-y-2 text-gray-200">
                    <p>Signature: _________________________</p>
                    <p>Name: _____________________________</p>
                    <p>Title: ____________________________</p>
                    <p>Date: _____________________________</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">RECIPIENT:</h4>
                  <div className="space-y-2 text-gray-200">
                    <p>Signature: _________________________</p>
                    <p>Name: _____________________________</p>
                    <p>Title: ____________________________</p>
                    <p>Date: _____________________________</p>
                    <p>Company: __________________________</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl">
              <p className="text-purple-200 text-sm">
                <strong>NOTICE:</strong> This NDA template should be reviewed by qualified legal counsel before use. 
                Jurisdiction-specific requirements may apply. QuantumFlow Technologies reserves the right to modify 
                terms based on specific transaction requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-gray-400">
          <p className="text-sm">
            Document generated on {new Date().toLocaleDateString()} | Version 1.0
          </p>
        </div>
      </div>
    </div>
  );
}