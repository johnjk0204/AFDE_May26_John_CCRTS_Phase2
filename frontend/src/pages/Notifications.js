import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { timeAgo } from '../utils/helpers';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = () => {
    notificationAPI.getAll({ limit: 50 }).then(({ data }) => setNotifications(data.notifications)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    await notificationAPI.markAsRead(id);
    setNotifications(ns => ns.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllAsRead();
    toast.success('All marked as read.');
    fetchNotifications();
  };

  const deleteOne = async (id) => {
    await notificationAPI.delete(id);
    setNotifications(ns => ns.filter(n => n.notification_id !== id));
  };

  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.notification_id);
    if (n.complaint_id) navigate(`/complaints/${n.complaint_id}`);
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-sm text-blue-600 font-medium mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckIcon className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div key={n.notification_id}
                className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                <button onClick={() => handleClick(n)} className="flex-1 text-left">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => deleteOne(n.notification_id)} className="p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
