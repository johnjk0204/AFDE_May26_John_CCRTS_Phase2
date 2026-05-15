import { formatDistanceToNow, format } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const timeAgo = (date) => {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isSLABreached = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};

export const getStatusBadgeClass = (status) => {
  const map = {
    'Open': 'badge-open',
    'Assigned': 'badge-assigned',
    'In Progress': 'badge-inprogress',
    'Pending Customer Response': 'badge-pending',
    'Escalated': 'badge-escalated',
    'Resolved': 'badge-resolved',
    'Closed': 'badge-closed',
  };
  return map[status] || 'badge-open';
};

export const getPriorityClass = (priority) => {
  const map = { Low: 'priority-low', Medium: 'priority-medium', High: 'priority-high', Critical: 'priority-critical' };
  return map[priority] || 'priority-low';
};

export const getPriorityColor = (priority) => {
  const map = { Low: '#6b7280', Medium: '#d97706', High: '#f97316', Critical: '#dc2626' };
  return map[priority] || '#6b7280';
};

export const COMPLAINT_STATUSES = ['Open', 'Assigned', 'In Progress', 'Pending Customer Response', 'Escalated', 'Resolved', 'Closed'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const canUpdateStatus = (userRole, currentStatus) => {
  if (['Admin', 'Supervisor'].includes(userRole)) return true;
  if (userRole === 'Support Agent' && !['Closed'].includes(currentStatus)) return true;
  return false;
};
