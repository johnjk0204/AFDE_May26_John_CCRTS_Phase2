import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintAPI, userAPI, feedbackAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getStatusBadgeClass, getPriorityClass, formatDateTime, isSLABreached, COMPLAINT_STATUSES } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, UserIcon, ClockIcon, PaperClipIcon,
  ChatBubbleLeftIcon, CheckCircleIcon, ExclamationTriangleIcon, StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [agents, setAgents] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [resolution, setResolution] = useState('');
  const [assignAgentId, setAssignAgentId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaint = async () => {
    try {
      const [cRes, fRes] = await Promise.all([
        complaintAPI.getById(id),
        feedbackAPI.getByComplaint(id),
      ]);
      setComplaint(cRes.data);
      setFeedback(fRes.data);
    } catch { toast.error('Complaint not found.'); navigate('/complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  useEffect(() => {
    if (['Admin', 'Supervisor'].includes(user?.role_name)) {
      userAPI.getAgents().then(({ data }) => setAgents(data)).catch(() => {});
    }
  }, [user]);

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      switch (action) {
        case 'comment':
          if (!comment.trim()) return toast.error('Comment cannot be empty.');
          await complaintAPI.addComment(id, { comment });
          setComment(''); toast.success('Comment added.');
          break;
        case 'assign':
          if (!assignAgentId) return toast.error('Select an agent.');
          await complaintAPI.assign(id, { agent_id: assignAgentId });
          toast.success('Complaint assigned.');
          break;
        case 'status':
          if (!newStatus) return toast.error('Select a status.');
          await complaintAPI.updateStatus(id, { status: newStatus });
          toast.success('Status updated.');
          break;
        case 'resolve':
          if (!resolution.trim()) return toast.error('Resolution notes required.');
          await complaintAPI.resolve(id, { resolution_notes: resolution });
          toast.success('Complaint resolved!');
          break;
        case 'escalate':
          await complaintAPI.escalate(id, { reason: escalateReason });
          toast.success('Complaint escalated.');
          break;
        case 'reopen':
          await complaintAPI.reopen(id, {});
          toast.success('Complaint reopened.');
          break;
        case 'close':
          await complaintAPI.close(id);
          toast.success('Complaint closed.');
          break;
        case 'feedback':
          if (!rating) return toast.error('Please select a rating.');
          await feedbackAPI.submit(id, { rating, comments: feedbackComment });
          toast.success('Thank you for your feedback!');
          break;
        default: break;
      }
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!complaint) return null;

  const breached = isSLABreached(complaint.sla_deadline) && !['Resolved', 'Closed'].includes(complaint.status);
  const isAdmin = ['Admin', 'Supervisor'].includes(user?.role_name);
  const isAgent = user?.role_name === 'Support Agent';
  const isCustomer = user?.role_name === 'Customer';
  const canResolve = isAdmin || (isAgent && complaint.assigned_agent_id === user?.user_id);
  const canFeedback = isCustomer && ['Resolved', 'Closed'].includes(complaint.status) && !feedback;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{complaint.complaint_number}</h1>
            <p className="text-gray-600 mt-0.5">{complaint.subject || complaint.description.substring(0, 80)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={getPriorityClass(complaint.priority)}>{complaint.priority}</span>
            <span className={getStatusBadgeClass(complaint.status)}>{complaint.status}</span>
            {breached && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> SLA Breached
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Complaint Description</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{complaint.description}</p>
            {complaint.resolution_notes && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                <p className="text-sm text-green-800">{complaint.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {complaint.attachments?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><PaperClipIcon className="w-4 h-4" /> Attachments</h3>
              <div className="space-y-2">
                {complaint.attachments.map(a => (
                  <a key={a.attachment_id} href={`/uploads/${a.file_path}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors text-sm text-blue-700">
                    <PaperClipIcon className="w-4 h-4" /> {a.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Activity History */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><ChatBubbleLeftIcon className="w-4 h-4" /> Activity & History</h3>
            <div className="space-y-3">
              {complaint.history?.map(h => (
                <div key={h.history_id} className="flex gap-3">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-gray-600">{h.updated_by_name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">{h.updated_by_name}</span>
                      {h.old_status !== h.new_status && h.old_status && (
                        <span className="text-xs text-gray-500">{h.old_status} → {h.new_status}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{formatDateTime(h.updated_date)}</span>
                    </div>
                    {h.comment && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{h.comment}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <textarea rows={3} className="input-field resize-none text-sm" placeholder="Add a comment..."
                value={comment} onChange={(e) => setComment(e.target.value)} />
              <button onClick={() => handleAction('comment')} disabled={submitting || !comment.trim()} className="btn-primary mt-2 text-sm py-1.5">
                Add Comment
              </button>
            </div>
          </div>

          {/* Feedback */}
          {canFeedback && (
            <div className="card border-2 border-blue-200 bg-blue-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><StarIcon className="w-4 h-4 text-yellow-500" /> Rate Your Experience</h3>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setRating(r)} type="button">
                    {r <= rating ? <StarSolid className="w-7 h-7 text-yellow-400" /> : <StarIcon className="w-7 h-7 text-gray-300" />}
                  </button>
                ))}
              </div>
              <textarea rows={2} className="input-field resize-none text-sm bg-white" placeholder="Comments (optional)"
                value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} />
              <button onClick={() => handleAction('feedback')} disabled={submitting || !rating} className="btn-primary mt-2 text-sm py-1.5">
                Submit Feedback
              </button>
            </div>
          )}

          {feedback && (
            <div className="card bg-green-50 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Customer Feedback</h3>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(r => <StarSolid key={r} className={`w-5 h-5 ${r <= feedback.rating ? 'text-yellow-400' : 'text-gray-200'}`} />)}
              </div>
              {feedback.comments && <p className="text-sm text-gray-700">{feedback.comments}</p>}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="card text-sm space-y-3">
            <h3 className="font-semibold text-gray-700">Details</h3>
            <DetailRow label="Customer" value={complaint.customer_name} />
            <DetailRow label="Email" value={complaint.customer_email} />
            <DetailRow label="Category" value={complaint.category_name} />
            <DetailRow label="Created" value={formatDateTime(complaint.created_at)} />
            <DetailRow label="SLA Deadline" value={complaint.sla_deadline ? formatDateTime(complaint.sla_deadline) : 'N/A'} highlight={breached ? 'red' : undefined} />
            {complaint.resolved_at && <DetailRow label="Resolved At" value={formatDateTime(complaint.resolved_at)} />}
            {complaint.agent_name && <DetailRow label="Agent" value={complaint.agent_name} />}
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Assign Agent</h3>
              <select className="input-field text-sm" value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)}>
                <option value="">Select agent</option>
                {agents.map(a => <option key={a.user_id} value={a.user_id}>{a.name}</option>)}
              </select>
              <button onClick={() => handleAction('assign')} disabled={submitting} className="btn-primary w-full text-sm py-1.5">Assign</button>
            </div>
          )}

          {/* Status Update */}
          {!isCustomer && !['Closed'].includes(complaint.status) && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Update Status</h3>
              <select className="input-field text-sm" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">Select status</option>
                {COMPLAINT_STATUSES.filter(s => s !== complaint.status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => handleAction('status')} disabled={submitting} className="btn-secondary w-full text-sm py-1.5">Update Status</button>
            </div>
          )}

          {/* Resolve */}
          {canResolve && !['Resolved', 'Closed'].includes(complaint.status) && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Resolve Complaint</h3>
              <textarea rows={3} className="input-field text-sm resize-none" placeholder="Resolution notes..."
                value={resolution} onChange={(e) => setResolution(e.target.value)} />
              <button onClick={() => handleAction('resolve')} disabled={submitting} className="btn-success w-full text-sm py-1.5">Mark Resolved</button>
            </div>
          )}

          {/* Escalate */}
          {isAdmin && !['Escalated', 'Resolved', 'Closed'].includes(complaint.status) && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Escalate</h3>
              <input type="text" className="input-field text-sm" placeholder="Reason (optional)" value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} />
              <button onClick={() => handleAction('escalate')} disabled={submitting} className="btn-danger w-full text-sm py-1.5">Escalate</button>
            </div>
          )}

          {/* Reopen / Close */}
          {['Resolved'].includes(complaint.status) && isAdmin && (
            <div className="card flex gap-2">
              <button onClick={() => handleAction('reopen')} disabled={submitting} className="btn-secondary flex-1 text-sm py-1.5">Reopen</button>
              <button onClick={() => handleAction('close')} disabled={submitting} className="btn-primary flex-1 text-sm py-1.5">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`font-medium text-right ${highlight === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{value || 'N/A'}</span>
    </div>
  );
}
