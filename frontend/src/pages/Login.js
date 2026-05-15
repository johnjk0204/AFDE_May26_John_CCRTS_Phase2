import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ClipboardDocumentListIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { label: 'Admin', email: 'admin@company.com' },
    { label: 'Supervisor', email: 'supervisor@company.com' },
    { label: 'Agent', email: 'agent1@company.com' },
    { label: 'Customer', email: 'customer1@example.com' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ComplaintTrack</h1>
          <p className="text-gray-500 mt-1">Customer Support Portal</p>
        </div>

        <div className="card shadow-xl border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email" required autoFocus
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div></div>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 py-2.5">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">New customer? </span>
            <Link to="/register" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Register here</Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Demo Credentials (password: Password@123)</p>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map(({ label, email }) => (
              <button key={email} onClick={() => setForm({ email, password: 'Password@123' })}
                className="text-left px-3 py-2 text-xs rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <span className="font-semibold text-gray-700">{label}</span>
                <br />
                <span className="text-gray-500 truncate block">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
