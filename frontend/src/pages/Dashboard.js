import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  ClipboardDocumentListIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ClockIcon, XCircleIcon, ArrowTrendingUpIcon, PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const STATUS_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6b7280'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [slaBreaches, setSLABreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, catRes, trendsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getCategoryAnalysis(),
          dashboardAPI.getMonthlyTrends(),
        ]);
        setStats(statsRes.data);
        setCategoryData(catRes.data.slice(0, 6));
        setTrends(trendsRes.data);

        if (['Admin', 'Supervisor'].includes(user?.role_name)) {
          const breachRes = await dashboardAPI.getSLABreaches();
          setSLABreaches(breachRes.data.slice(0, 5));
        }
      } catch {} finally { setLoading(false); }
    };
    fetchAll();
  }, [user]);

  const pieData = stats ? [
    { name: 'Open', value: stats.open },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Escalated', value: stats.escalated },
    { name: 'Resolved', value: stats.resolved },
    { name: 'Closed', value: stats.closed },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date())} — Overview of complaint statistics</p>
        </div>
        {user?.role_name === 'Customer' && (
          <button onClick={() => navigate('/complaints/new')} className="btn-primary flex items-center gap-2">
            <PlusCircleIcon className="w-4 h-4" /> New Complaint
          </button>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={stats.total} icon={ClipboardDocumentListIcon} color="bg-blue-500" />
          <StatCard title="Open" value={stats.open} icon={ClockIcon} color="bg-yellow-500" />
          <StatCard title="Resolved" value={stats.resolved} icon={CheckCircleIcon} color="bg-green-500" />
          <StatCard title="Escalated" value={stats.escalated} icon={ExclamationTriangleIcon} color="bg-red-500" />
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="In Progress" value={stats.inProgress} icon={ArrowTrendingUpIcon} color="bg-purple-500" />
          <StatCard title="Closed" value={stats.closed} icon={XCircleIcon} color="bg-gray-500" />
          <StatCard title="SLA Breaches" value={stats.slaBreached} icon={ExclamationTriangleIcon} color="bg-orange-500" />
          <StatCard title="Avg Resolution" value={`${stats.avgResolutionHours}h`} icon={ClockIcon} color="bg-teal-500"
            sub="Average resolution time" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Complaint Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart - Monthly Trends */}
        {trends.length > 0 && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Trends (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Analysis */}
        {categoryData.length > 0 && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category_name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="total" fill="#6366f1" name="Total" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SLA Breaches */}
        {['Admin', 'Supervisor'].includes(user?.role_name) && slaBreaches.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Recent SLA Breaches</h3>
              <button onClick={() => navigate('/escalations')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</button>
            </div>
            <div className="space-y-3">
              {slaBreaches.map((breach) => (
                <div key={breach.complaint_number} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{breach.complaint_number}</p>
                    <p className="text-xs text-gray-500">{breach.customer_name} · {breach.category_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    breach.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                    breach.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{breach.priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {user?.role_name === 'Customer' && (
            <button onClick={() => navigate('/complaints/new')} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
              <PlusCircleIcon className="w-6 h-6 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">New Complaint</span>
            </button>
          )}
          <button onClick={() => navigate(user?.role_name === 'Customer' ? '/my-complaints' : '/complaints')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ClipboardDocumentListIcon className="w-6 h-6 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">{user?.role_name === 'Customer' ? 'My Complaints' : 'All Complaints'}</span>
          </button>
          {['Admin', 'Supervisor'].includes(user?.role_name) && (
            <button onClick={() => navigate('/escalations')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <span className="text-xs font-medium text-red-700">Escalations</span>
            </button>
          )}
          {['Admin', 'Supervisor', 'Quality Team'].includes(user?.role_name) && (
            <button onClick={() => navigate('/reports')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
              <span className="text-xs font-medium text-green-700">Reports</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
