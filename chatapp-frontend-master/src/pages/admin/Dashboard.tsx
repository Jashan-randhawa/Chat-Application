import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetStats } from "@/services/api";
import { Users, MessageSquare, MessagesSquare, Hash, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

interface Stats {
  groupsCount: number;
  usersCount: number;
  messagesCount: number;
  totalChatsCount: number;
  messagesChart: number[];
}

const statCards = (s: Stats) => [
  {
    label: "Total Users",
    value: s.usersCount,
    icon: Users,
    color: "from-sky-500/20 to-sky-500/5",
    iconColor: "text-sky-400",
    border: "border-sky-500/20",
    badge: "+12% this week",
  },
  {
    label: "Total Chats",
    value: s.totalChatsCount,
    icon: MessagesSquare,
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
    badge: `${s.groupsCount} groups`,
  },
  {
    label: "Total Messages",
    value: s.messagesCount,
    icon: MessageSquare,
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    border: "border-amber-500/20",
    badge: "All time",
  },
  {
    label: "Group Chats",
    value: s.groupsCount,
    icon: Hash,
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
    badge: `${s.totalChatsCount - s.groupsCount} direct`,
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await adminGetStats();
      setStats(data.stats);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      </AdminLayout>
    );
  }

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartValues = stats?.messagesChart || [0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...chartValues, 1);

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-white/40 mt-0.5">Overview of your application</p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white/80 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats && statCards(stats).map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-xl p-4`}
          >
            <div className="flex items-start justify-between mb-3">
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">{card.badge}</span>
            </div>
            <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#161b22] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-white">Messages This Week</h3>
              <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                {chartValues.reduce((a, b) => a + b, 0)} total messages
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Messages
            </div>
          </div>
          <Line
            data={{
              labels,
              datasets: [{
                label: "Messages",
                data: chartValues,
                borderColor: "#34d399",
                backgroundColor: "rgba(52,211,153,0.06)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#34d399",
                pointRadius: 4,
                pointHoverRadius: 6,
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1f2937", titleColor: "#fff", bodyColor: "#9ca3af" } },
              scales: {
                y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } } },
              },
            }}
          />
        </motion.div>

        {/* Doughnut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-[#161b22] border border-white/5 rounded-xl p-5 flex flex-col"
        >
          <h3 className="font-semibold text-sm text-white mb-1">Chat Types</h3>
          <p className="text-xs text-white/30 mb-4">Distribution of chat types</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-36 h-36">
              <Doughnut
                data={{
                  labels: ["Direct", "Groups"],
                  datasets: [{
                    data: [
                      (stats?.totalChatsCount || 0) - (stats?.groupsCount || 0),
                      stats?.groupsCount || 0,
                    ],
                    backgroundColor: ["rgba(56,189,248,0.8)", "rgba(167,139,250,0.8)"],
                    borderColor: ["#38bdf8", "#a78bfa"],
                    borderWidth: 1,
                    hoverOffset: 6,
                  }],
                }}
                options={{
                  responsive: true,
                  cutout: "70%",
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: "#1f2937", titleColor: "#fff", bodyColor: "#9ca3af" },
                  },
                }}
              />
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {[
              { label: "Direct", color: "bg-sky-400", value: (stats?.totalChatsCount || 0) - (stats?.groupsCount || 0) },
              { label: "Groups", color: "bg-violet-400", value: stats?.groupsCount || 0 },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                <span className="text-xs text-white/40">{l.label}</span>
                <span className="text-xs text-white/70 font-medium">{l.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
