import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetStats } from "@/services/api";
import {
  Users,
  MessageSquare,
  MessagesSquare,
  Hash,
  TrendingUp,
  Loader2,
  RefreshCw,
  Radio,
  UserCheck,
  Camera,
  Paperclip,
  Activity,
  Cpu,
  Clock,
  Zap,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface Stats {
  groupsCount: number;
  usersCount: number;
  messagesCount: number;
  totalChatsCount: number;
  directChatsCount: number;
  onlineUsersCount: number;
  totalRequestsCount: number;
  pendingRequestsCount: number;
  activeStatusesCount: number;
  messagesWithMediaCount: number;
  flaggedMessagesCount?: number;
  spamAlertsCount?: number;
  inappropriateAlertsCount?: number;
  highSeverityAlertsCount?: number;
  messagesChart: number[];
  usersChart: number[];
  serverUptime: number;
  nodeVersion: string;
  memoryUsage: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

const statCards = (s: Stats) => [
  {
    label: "Total Users",
    value: s.usersCount,
    icon: Users,
    color: "from-sky-500/20 to-sky-500/5",
    iconColor: "text-sky-400",
    border: "border-sky-500/20",
    badge: `${s.onlineUsersCount} online now`,
    subtext: "Registered accounts",
  },
  {
    label: "Total Chats",
    value: s.totalChatsCount,
    icon: MessagesSquare,
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
    badge: `${s.groupsCount} groups`,
    subtext: `${s.directChatsCount} 1-on-1 chats`,
  },
  {
    label: "Total Messages",
    value: s.messagesCount,
    icon: MessageSquare,
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    border: "border-amber-500/20",
    badge: `${s.messagesWithMediaCount} media`,
    subtext: "Encrypted & logged",
  },
  {
    label: "Active Stories",
    value: s.activeStatusesCount,
    icon: Camera,
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
    badge: "24h window",
    subtext: `${s.pendingRequestsCount} pending requests`,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
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

      {/* Content Moderation & Spam Detection Security Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`border rounded-2xl p-5 mb-6 transition-all ${
          (stats?.flaggedMessagesCount ?? 0) > 0
            ? "bg-gradient-to-r from-red-950/30 via-amber-950/20 to-[#161b22] border-red-500/30 shadow-lg shadow-red-500/5"
            : "bg-[#161b22] border-emerald-500/20"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                (stats?.flaggedMessagesCount ?? 0) > 0
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {(stats?.flaggedMessagesCount ?? 0) > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">Content Moderation & Threat Detection</h3>
                {(stats?.highSeverityAlertsCount ?? 0) > 0 ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/40 animate-pulse">
                    Action Required
                  </span>
                ) : (stats?.flaggedMessagesCount ?? 0) > 0 ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40">
                    Review Pending
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    All Messages Clean
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-1 max-w-xl leading-relaxed">
                Automated heuristics actively screening messages for spam links, scams, harassment, and abusive language.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t border-white/5 lg:border-t-0">
            <div className="grid grid-cols-3 gap-2 flex-1 sm:flex-initial">
              <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-center min-w-[85px]">
                <span className="text-[10px] text-white/40 block">Flagged Total</span>
                <span className="text-base font-bold text-red-400">{stats?.flaggedMessagesCount ?? 0}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-center min-w-[85px]">
                <span className="text-[10px] text-white/40 block">Spam Signals</span>
                <span className="text-base font-bold text-amber-400">{stats?.spamAlertsCount ?? 0}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-center min-w-[85px]">
                <span className="text-[10px] text-white/40 block">Inappropriate</span>
                <span className="text-base font-bold text-rose-400">{stats?.inappropriateAlertsCount ?? 0}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/messages?filter=flagged")}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <span>Review Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

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
              { label: "Direct", color: "bg-sky-400", value: stats?.directChatsCount ?? 0 },
              { label: "Groups", color: "bg-violet-400", value: stats?.groupsCount ?? 0 },
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

      {/* Second Row: User Growth & System Health Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* User registrations bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#161b22] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-white">New User Registrations (7 Days)</h3>
              <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-sky-400" />
                {(stats?.usersChart || []).reduce((a, b) => a + b, 0)} new registrations this week
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              Signups
            </div>
          </div>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "New Users",
                  data: stats?.usersChart || [0, 0, 0, 0, 0, 0, 0],
                  backgroundColor: "rgba(56, 189, 248, 0.6)",
                  hoverBackgroundColor: "rgba(56, 189, 248, 0.9)",
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: "#1f2937", titleColor: "#fff", bodyColor: "#9ca3af" },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(255,255,255,0.04)" },
                  ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } },
                },
                x: {
                  grid: { display: false },
                  ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } },
                },
              },
            }}
          />
        </motion.div>

        {/* System & Application Health Telemetry */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#161b22] border border-white/5 rounded-xl p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white">System Telemetry</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/50 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/40" /> Server Uptime
                </span>
                <span className="text-xs font-semibold text-white font-mono">
                  {formatUptime(stats?.serverUptime || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/50 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-white/40" /> Memory Heap
                </span>
                <span className="text-xs font-semibold text-white font-mono">
                  {stats?.memoryUsage || 0} MB
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/50 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-white/40" /> Node.js Runtime
                </span>
                <span className="text-xs font-semibold text-white font-mono">
                  {stats?.nodeVersion || "v22.x"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/50 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-white/40" /> Realtime Sockets
                </span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {stats?.onlineUsersCount || 0} Connected
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/50 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-white/40" /> Pending Requests
                </span>
                <span className="text-xs font-semibold text-amber-400 font-mono">
                  {stats?.pendingRequestsCount || 0} In Queue
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30">
            <span>Database: MongoDB Connected</span>
            <span>Security: JWT HS256</span>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
