import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Plus, 
  Receipt, 
  ChevronRight, 
  ArrowRight, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { cn } from "../lib/utils";
import { API_BASE, peraWallet, algodClient, formatAlgo } from "../services/algorandService";
import algosdk from "algosdk";

interface Group {
  id: number;
  name: string;
  created_at: string;
}

interface Participant {
  address: string;
}

interface Split {
  address: string;
  share: number;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  payer_address: string;
  created_at: string;
  splits: Split[];
}

interface Settlement {
  id: number;
  from_address: string;
  to_address: string;
  amount: number;
  tx_id: string;
  created_at: string;
}

interface SplitExpensesProps {
  accountAddress: string;
}

export default function SplitExpenses({ accountAddress }: SplitExpensesProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupDetails, setGroupDetails] = useState<{ group: Group; participants: Participant[]; expenses: Expense[]; settlements: Settlement[] } | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isRecordingManual, setIsRecordingManual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupParticipants, setNewGroupParticipants] = useState<string[]>([accountAddress]);
  const [participantInput, setParticipantInput] = useState("");

  // Add Expense Form State
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "amount">("equal");
  const [weightedDist, setWeightedDist] = useState<Record<string, string>>({});

  // Manual Settlement Form State
  const [manualFrom, setManualFrom] = useState("");
  const [manualTo, setManualTo] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/groups/${accountAddress}`);
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  }, [accountAddress]);

  const fetchGroupDetails = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups/${id}/details`);
      const data = await res.json();
      setGroupDetails(data);
      setExpenseParticipants(data.participants.map((p: any) => p.address));
    } catch (err) {
      console.error("Failed to fetch group details", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId, fetchGroupDetails]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || newGroupParticipants.length < 2) return;

    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, participants: newGroupParticipants }),
      });
      const data = await res.json();
      setGroups([...groups, data]);
      setIsCreatingGroup(false);
      setNewGroupName("");
      setNewGroupParticipants([accountAddress]);
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const handleAddParticipant = () => {
    if (!participantInput || newGroupParticipants.includes(participantInput)) return;
    setNewGroupParticipants([...newGroupParticipants, participantInput]);
    setParticipantInput("");
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !expenseDesc || !expenseAmount || expenseParticipants.length === 0) return;

    const amount = parseFloat(expenseAmount);
    let splits: Split[];
    
    if (splitType === "equal") {
      const share = amount / expenseParticipants.length;
      splits = expenseParticipants.map(addr => ({ address: addr, share }));
    } else if (splitType === "percentage") {
      splits = expenseParticipants.map(addr => {
        const percentage = parseFloat(weightedDist[addr] || "0");
        return { address: addr, share: (amount * percentage) / 100 };
      });
    } else {
      // Fixed amount split
      splits = expenseParticipants.map(addr => ({ 
        address: addr, 
        share: parseFloat(weightedDist[addr] || "0") 
      }));
      
      const totalSplit = splits.reduce((sum, s) => sum + s.share, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        alert("Total split amounts must equal total expense amount");
        return;
      }
    }

    try {
      await fetch(`${API_BASE}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          description: expenseDesc,
          amount,
          payerAddress: accountAddress,
          splits,
        }),
      });
      fetchGroupDetails(selectedGroupId);
      setIsAddingExpense(false);
      setExpenseDesc("");
      setExpenseAmount("");
    } catch (err) {
      console.error("Failed to add expense", err);
    }
  };

  const calculateBalances = () => {
    if (!groupDetails) return [];
    const balances: Record<string, number> = {};
    
    groupDetails.participants.forEach(p => balances[p.address] = 0);
    
    groupDetails.expenses.forEach(exp => {
      // Payer gets back the amount they paid
      balances[exp.payer_address] += exp.amount;
      // Everyone in the split owes their share
      exp.splits.forEach(split => {
        balances[split.address] -= split.share;
      });
    });

    // Add settlements to balance
    groupDetails.settlements.forEach(settle => {
      // Sender paid, so their balance increases (they owe less or are owed more)
      balances[settle.from_address] += settle.amount;
      // Receiver got paid, so their balance decreases (they are owed less or owe more)
      balances[settle.to_address] -= settle.amount;
    });

    return Object.entries(balances).map(([address, balance]) => ({ address, balance }));
  };

  const handleSettle = async (to: string, amount: number) => {
    if (amount <= 0) return;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const amountInMicroAlgos = Math.round(amount * 1_000_000);
      
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress,
        receiver: to,
        amount: amountInMicroAlgos,
        suggestedParams: suggestedParams,
      });

      const singleTxnGroups = [{ txn, signers: [accountAddress] }];
      const signedTxns = await peraWallet.signTransaction([singleTxnGroups]);
      const response = await algodClient.sendRawTransaction(signedTxns).do();
      const txId = (response as any).txId || (response as any).txid;
      
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      // Record settlement in backend
      await fetch(`${API_BASE}/api/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          fromAddress: accountAddress,
          toAddress: to,
          amount: amount,
          txId: txId
        }),
      });

      alert(`Settlement successful! ID: ${txId}`);
      fetchGroupDetails(selectedGroupId!);
    } catch (err) {
      console.error("Settlement failed", err);
      alert("Settlement failed. See console for details.");
    }
  };

  const handleManualSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !manualFrom || !manualTo || !manualAmount) return;

    try {
      await fetch(`${API_BASE}/api/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          fromAddress: manualFrom,
          toAddress: manualTo,
          amount: parseFloat(manualAmount),
          txId: "MANUAL-" + Math.random().toString(36).slice(2, 9).toUpperCase()
        }),
      });
      fetchGroupDetails(selectedGroupId);
      setIsRecordingManual(false);
      setManualAmount("");
    } catch (err) {
      console.error("Manual settlement failed", err);
    }
  };

  const balances = calculateBalances();

  return (
    <div className="space-y-6">
      {!selectedGroupId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Expense Groups</h2>
            <button 
              onClick={() => setIsCreatingGroup(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-gradient text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Group
            </button>
          </div>

          {isCreatingGroup && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Create New Group</h3>
                <button onClick={() => setIsCreatingGroup(false)} className="text-zinc-500 hover:text-zinc-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Group Name</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Weekend Trip"
                    className="w-full px-4 py-2.5 rounded-xl input-dark focus:ring-2 focus:ring-violet-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Add Participants (Address)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      placeholder="Algorand Address"
                      className="flex-1 px-4 py-2.5 rounded-xl input-dark focus:ring-2 focus:ring-violet-500/30 transition-all text-sm"
                    />
                    <button 
                      type="button"
                      onClick={handleAddParticipant}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors border border-white/10"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {newGroupParticipants.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-xs font-mono truncate max-w-[200px] text-zinc-400">{p === accountAddress ? "You" : p}</span>
                      {p !== accountAddress && (
                        <button 
                          type="button"
                          onClick={() => setNewGroupParticipants(newGroupParticipants.filter(addr => addr !== p))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  type="submit"
                  disabled={!newGroupName || newGroupParticipants.length < 2}
                  className="w-full py-3 rounded-xl btn-gradient font-medium transition-all disabled:opacity-50"
                >
                  Create Group
                </button>
              </form>
            </div>
          )}

          <div className="grid gap-3">
            {groups.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500">No groups yet. Create one to start splitting expenses!</p>
              </div>
            ) : (
              groups.map((group) => (
                <button 
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className="flex items-center justify-between p-4 rounded-2xl glass-card-hover group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{group.name}</h3>
                      <p className="text-xs text-zinc-500">Created {new Date(group.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedGroupId(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 transition-colors"
              >
                <Trash2 className="w-4 h-4 rotate-45" />
              </button>
              <h2 className="text-xl font-semibold text-white">{groupDetails?.group.name}</h2>
            </div>
            <button 
              onClick={() => fetchGroupDetails(selectedGroupId!)}
              className={cn("p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 transition-colors", isLoading && "animate-spin")}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balances Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Balances</h3>
              <div className="glass-card p-6 rounded-3xl space-y-4">
                {balances.map(({ address, balance }) => (
                  <div key={address} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        balance > 0 ? "bg-emerald-500/10 text-emerald-400" : balance < 0 ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-500"
                      )}>
                        {balance > 0 ? <ArrowUpRight className="w-4 h-4" /> : balance < 0 ? <ArrowDownLeft className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="max-w-[120px]">
                        <p className="text-xs font-mono truncate text-zinc-400">{address === accountAddress ? "You" : address}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-medium">
                          {balance > 0 ? "is owed" : balance < 0 ? "owes" : "settled"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        balance > 0 ? "text-emerald-400" : balance < 0 ? "text-red-400" : "text-zinc-500"
                      )}>
                        {Math.abs(balance).toFixed(2)} <span className="text-[10px]">ALGO</span>
                      </p>
                      {balance < 0 && address === accountAddress && (
                        <button 
                          onClick={() => {
                            const owedTo = balances.find(b => b.balance > 0);
                            if (owedTo) handleSettle(owedTo.address, Math.abs(balance));
                          }}
                          className="text-[10px] font-bold text-violet-400 underline underline-offset-2 hover:text-violet-300"
                        >
                          Settle Now
                        </button>
                      )}
                      {balance > 0 && address === accountAddress && (
                        <button 
                          onClick={() => {
                            const owesMe = balances.find(b => b.balance < 0);
                            if (owesMe) {
                              setManualFrom(owesMe.address);
                              setManualTo(accountAddress);
                              setManualAmount(Math.abs(owesMe.balance).toString());
                              setIsRecordingManual(true);
                            }
                          }}
                          className="text-[10px] font-bold text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setManualFrom("");
                  setManualTo("");
                  setManualAmount("");
                  setIsRecordingManual(true);
                }}
                className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-zinc-500 text-xs font-medium hover:bg-white/5 transition-colors"
              >
                Record Manual Payment
              </button>
            </div>

            {/* Expenses Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Expenses</h3>
                <button 
                  onClick={() => setIsAddingExpense(true)}
                  className="p-1.5 rounded-lg btn-gradient transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isAddingExpense && (
                <div className="glass-card p-6 rounded-3xl space-y-4 glow-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add Bill</h4>
                    <button onClick={() => setIsAddingExpense(false)} className="text-zinc-400 hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <input 
                      type="text" 
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="Description (e.g. Dinner)"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <input 
                      type="number" 
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="Amount in ALGO"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Split among:</p>
                      <div className="flex flex-wrap gap-2">
                        {groupDetails?.participants.map(p => (
                          <button
                            key={p.address}
                            type="button"
                            onClick={() => {
                              if (expenseParticipants.includes(p.address)) {
                                setExpenseParticipants(expenseParticipants.filter(a => a !== p.address));
                              } else {
                                setExpenseParticipants([...expenseParticipants, p.address]);
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-medium transition-all",
                              expenseParticipants.includes(p.address) 
                                ? "bg-white text-zinc-900" 
                                : "bg-white/5 text-zinc-400 border border-white/10"
                            )}
                          >
                            {p.address === accountAddress ? "You" : p.address.slice(0, 6) + "..."}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-zinc-400">Split Type</label>
                       <div className="flex gap-2">
                         <button 
                            type="button"
                            onClick={() => setSplitType("equal")}
                            className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", splitType === 'equal' ? 'bg-white text-zinc-900' : 'bg-white/5 text-zinc-400')}
                         >Equal</button>
                         <button 
                            type="button"
                            onClick={() => setSplitType("percentage")}
                            className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", splitType === 'percentage' ? 'bg-white text-zinc-900' : 'bg-white/5 text-zinc-400')}
                         >Percentage (%)</button>
                         <button 
                            type="button"
                            onClick={() => setSplitType("amount")}
                            className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", splitType === 'amount' ? 'bg-white text-zinc-900' : 'bg-white/5 text-zinc-400')}
                         >Amount (ALGO)</button>
                       </div>
                    </div>

                    {splitType !== 'equal' && (
                        <div className="space-y-2">
                            {expenseParticipants.map(addr => (
                                <div key={addr} className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-mono text-zinc-400">{addr === accountAddress ? "You" : addr.slice(0,6)}</span>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="0"
                                            value={weightedDist[addr] || ""}
                                            onChange={(e) => setWeightedDist({...weightedDist, [addr]: e.target.value})}
                                            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white"
                                        />
                                        <span className="text-[10px] text-zinc-500">{splitType === 'percentage' ? '%' : 'ALGO'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl btn-gradient font-bold transition-all"
                    >
                      Add Expense
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {groupDetails?.expenses.length === 0 ? (
                  <div className="text-center py-8 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                    <Receipt className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No expenses recorded yet.</p>
                  </div>
                ) : (
                  groupDetails?.expenses.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{exp.description}</h4>
                        <p className="text-[10px] text-zinc-500">
                          Paid by <span className="font-mono">{exp.payer_address === accountAddress ? "You" : exp.payer_address.slice(0, 6) + "..."}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{exp.amount.toFixed(2)} ALGO</p>
                        <p className="text-[10px] text-zinc-500">{new Date(exp.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isRecordingManual && (
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Record Payment</h4>
                    <button onClick={() => setIsRecordingManual(false)} className="text-zinc-500 hover:text-zinc-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleManualSettle} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">From</label>
                        <select 
                          value={manualFrom}
                          onChange={(e) => setManualFrom(e.target.value)}
                          className="w-full input-dark rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="">Select Payer</option>
                          {groupDetails?.participants.map(p => (
                            <option key={p.address} value={p.address}>
                              {p.address === accountAddress ? "You" : p.address.slice(0, 8) + "..."}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">To</label>
                        <select 
                          value={manualTo}
                          onChange={(e) => setManualTo(e.target.value)}
                          className="w-full input-dark rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="">Select Receiver</option>
                          {groupDetails?.participants.map(p => (
                            <option key={p.address} value={p.address}>
                              {p.address === accountAddress ? "You" : p.address.slice(0, 8) + "..."}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input 
                      type="number" 
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="Amount in ALGO"
                      className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    />
                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl btn-gradient font-bold transition-all"
                    >
                      Record Payment
                    </button>
                  </form>
                </div>
              )}

              {/* Settlements List */}
              <div className="pt-6 space-y-4">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Recent Settlements</h3>
                <div className="space-y-3">
                  {groupDetails?.settlements.length === 0 ? (
                    <div className="text-center py-8 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                      <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">No settlements yet.</p>
                    </div>
                  ) : (
                    groupDetails?.settlements.map((settle) => (
                      <div key={settle.id} className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              {settle.from_address === accountAddress ? "You" : settle.from_address.slice(0, 6) + "..."} paid {settle.to_address === accountAddress ? "You" : settle.to_address.slice(0, 6) + "..."}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">{settle.tx_id.slice(0, 12)}...</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">{settle.amount.toFixed(2)} ALGO</p>
                          <p className="text-[10px] text-zinc-500">{new Date(settle.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
