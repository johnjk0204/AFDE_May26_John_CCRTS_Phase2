import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ComplaintRegistration() {
  const [form, setForm] = useState({ category_id: '', subject: '', description: '', priority: 'Medium' });
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 5) return toast.error('Maximum 5 files allowed.');
    setFiles([...files, ...selected]);
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.description.length < 10) return toast.error('Description must be at least 10 characters.');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      files.forEach(f => formData.append('attachments', f));
      const { data } = await complaintAPI.create(formData);
      toast.success(`Complaint ${data.complaintNumber} registered successfully!`);
      navigate(`/complaints/${data.complaintId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register complaint.');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = { Low: 'text-gray-600 border-gray-300', Medium: 'text-yellow-600 border-yellow-300', High: 'text-orange-600 border-orange-300', Critical: 'text-red-600 border-red-300' };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register New Complaint</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below. A complaint number will be auto-generated.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Category <span className="text-red-500">*</span></label>
          <select required className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Select a category</option>
            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(p => (
              <button key={p} type="button"
                onClick={() => setForm({ ...form, priority: p })}
                className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.priority === p ? `${priorityColors[p]} bg-opacity-10 bg-current` : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {p}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            SLA: Low=72h · Medium=48h · High=24h · Critical=4h
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input type="text" className="input-field" placeholder="Brief summary of the issue" maxLength={255}
            value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea required rows={5} className="input-field resize-none" placeholder="Describe your complaint in detail (minimum 10 characters)..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Optional, max 5 files)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Drag & drop or <label className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
              <input type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt" onChange={handleFileChange} />
              browse files
            </label></p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF, DOC up to 5MB each</p>
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-700 truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-600 ml-2 flex-shrink-0">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</> : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}
