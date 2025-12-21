import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, CheckCircle, Shield, Code } from "lucide-react";
import { motion } from "framer-motion";

const programs = {
  confidential_matching: {
    name: "Confidential Interest Matching",
    description: "Matches users based on encrypted interests without revealing the interests",
    code: `"""
Confidential Interest Matching Program
Compares two users' encrypted interest lists and returns a compatibility score
without revealing the actual interests to either party.
"""

from nada_dsl import *

def nada_main():
    # Define parties
    user1 = Party(name="user1")
    user2 = Party(name="user2")
    output_party = Party(name="output")
    
    # User 1's interests (array of 10 interest slots, 1 = has interest, 0 = doesn't)
    user1_interests = []
    for i in range(10):
        user1_interests.append(SecretInteger(Input(name=f"user1_interest_{i}", party=user1)))
    
    # User 2's interests (array of 10 interest slots)
    user2_interests = []
    for i in range(10):
        user2_interests.append(SecretInteger(Input(name=f"user2_interest_{i}", party=user2)))
    
    # Count matching interests
    match_count = Integer(0)
    for i in range(10):
        # If both have the same interest (both 1 or both 0 on matching), increment
        is_match = (user1_interests[i] == user2_interests[i]) & (user1_interests[i] == Integer(1))
        match_count = match_count + is_match.if_else(Integer(1), Integer(0))
    
    # Calculate compatibility percentage (0-100)
    # If 3+ matches, they're compatible
    is_compatible = match_count >= Integer(3)
    compatibility_score = is_compatible.if_else(Integer(1), Integer(0))
    
    # Return results to output party
    return [
        Output(compatibility_score, "is_compatible", output_party),
        Output(match_count, "match_count", output_party)
    ]`
  },
  age_verification: {
    name: "Age Verification",
    description: "Verifies if a user meets minimum age without revealing exact age/birthdate",
    code: `"""
Age Verification Program
Verifies if a user meets a minimum age requirement without revealing their exact age/birthdate.
"""

from nada_dsl import *

def nada_main():
    # Define parties
    user = Party(name="user")
    verifier = Party(name="verifier")
    output_party = Party(name="output")
    
    # User's birth year (encrypted)
    birth_year = SecretInteger(Input(name="birth_year", party=user))
    
    # Current year (public input from verifier)
    current_year = PublicInteger(Input(name="current_year", party=verifier))
    
    # Minimum age requirement (e.g., 18)
    min_age = PublicInteger(Input(name="min_age", party=verifier))
    
    # Calculate age
    age = current_year - birth_year
    
    # Check if user meets minimum age
    meets_requirement = age >= min_age
    
    # Return only boolean result (1 = meets requirement, 0 = doesn't)
    verification_result = meets_requirement.if_else(Integer(1), Integer(0))
    
    return [Output(verification_result, "is_verified", output_party)]`
  },
  anonymous_voting: {
    name: "Anonymous Voting",
    description: "Aggregates encrypted votes without revealing individual choices",
    code: `"""
Anonymous Voting Program
Allows users to cast encrypted votes that are aggregated without revealing individual choices.
"""

from nada_dsl import *

def nada_main():
    # Define parties
    voter1 = Party(name="voter1")
    voter2 = Party(name="voter2")
    voter3 = Party(name="voter3")
    output_party = Party(name="output")
    
    # Each voter's choice (1 = yes, 0 = no)
    vote1 = SecretInteger(Input(name="vote1", party=voter1))
    vote2 = SecretInteger(Input(name="vote2", party=voter2))
    vote3 = SecretInteger(Input(name="vote3", party=voter3))
    
    # Aggregate votes
    total_yes = vote1 + vote2 + vote3
    total_no = Integer(3) - total_yes
    
    # Determine outcome (majority wins)
    outcome = total_yes > Integer(1)  # More than half voted yes
    result = outcome.if_else(Integer(1), Integer(0))
    
    return [
        Output(result, "voting_outcome", output_party),
        Output(total_yes, "yes_count", output_party),
        Output(total_no, "no_count", output_party)
    ]`
  },
  uniqueness_verification: {
    name: "Uniqueness Verification",
    description: "Verifies if an encrypted identifier is unique without revealing it",
    code: `"""
Uniqueness Verification Program
Verifies if an encrypted identifier is unique across a set without revealing the identifier.
"""

from nada_dsl import *

def nada_main():
    # Define parties
    new_user = Party(name="new_user")
    existing_user1 = Party(name="existing_user1")
    existing_user2 = Party(name="existing_user2")
    output_party = Party(name="output")
    
    # New user's identifier hash
    new_id = SecretInteger(Input(name="new_identifier", party=new_user))
    
    # Existing users' identifier hashes
    existing_id1 = SecretInteger(Input(name="existing_id1", party=existing_user1))
    existing_id2 = SecretInteger(Input(name="existing_id2", party=existing_user2))
    
    # Check if new ID matches any existing IDs
    matches_user1 = new_id == existing_id1
    matches_user2 = new_id == existing_id2
    
    # User is unique if they don't match anyone
    is_unique = ~(matches_user1 | matches_user2)
    uniqueness_result = is_unique.if_else(Integer(1), Integer(0))
    
    return [Output(uniqueness_result, "is_unique", output_party)]`
  }
};

