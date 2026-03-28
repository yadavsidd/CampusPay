import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ShoppingBag, Briefcase, Users, Star, Clock } from "lucide-react";
import { getActivities, Activity } from "../services/algorandService";
import { cn } from "../lib/utils";

export const CampusPulse: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      const data = await getActivities(10);
      setActivities(data);
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'product_listed': return <ShoppingBag className="w-4 h-4 text-orange-400" />;
      case 'product_bought': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'gig_posted': return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'gig_claimed': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'gig_completed': return <Star className="w-4 h-4 text-amber-400" />;
      case 'expense_created': return <Users className="w-4 h-4 text-indigo-400" />;
      default: return <Zap className="w-4 h-4 text-violet-400" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400 animate-pulse" />
          Campus Pulse
        </h4>
        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Live</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-hidden relative">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-hover p-4 rounded-2xl flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white line-clamp-1">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-zinc-600 font-mono">
                    {activity.address ? `${activity.address.slice(0, 6)}...${activity.address.slice(-4)}` : "System"}
                  </p>
                  <span className="text-[10px] text-zinc-700">•</span>
                  <p className="text-[10px] text-zinc-600 font-bold">{getTimeAgo(activity.created_at)}</p>
                </div>
              </div>
              {activity.amount && (
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-white">{activity.amount.toFixed(1)} <span className="text-[8px] text-zinc-500">ALGO</span></p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Fading bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
