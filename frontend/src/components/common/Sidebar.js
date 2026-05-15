import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon, ClipboardDocumentListIcon, PlusCircleIcon, UserGroupIcon,
  ExclamationTriangleIcon, ChartBarIcon, TagIcon, BellIcon, UserCircleIcon,
  ArrowRightOnRectangleIcon, BriefcaseIcon, InboxIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon: Icon, label, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const isAdmin = ['Admin'].includes(user?.role_name);
  const isSupervisor = ['Admin', 'Supervisor'].includes(user?.role_name);
  const isAgent = ['Admin', 'Supervisor', 'Support Agent'].includes(user?.role_name);
  const isQuality = ['Admin', 'Supervisor', 'Quality Team'].includes(user?.role_name);
  const isCustomer = user?.role_name === 'Customer';

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">ComplaintTrack</p>
          <p className="text-xs text-gray-500">Support Portal</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 mx-2 mt-3 bg-blue-50 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 truncate">{user?.name}</p>
        <p className="text-xs text-blue-600 mt-0.5">{user?.role_name}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={HomeIcon} label="Dashboard" end />

        {isCustomer && (
          <>
            <NavItem to="/complaints/new" icon={PlusCircleIcon} label="New Complaint" />
            <NavItem to="/my-complaints" icon={InboxIcon} label="My Complaints" />
          </>
        )}

        {!isCustomer && (
          <>
            <NavItem to="/complaints" icon={ClipboardDocumentListIcon} label="All Complaints" />
            {isAgent && <NavItem to="/work-queue" icon={BriefcaseIcon} label="Work Queue" />}
          </>
        )}

        {isSupervisor && <NavItem to="/escalations" icon={ExclamationTriangleIcon} label="Escalations" />}
        {isQuality && <NavItem to="/reports" icon={ChartBarIcon} label="Reports" />}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1 px-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <NavItem to="/users" icon={UserGroupIcon} label="User Management" />
            <NavItem to="/categories" icon={TagIcon} label="Categories" />
          </>
        )}

        <div className="pt-2 pb-1 px-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
        </div>
        <NavItem to="/notifications" icon={BellIcon} label="Notifications" />
        <NavItem to="/profile" icon={UserCircleIcon} label="Profile" />
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
