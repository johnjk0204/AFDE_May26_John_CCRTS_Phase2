import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStatusBadgeClass, getPriorityClass, formatDateTime, isSLABreached } from '../utils/helpers';
import { MagnifyingGlassIcon, PlusCircleIcon, FunnelIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const STATUSES = ['Open', 'Assigned', 'In Progress', 'Pending Customer Response', 'Escalated', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ComplaintList({ myOnly }) {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', category_id: '', search: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const limit = 15;

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...filters };
      const fn = myOnly ? complaintAPI.getMy : complaintAPI.getAll;
      const { data } = await fn(params);
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch {} finally { setLoading(false); }
  }, [page, filters, myOnly]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useEffect(() => { categoryAPI.getAll().then(({ data }) => setCategories(data)).catch(() => {}); }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{myOnly ? 'My Complaints' : 'All Complaints'}</h1>
          <p className="text-sm text-gray-500">{total} total complaints</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" /> Filters
          </button>
          {user?.role_name === 'Customer' && (
            <button onClick={() => navigate('/complaints/new')} className="btn-primary flex items-center gap-2">
              <PlusCircleIcon className="w-4 h-4" /> New Complaint
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" className="input-field pl-9" placeholder="Search by complaint number, description, or customer name..."
            value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <select className="input-field" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input-field" value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input-field" value={filters.category_id} onChange={(e) => { setFilters({ ...filters, category_id: e.target.value }); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium">No complaints found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Complaint #', 'Category', 'Description', 'Priority', 'Status', 'SLA', 'Created', 'Agent'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map(c => {
                  const breached = isSLABreached(c.sla_deadline) && !['Resolved', 'Closed'].includes(c.status);
                  return (
                    <tr key={c.complaint_id} onClick={() => navigate(`/complaints/${c.complaint_id}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-blue-700">{c.complaint_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{c.category_name}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-gray-900 truncate">{c.subject || c.description}</p>
                        {c.customer_name && <p className="text-xs text-gray-500">{c.customer_name}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={getPriorityClass(c.priority)}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={getStatusBadgeClass(c.status)}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {breached ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Breached
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{c.sla_deadline ? formatDateTime(c.sla_deadline) : '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(c.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.agent_name || <span className="text-gray-400">Unassigned</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page - 2 + i;
              if (pg > totalPages) return null;
              return <button key={pg} onClick={() => setPage(pg)} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${pg === page ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>{pg}</button>;
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Fix missing import
function ClipboardDocumentListIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}
