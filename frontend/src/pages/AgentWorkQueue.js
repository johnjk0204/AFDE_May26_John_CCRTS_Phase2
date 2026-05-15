import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { getStatusBadgeClass, getPriorityClass, formatDateTime, isSLABreached } from '../utils/helpers';
import { BriefcaseIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AgentWorkQueue() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const status = filter === 'active' ? undefined : filter === 'resolved' ? 'Resolved' : 'Escalated';
    complaintAPI.getAll({ status, limit: 50 })
      .then(({ data }) => setComplaints(data.complaints))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const tabs = [
    { key: 'active', label: 'Active' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Work Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complaints assigned to you</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16">
            <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No complaints in this queue</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map(c => {
              const breached = isSLABreached(c.sla_deadline) && !['Resolved', 'Closed'].includes(c.status);
              return (
                <div key={c.complaint_id} onClick={() => navigate(`/complaints/${c.complaint_id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-blue-50 cursor-pointer transition-colors">
                  <div className={`w-2 h-12 rounded-full flex-shrink-0 ${
                    c.priority === 'Critical' ? 'bg-red-500' : c.priority === 'High' ? 'bg-orange-400' :
                    c.priority === 'Medium' ? 'bg-yellow-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-blue-700">{c.complaint_number}</span>
                      <span className={getStatusBadgeClass(c.status)}>{c.status}</span>
                      {breached && <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium"><ExclamationTriangleIcon className="w-3.5 h-3.5" />SLA!</span>}
                    </div>
                    <p className="text-sm text-gray-800 truncate">{c.subject || c.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.customer_name} · {c.category_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={getPriorityClass(c.priority)}>{c.priority}</span>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(c.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
