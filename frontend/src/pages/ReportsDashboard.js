import React, { useState, useEffect } from 'react';
import { dashboardAPI, feedbackAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { StarIcon } from '@heroicons/react/24/solid';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportsDashboard() {
  const [categoryData, setCategoryData] = useState([]);
  const [agentData, setAgentData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getCategoryAnalysis(),
      dashboardAPI.getAgentPerformance(),
      dashboardAPI.getMonthlyTrends(),
      dashboardAPI.getPriorityDistribution(),
      dashboardAPI.getResolutionTime(),
      feedbackAPI.getAnalytics(),
    ]).then(([cat, agent, trends, prio, res, fb]) => {
      setCategoryData(cat.data);
      setAgentData(agent.data);
      setTrends(trends.data);
      setPriorityData(prio.data);
      setResolutionData(res.data);
      setFeedbackData(fb.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Comprehensive complaint analytics and performance metrics</p>
      </div>

      {/* Customer Satisfaction */}
      {feedbackData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Rating', value: feedbackData.summary?.avg_rating || 0, suffix: '/5', color: 'text-yellow-500' },
            { label: 'Total Feedback', value: feedbackData.summary?.total_feedback || 0, color: 'text-blue-600' },
            { label: 'Satisfied (4-5★)', value: feedbackData.summary?.satisfied || 0, color: 'text-green-600' },
            { label: 'Dissatisfied (1-2★)', value: feedbackData.summary?.dissatisfied || 0, color: 'text-red-600' },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}{suffix || ''}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Complaint Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={priorityData} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={90} label={({ priority, count }) => `${priority}: ${count}`}>
                {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Analysis */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 90, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="category_name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[0, 4, 4, 0]} />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Time by Priority */}
        {resolutionData.length > 0 && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Avg Resolution Time by Priority (hours)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}h`, 'Avg Hours']} />
                <Bar dataKey="avg_hours" fill="#6366f1" name="Avg Hours" radius={[4, 4, 0, 0]}>
                  {resolutionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Agent Performance Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Agent Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Agent', 'Assigned', 'Resolved', 'SLA Breached', 'Avg Resolution (h)', 'Resolution Rate'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agentData.map(a => {
                const rate = a.total_assigned > 0 ? Math.round((a.resolved / a.total_assigned) * 100) : 0;
                return (
                  <tr key={a.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{a.agent_name?.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{a.agent_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.total_assigned}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">{a.resolved}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{a.sla_breached}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.avg_resolution_hours || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-10">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {agentData.length === 0 && <div className="text-center py-10 text-gray-500">No agent data available.</div>}
        </div>
      </div>

      {/* Feedback Rating Distribution */}
      {feedbackData?.distribution?.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Customer Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(r => {
              const d = feedbackData.distribution.find(d => parseInt(d.rating) === r);
              const count = d ? parseInt(d.count) : 0;
              const total = parseInt(feedbackData.summary?.total_feedback) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={r} className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 w-20 flex-shrink-0">
                    {Array.from({ length: r }).map((_, i) => <StarIcon key={i} className="w-3.5 h-3.5 text-yellow-400" />)}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-yellow-400 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