export default function NillionMPCDeployment() {
  const [copiedProgram, setCopiedProgram] = useState(null);

  const handleCopy = (programKey, code) => {
    navigator.clipboard.writeText(code);
    setCopiedProgram(programKey);
    setTimeout(() => setCopiedProgram(null), 2000);
  };

  const handleDownload = (programKey, code) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${programKey}.py`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Nillion MPC Program Deployment</h1>
              <p className="text-gray-400">Deploy privacy-preserving computation programs to the Nillion network</p>
            </div>
          </div>

          <Alert className="bg-purple-600/10 border-purple-500/20 mb-6">
            <Shield className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-purple-300">
              These MPC programs power EqoFlow's privacy features. Deploy them to the Nillion network to enable real privacy-preserving computation.
            </AlertDescription>
          </Alert>
        </motion.div>

        <Tabs defaultValue="instructions" className="space-y-6">
          <TabsList className="bg-black/40 border border-gray-800">
            <TabsTrigger value="instructions">Deployment Instructions</TabsTrigger>
            <TabsTrigger value="programs">MPC Programs</TabsTrigger>
            <TabsTrigger value="testing">Testing Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions">
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-400" />
                  Step-by-Step Deployment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Install Nillion SDK</h3>
                      <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                        <code className="text-sm text-gray-300">pip install nillion-client</code>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Or follow the official documentation at{" "}
                        <a href="https://docs.nillion.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          https://docs.nillion.com/
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Download MPC Programs</h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Go to the "MPC Programs" tab and download each .py file, or copy the code directly.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Compile Programs</h3>
                      <div className="bg-black/40 p-4 rounded-lg border border-gray-800 space-y-2">
                        <code className="text-sm text-gray-300 block">nada compile confidential_matching.py</code>
                        <code className="text-sm text-gray-300 block">nada compile age_verification.py</code>
                        <code className="text-sm text-gray-300 block">nada compile anonymous_voting.py</code>
                        <code className="text-sm text-gray-300 block">nada compile uniqueness_verification.py</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Deploy to Nillion Testnet</h3>
                      <div className="bg-black/40 p-4 rounded-lg border border-gray-800 space-y-2">
                        <code className="text-sm text-gray-300 block">nada deploy confidential_matching --network testnet</code>
                        <code className="text-sm text-gray-300 block">nada deploy age_verification --network testnet</code>
                        <code className="text-sm text-gray-300 block">nada deploy anonymous_voting --network testnet</code>
                        <code className="text-sm text-gray-300 block">nada deploy uniqueness_verification --network testnet</code>
                      </div>
                      <Alert className="bg-yellow-600/10 border-yellow-500/20 mt-3">
                        <AlertDescription className="text-yellow-300 text-sm">
                          <strong>Important:</strong> Save the Program IDs returned from each deployment command.
                          Example: "Program deployed with ID: program_abc123xyz"
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      5
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Update Environment Variables</h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Add these to your Dashboard → Settings → Environment Variables:
                      </p>
                      <div className="bg-black/40 p-4 rounded-lg border border-gray-800 space-y-2">
                        <code className="text-sm text-gray-300 block">NILLION_CONFIDENTIAL_MATCHING_PROGRAM_ID=your_program_id</code>
                        <code className="text-sm text-gray-300 block">NILLION_AGE_VERIFICATION_PROGRAM_ID=your_program_id</code>
                        <code className="text-sm text-gray-300 block">NILLION_ANONYMOUS_VOTING_PROGRAM_ID=your_program_id</code>
                        <code className="text-sm text-gray-300 block">NILLION_UNIQUENESS_PROGRAM_ID=your_program_id</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Test Your Deployment</h3>
                      <p className="text-sm text-gray-400">
                        Once deployed, test each feature through the EqoFlow UI. See the "Testing Guide" tab for details.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programs">
            <div className="space-y-6">
              {Object.entries(programs).map(([key, program]) => (
                <Card key={key} className="dark-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {program.name}
                          <Badge className="bg-purple-600/20 text-purple-300">
                            {key}.py
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-400 mt-1">{program.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopy(key, program.code)}
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30"
                        >
                          {copiedProgram === key ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDownload(key, program.code)}
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black/60 p-4 rounded-lg border border-gray-800 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{program.code}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testing">
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Testing Your Deployment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Badge className="bg-purple-600">1</Badge>
                      Confidential Interest Matching
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>Location:</strong> Discovery Page → "Find Confidential Connections" button
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>How to test:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-4">
                      <li>Go to Privacy Hub and store some private interests</li>
                      <li>Have another test user store different interests</li>
                      <li>Click "Find Confidential Connections" on Discovery page</li>
                      <li>Verify that matches are found without revealing interests</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Badge className="bg-purple-600">2</Badge>
                      Age Verification
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>Location:</strong> Privacy Hub → Anonymous Governance → Age Verification
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>How to test:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-4">
                      <li>Store your birthdate (encrypted)</li>
                      <li>Click "Verify Age"</li>
                      <li>Confirm verification result without revealing birthdate</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Badge className="bg-purple-600">3</Badge>
                      Anonymous Voting
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>Location:</strong> Privacy Hub → Anonymous Governance → Vote
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>How to test:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-4">
                      <li>Cast an anonymous vote (Yes/No)</li>
                      <li>Verify vote is stored without revealing your identity</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Badge className="bg-purple-600">4</Badge>
                      Uniqueness Verification
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>Location:</strong> Privacy Hub → Private Identity
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>How to test:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-4">
                      <li>Generate a uniqueness proof</li>
                      <li>Try generating same proof again (should be rejected)</li>
                      <li>Verify uniqueness without revealing identifier</li>
                    </ul>
                  </div>
                </div>

                <Alert className="bg-blue-600/10 border-blue-500/20">
                  <AlertDescription className="text-blue-300 text-sm">
                    <strong>Note:</strong> Until MPC programs are deployed, the system uses simulated results.
                    Once deployed and environment variables are set, all features will automatically use real MPC computation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}