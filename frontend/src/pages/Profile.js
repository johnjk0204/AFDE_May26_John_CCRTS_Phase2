import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

export default function Profile() {
  const { user } = useAuth();
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match.');
    if (passForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters.');
    setSubmitting(true);
    try {
      await authAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally { setSubmitting(false); }
  };

  const roleColors = { Admin: 'bg-red-100 text-red-700', Supervisor: 'bg-purple-100 text-purple-700', 'Support Agent': 'bg-blue-100 text-blue-700', Customer: 'bg-green-100 text-green-700', 'Quality Team': 'bg-orange-100 text-orange-700' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-700">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${roleColors[user?.role_name] || 'bg-gray-100 text-gray-700'}`}>{user?.role_name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserCircleIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserCircleIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Member since</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(user?.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-gray-500" /> Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" required className="input-field" value={passForm.currentPassword}
              onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" required minLength={6} className="input-field" value={passForm.newPassword}
              onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" required className="input-field" value={passForm.confirmPassword}
              onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
