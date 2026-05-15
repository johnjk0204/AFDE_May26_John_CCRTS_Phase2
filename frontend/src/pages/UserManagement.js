import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

const ROLES = [
  { id: '11111111-1111-1111-1111-111111111001', name: 'Admin' },
  { id: '11111111-1111-1111-1111-111111111002', name: 'Supervisor' },
  { id: '11111111-1111-1111-1111-111111111003', name: 'Support Agent' },
  { id: '11111111-1111-1111-1111-111111111004', name: 'Customer' },
  { id: '11111111-1111-1111-1111-111111111005', name: 'Quality Team' },
];

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role_id: ROLES[2].id };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    userAPI.getAll({ search, role: roleFilter, limit: 50 })
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const openCreate = () => { setEditUser(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', role_id: ROLES.find(r => r.name === u.role_name)?.id || ROLES[2].id });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        await userAPI.update(editUser.user_id, { name: form.name, phone: form.phone, role_id: form.role_id });
        toast.success('User updated.');
      } else {
        await userAPI.create(form);
        toast.success('User created.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (id) => {
    try {
      await userAPI.toggleStatus(id);
      toast.success('User status updated.');
      fetchUsers();
    } catch { toast.error('Failed to update status.'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await userAPI.delete(id);
      toast.success('User deleted.');
      fetchUsers();
    } catch { toast.error('Cannot delete user.'); }
  };

  const roleColors = { Admin: 'bg-red-100 text-red-700', Supervisor: 'bg-purple-100 text-purple-700', 'Support Agent': 'bg-blue-100 text-blue-700', Customer: 'bg-green-100 text-green-700', 'Quality Team': 'bg-orange-100 text-orange-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card flex gap-3">
        <input type="text" className="input-field flex-1" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['User', 'Email', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-700">{u.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role_name] || 'bg-gray-100 text-gray-700'}`}>{u.role_name}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(u.user_id)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${u.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(u.user_id, u.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="text-center py-10 text-gray-500"><UserCircleIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>No users found.</p></div>}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{editUser ? 'Edit User' : 'Add New User'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                {!editUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                )}
                {!editUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" required minLength={6} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select required className="input-field" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Saving...' : editUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
