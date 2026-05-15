import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, complaintAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function EscalationDashboard() {
  const [slaBreaches, setSLABreaches] = useState([]);
  const [escalated, setEscalated] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      dashboardAPI.getSLABreaches(),
      complaintAPI.getAll({ status: 'Escalated', limit: 50 }),
    ]).then(([breachRes, escalateRes]) => {
      setSLABreaches(breachRes.data);
      setEscalated(escalateRes.data.complaints);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escalation Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor SLA breaches and escalated complaints</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{slaBreaches.length}</p>
            <p className="text-sm text-gray-500">SLA Breaches</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{escalated.length}</p>
            <p className="text-sm text-gray-500">Escalated Complaints</p>
          </div>
        </div>
      </div>

      {/* SLA Breaches Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <h3 className="text-base font-semibold text-red-800 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" /> SLA Breached Complaints
          </h3>
        </div>
        {slaBreaches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium text-green-600">No SLA breaches!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Complaint #', 'Category', 'Customer', 'Priority', 'SLA Deadline', 'Agent', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slaBreaches.map(b => (
                  <tr key={b.complaint_number} onClick={() => navigate(`/complaints/${b.complaint_number}`)}
                    className="hover:bg-red-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-semibold text-red-700">{b.complaint_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.category_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.customer_name}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${b.priority === 'Critical' ? 'bg-red-100 text-red-700' : b.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.priority}</span></td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{formatDateTime(b.sla_deadline)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.agent_name || 'Unassigned'}</td>
                    <td className="px-4 py-3"><span className="badge-escalated">{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Escalated Complaints */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-200 bg-orange-50">
          <h3 className="text-base font-semibold text-orange-800 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" /> Escalated Complaints
          </h3>
        </div>
        {escalated.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p>No escalated complaints.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {escalated.map(c => (
              <div key={c.complaint_id} onClick={() => navigate(`/complaints/${c.complaint_id}`)}
                className="flex items-center justify-between p-4 hover:bg-orange-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-orange-700">{c.complaint_number}</span>
                  <p className="text-sm text-gray-700 mt-0.5">{c.subject || c.description?.substring(0, 80)}</p>
                  <p className="text-xs text-gray-500">{c.customer_name} · {c.category_name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{c.priority}</span>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
