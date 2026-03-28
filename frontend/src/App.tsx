/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  Send, 
  History, 
  QrCode, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  LogOut,
  ExternalLink,
  Coins,
  Search,
  User,
  GraduationCap,
  CreditCard,
  Bell,
  Settings,
  ChevronRight,
  Store,
  ShoppingBag,
  TrendingUp,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  Zap
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Marketplace from "./components/Marketplace";
import SplitExpenses from "./components/SplitExpenses";
import { CampusGigs } from "./components/CampusGigs";
import { CampusPulse } from "./components/CampusPulse";
import { 
  algodClient, 
  getAccountInfo, 
  getTransactionHistory, 
  formatAlgo,
  AccountInfo,
  Transaction,
  peraWallet
} from "./services/algorandService";
import { cn } from "./lib/utils";
import algosdk from "algosdk";
import { ShootingStars } from "./components/ui/shooting-stars";
import { Header } from "./components/ui/header-3";

export default function App() {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "marketplace" | "gigs" | "split" | "send" | "receive" | "history">("dashboard");
  const [showLanding, setShowLanding] = useState(true);

  // Send Form State
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'success'}[]>([]);

  const addNotification = (message: string, type: 'info' | 'success' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const fetchAccountData = useCallback(async (address: string) => {
    try {
      const info = await getAccountInfo(address);
      setAccountInfo(info);
      const history = await getTransactionHistory(address);
      setTransactions(history);
    } catch (error) {
      console.error("Error fetching account data:", error);
    }
  }, []);

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
        fetchAccountData(accounts[0]);
      }
    });
  }, [fetchAccountData]);

  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = (event as ErrorEvent).error || (event as PromiseRejectionEvent).reason;
      const stack = error?.stack || "No stack trace";
      console.error("GLOBAL ERROR CAPTURED:", error);
      if (stack.includes("publicKey") || (error?.message && error.message.includes("publicKey"))) {
        console.error("CRITICAL PUBLICKEY ERROR:", error.message, stack);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        const address = accounts[0];
        setAccountAddress(address);
        fetchAccountData(address);
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      if (error?.message !== "The UI was closed by the user.") {
        alert("Connection failed. Please ensure your Pera Wallet is open and on Testnet.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    await peraWallet.disconnect();
    setAccountAddress(null);
    setAccountInfo(null);
    setTransactions([]);
    setActiveTab("dashboard");
    setShowLanding(true);
  };

  const handleRefresh = async () => {
    if (!accountAddress) return;
    setIsRefreshing(true);
    await fetchAccountData(accountAddress);
    setIsRefreshing(false);
    addNotification("Dashboard updated", "info");
  };

  const handleCopyAddress = () => {
    if (!accountAddress) return;
    navigator.clipboard.writeText(accountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAddress || !recipient || !amount) return;

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const amountInMicroAlgos = Math.round(parseFloat(amount) * 1_000_000);
      
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress,
        receiver: recipient.trim(),
        amount: BigInt(amountInMicroAlgos),
        suggestedParams: suggestedParams,
      });

      const singleTxnGroups = [{ txn, signers: [accountAddress] }];
      const signedTxns = await peraWallet.signTransaction([singleTxnGroups]);
      const response = await algodClient.sendRawTransaction(signedTxns).do();
      const txId = (response as any).txId || (response as any).txid;
      
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      setSendSuccess(`Success! ID: ${txId.slice(0, 8)}...`);
      setRecipient("");
      setAmount("");
      fetchAccountData(accountAddress);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setSendError(error.message || "Transaction failed.");
    } finally {
      setIsSending(false);
    }
  };


  const LandingPage = () => (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0f] overflow-hidden select-none grid-bg">
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Shooting Stars */}
      <ShootingStars 
        starColor="#8B5CF6" 
        trailColor="#3B82F6" 
        minSpeed={15} 
        maxSpeed={35} 
        minDelay={1000}
        maxDelay={3000}
      />
      <ShootingStars 
        starColor="#EC4899" 
        trailColor="#8B5CF6" 
        minSpeed={10} 
        maxSpeed={25} 
        minDelay={2000}
        maxDelay={4000}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-violet-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <Sparkles className="w-3 h-3" />
            Empowering Campus Economy
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
            THE FUTURE OF 
            <br />
            <span className="gradient-text">Campus Pay</span>
          </h1>
          <p className="max-w-xl mx-auto text-zinc-400 text-lg md:text-xl font-medium leading-relaxed">
            The ultimate decentralized ecosystem for student life. Earn, spend, and split ALGO with ease.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLanding(false)}
            className="btn-gradient px-14 py-6 md:px-18 md:py-7 rounded-2xl font-black text-xl md:text-2xl flex items-center justify-center gap-4 mx-auto group mt-8"
          >
            Get Started
            <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-bg flex flex-col">
      <AnimatePresence>
        {showLanding && (
          <motion.div
            key="landing"
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[500]"
          >
            <LandingPage />
          </motion.div>
        )}
      </AnimatePresence>

      <Header 
        activeTab={activeTab as any} 
        setActiveTab={setActiveTab} 
        accountAddress={accountAddress} 
        onLogout={handleLogout}
        onConnect={handleConnectWallet}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-6 md:p-10 overflow-auto">
          {!accountAddress ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-8">
              <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center glow-md rotate-3 glow-border" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <Wallet className="w-10 h-10 text-violet-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">The Future of Campus Payments</h2>
                <p className="text-zinc-400">Secure, instant, and built for students. Connect your wallet to enter the campus ecosystem.</p>
              </div>
              <button 
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full py-4 rounded-2xl btn-gradient flex items-center justify-center gap-3"
              >
                {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                {isConnecting ? "Connecting..." : "Connect Pera Wallet"}
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  >
                    {/* Left Column: Balance & ID */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Campus Pulse (Now in Main Column) */}
                      <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden glow-border min-h-[400px]">
                        <CampusPulse />
                      </div>

                      {/* Student ID Simulation */}
                      <div className="glass-card-hover rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-full bg-white/[0.02] -skew-x-12 translate-x-16 group-hover:translate-x-12 transition-transform duration-700" />
                        <div className="relative z-10 flex gap-6">
                          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                            <User className="w-10 h-10 text-zinc-600" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                              <h4 className="text-xl font-bold text-white">Student ID Card</h4>
                              <p className="text-sm text-zinc-500">Verified Web3 Identity</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Status</p>
                                <p className="text-sm font-bold text-emerald-400">Active</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Network</p>
                                <p className="text-sm font-bold text-white">Testnet</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Quick Actions & Recent */}
                    <div className="space-y-8">
                      <div className="glass-card rounded-[2rem] p-6 space-y-6">
                        <h4 className="text-sm font-bold text-white px-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <button 
                            onClick={() => setActiveTab("marketplace")}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
                                <Store className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-bold text-zinc-300">Campus Store</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                          </button>
                          <button 
                            onClick={() => setActiveTab("gigs")}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-bold text-zinc-300">Campus Gigs</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                          </button>
                          <button 
                            onClick={() => setActiveTab("split")}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-bold text-zinc-300">Split Expenses</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>

                      <div className="glass-card rounded-[2rem] p-6 space-y-6">
                        <div className="flex justify-between items-center px-2">
                          <h4 className="text-sm font-bold text-white">Recent Activity</h4>
                          <button onClick={() => setActiveTab("history")} className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">View All</button>
                        </div>
                        <div className="space-y-4">
                          {transactions.slice(0, 3).map(tx => {
                            const isSent = tx.sender === accountAddress;
                            return (
                              <div key={tx.id} className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isSent ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400")}>
                                  {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white truncate">
                                    {isSent ? `To: ${tx.receiver.slice(0, 6)}...` : `From: ${tx.sender.slice(0, 6)}...`}
                                  </p>
                                  <p className="text-[10px] text-zinc-600">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                </div>
                                <p className={cn("text-xs font-bold", isSent ? "text-red-400" : "text-emerald-400")}>
                                  {isSent ? "-" : "+"}{formatAlgo(tx.amount)}
                                </p>
                              </div>
                            );
                          })}
                          {transactions.length === 0 && <p className="text-center text-xs text-zinc-600 py-4">No recent activity</p>}
                        </div>
                      </div>

                      {/* Balance Card (Now in Right Column) */}
                      <div className="glass-card rounded-[2rem] p-6 space-y-6 relative overflow-hidden glow-border">
                         <div className="absolute -right-6 -top-6 opacity-5">
                            <Coins className="w-32 h-32 text-violet-400" />
                         </div>
                         <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                               <div className="space-y-1">
                                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest px-1">Total Balance</p>
                                  <div className="flex items-baseline gap-1">
                                     <h3 className="text-3xl font-bold tracking-tighter text-white">
                                        {accountInfo ? formatAlgo(accountInfo.amount) : "0.00"}
                                     </h3>
                                     <span className="text-xs font-medium text-zinc-500">ALGO</span>
                                  </div>
                               </div>
                               <button 
                                  onClick={handleRefresh}
                                  className={cn("p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all", isRefreshing && "animate-spin")}
                               >
                                  <RefreshCw className="w-4 h-4 text-zinc-400" />
                               </button>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2">
                               <button 
                                  onClick={() => setActiveTab("send")}
                                  className="flex-1 btn-gradient py-2 rounded-xl font-bold text-[10px]"
                               >
                                  Send
                               </button>
                               <button 
                                  onClick={() => setActiveTab("receive")}
                                  className="flex-1 bg-white/5 border border-white/10 text-white py-2 rounded-xl font-bold text-[10px] hover:bg-white/10 transition-all"
                               >
                                  Receive
                               </button>
                            </div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "marketplace" && (
                  <motion.div
                    key="marketplace"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Marketplace 
                      accountAddress={accountAddress} 
                      onRefreshBalance={handleRefresh}
                    />
                  </motion.div>
                )}

                {activeTab === "gigs" && (
                  <motion.div
                    key="gigs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CampusGigs 
                      accountAddress={accountAddress} 
                    />
                  </motion.div>
                )}

                {activeTab === "split" && (
                  <motion.div
                    key="split"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <SplitExpenses 
                      accountAddress={accountAddress} 
                    />
                  </motion.div>
                )}

                {activeTab === "send" && (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="max-w-xl mx-auto glass-card rounded-[2.5rem] p-8 md:p-12 space-y-8 glow-border"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 btn-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Send Payment</h3>
                      <p className="text-zinc-500">Transfer ALGO instantly to any student or merchant.</p>
                    </div>

                    <form onSubmit={handleSendTransaction} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Recipient Address</label>
                        <input 
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Paste address or select from directory"
                          className="w-full px-5 py-4 rounded-2xl input-dark font-mono text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Amount</label>
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.000001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-5 py-4 rounded-2xl input-dark text-2xl font-bold tracking-tight"
                            required
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-zinc-500">ALGO</div>
                        </div>
                      </div>

                      {sendError && <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-medium border border-red-500/20">{sendError}</div>}
                      {sendSuccess && <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl text-sm font-medium border border-emerald-500/20">{sendSuccess}</div>}

                      <button 
                        type="submit"
                        disabled={isSending}
                        className="w-full py-5 rounded-2xl btn-gradient flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSending ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        {isSending ? "Processing..." : "Confirm Payment"}
                      </button>
                    </form>
                  </motion.div>
                )}

                {activeTab === "receive" && (
                  <motion.div
                    key="receive"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="max-w-xl mx-auto glass-card rounded-[2.5rem] p-12 flex flex-col items-center text-center space-y-10 glow-border"
                  >
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white tracking-tight">Your QR Code</h3>
                      <p className="text-zinc-500">Show this to others to receive payments.</p>
                    </div>

                    <div className="p-8 bg-white rounded-[3rem] relative group">
                      <QRCodeSVG 
                        value={accountAddress} 
                        size={240}
                        level="H"
                        className="rounded-xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-[3rem]">
                        <button onClick={handleCopyAddress} className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy Address"}
                        </button>
                      </div>
                    </div>

                    <div className="w-full space-y-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl font-mono text-xs text-zinc-400 break-all">
                        {accountAddress}
                      </div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Algorand Testnet Address</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Transaction History</h3>
                        <p className="text-sm text-zinc-500">Your recent campus activity.</p>
                      </div>
                      <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm font-bold text-zinc-400 hover:text-white transition-all"
                      >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        Refresh
                      </button>
                    </div>

                    <div className="glass-card rounded-[2rem] overflow-hidden">
                      {transactions.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {transactions.map(tx => {
                            const isSent = tx.sender === accountAddress;
                            return (
                              <div key={tx.id} className="p-6 flex items-center gap-6 hover:bg-white/[0.02] transition-all group">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isSent ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400")}>
                                  {isSent ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex justify-between items-start">
                                    <p className="font-bold text-white truncate">
                                      {isSent ? `Transfer to ${tx.receiver.slice(0, 12)}...` : `Received from ${tx.sender.slice(0, 12)}...`}
                                    </p>
                                    <p className={cn("text-lg font-bold", isSent ? "text-red-400" : "text-emerald-400")}>
                                      {isSent ? "-" : "+"}{formatAlgo(tx.amount)} ALGO
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                                      <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                                      <span>•</span>
                                      <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <a 
                                      href={`https://testnet.explorer.perawallet.app/tx/${tx.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs font-bold text-zinc-600 group-hover:text-violet-400 transition-colors"
                                    >
                                      Explorer <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                            <History className="w-10 h-10 text-zinc-700" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-white">No transactions yet</p>
                            <p className="text-sm text-zinc-500">Your history will appear here once you start paying.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Notifications Toast */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "p-4 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[280px] pointer-events-auto backdrop-blur-xl",
                n.type === 'success' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/20" : "bg-white/5 text-white border-white/10"
              )}
            >
              {n.type === 'success' ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5 text-zinc-400" />}
              <span className="text-sm font-bold">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
