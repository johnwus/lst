import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Globe, Lock, AlertCircle } from "lucide-react";

const CATEGORIES = [
  { name: 'Society', emoji: '🌐' },
  { name: 'Tech', emoji: '🤖' },
  { name: 'Culture', emoji: '🎭' },
  { name: 'Money', emoji: '💸' },
  { name: 'Random', emoji: '🎲' },
];

export default function CreateTopicModal({ isOpen, onClose, onCreate, isAdmin = false }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Society",
    isGlobal: false,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("isGlobal", formData.isGlobal);
      if (image) {
        data.append("image", image);
      }

      await onCreate(data);
      onClose();
      // Reset form
      setFormData({ title: "", description: "", category: "Society", isGlobal: false });
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.message || "Failed to create topic");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Create New Topic</h2>
              <p className="text-gray-500 text-xs mt-0.5">Start a fresh conversation room</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Topic Cover Image</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-40 w-full rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-500 mb-2 group-hover:text-purple-400 transition-colors" />
                    <span className="text-xs text-gray-400">Tap to upload (Max 5MB)</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Topic Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What should we talk about?"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                required
              />
            </div>

            {/* Category & Icons line */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#0a1a1a]">
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="space-y-2 text-right">
                  <label className="text-sm font-medium text-gray-300">Global Visibility</label>
                  <label className="flex items-center justify-end gap-2 mt-2 cursor-pointer group">
                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Make Global</span>
                    <div className="relative inline-flex items-center h-6 w-11 rounded-full bg-white/10 transition-colors">
                        <input
                            type="checkbox"
                            className="hidden peer"
                            checked={formData.isGlobal}
                            onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                        />
                        <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isGlobal ? 'translate-x-5 !bg-purple-500 bg-none' : ''}`} />
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add some context for early participants..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>Create Topic</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
