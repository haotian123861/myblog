import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FilesPage() {
  const { files, fileCategories, handleUpload, handleDownload, handleDeleteFile, createFileCategory, deleteFileCategory } = useApp();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;
    setUploading(true);
    try {
      await handleUpload(file, selectedCategory);
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await createFileCategory(name);
    setNewCategoryName("");
    setShowNewCategory(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("确定删除此分类吗？")) return;
    await deleteFileCategory(id);
    if (activeCategory === id) setActiveCategory("");
  };

  const confirmDeleteFile = async (f: typeof files[0]) => {
    if (!window.confirm(`确定删除「${f.originalName}」吗？`)) return;
    await handleDeleteFile(f._id);
  };

  const filteredFiles = activeCategory ? files.filter((f) => f.categoryId === activeCategory) : files;

  return (
    <section className="section bg-color posts-expand slide-down-in">
      <div className="post-list-box post box-shadow-wrapper">
        <div className="article-wrapper bg-color">
          <section className="post-header">
            <h1 className="post-title text-lg">
              <i className="fa fa-folder-open mr-2" />
              文件
            </h1>
            <div className="post-meta">分享和管理文件资源</div>
          </section>

          <div className="post-body">
            {/* Admin: category management + upload */}
            {isAdmin && (
              <div className="mb-5 p-4 bg-ink-50 border border-ink-200 rounded-lg">
                {/* Category controls */}
                <div className="mb-3 flex gap-2 items-center flex-wrap">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-ink-200 rounded-lg text-sm font-serif text-ink-700 bg-white outline-none focus:border-navy-400 min-w-[130px]"
                  >
                    <option value="">选择分类...</option>
                    {fileCategories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>

                  <input ref={fileInputRef} type="file" onChange={onFileChange} className="hidden" />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !selectedCategory}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-serif transition-all ${
                      uploading || !selectedCategory
                        ? "bg-ink-200 text-ink-400 cursor-not-allowed"
                        : "bg-navy-900 text-ink-50 hover:bg-navy-800 cursor-pointer"
                    }`}
                  >
                    <i className={`fa ${uploading ? "fa-spinner fa-spin" : "fa-upload"}`} />
                    {uploading ? "上传中..." : "上传"}
                  </button>

                  <button
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-serif bg-transparent text-navy-900 border border-navy-900 hover:bg-navy-900 hover:text-ink-50 transition-all cursor-pointer"
                  >
                    <i className="fa fa-plus" /> 新建分类
                  </button>
                </div>

                {showNewCategory && (
                  <div className="flex gap-2">
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="分类名称"
                      className="flex-1 px-3 py-2 border border-ink-200 rounded-lg text-sm font-serif outline-none focus:border-navy-400"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className={`px-4 py-2 rounded-lg text-sm font-serif transition-all ${
                        newCategoryName.trim()
                          ? "bg-navy-900 text-ink-50 hover:bg-navy-800 cursor-pointer"
                          : "bg-ink-200 text-ink-400 cursor-not-allowed"
                      }`}
                    >
                      添加
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category filter tabs */}
            {fileCategories.length > 0 && (
              <div className="mb-4 flex gap-1.5 flex-wrap items-center">
                <button
                  onClick={() => setActiveCategory("")}
                  className={`px-3.5 py-1.5 rounded-full border-none text-sm font-serif cursor-pointer transition-all ${
                    !activeCategory
                      ? "bg-navy-900 text-ink-50"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  全部
                </button>
                {fileCategories.map((c) => (
                  <div key={c._id} className="inline-flex items-center gap-0.5">
                    <button
                      onClick={() => setActiveCategory(c._id)}
                      className={`px-3.5 py-1.5 rounded-full border-none text-sm font-serif cursor-pointer transition-all ${
                        activeCategory === c._id
                          ? "bg-navy-900 text-ink-50"
                          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      }`}
                    >
                      {c.name}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteCategory(c._id)}
                        title="删除分类"
                        className="bg-transparent border-none cursor-pointer text-ink-400 hover:text-rust-500 text-xs p-0.5 transition-colors"
                      >
                        <i className="fa fa-times" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* File list */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-10 font-serif">
                <i className="fa fa-inbox text-4xl block mb-3 text-ink-300" />
                <p className="text-ink-400">
                  {activeCategory ? "此分类暂无文件" : "暂无文件资源"}
                </p>
              </div>
            ) : (
              <div>
                {filteredFiles.map((file) => {
                  const cat = fileCategories.find((c) => c._id === file.categoryId);
                  return (
                    <div
                      key={file._id}
                      className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50 transition-colors rounded-sm px-1"
                    >
                      {/* File icon */}
                      <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-lg text-navy-700 flex-shrink-0">
                        <i className="fa fa-file-o" />
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink-700 font-semibold truncate">
                          {file.originalName}
                        </div>
                        <div className="text-xs text-ink-400 mt-0.5">
                          {formatSize(file.size)}
                          {cat && <><span className="mx-1.5 text-ink-200">|</span>{cat.name}</>}
                          <span className="mx-1.5 text-ink-200">|</span>
                          {file.uploaderName}
                          <span className="mx-1.5 text-ink-200">|</span>
                          {formatTime(file.createdAt)}
                        </div>
                      </div>

                      {/* Download count */}
                      <div className="text-center flex-shrink-0 min-w-[48px]">
                        <div className="text-base font-bold text-navy-900">
                          {file.downloadCount}
                        </div>
                        <div className="text-[0.625rem] text-ink-400">下载</div>
                      </div>

                      {/* Download button */}
                      <button
                        onClick={() => handleDownload(file)}
                        className="px-4 py-2 bg-navy-900 text-ink-50 rounded-lg text-sm cursor-pointer inline-flex items-center gap-1.5 flex-shrink-0 hover:bg-navy-800 transition-all font-serif"
                      >
                        <i className="fa fa-download" /> 下载
                      </button>

                      {/* Admin delete */}
                      {isAdmin && (
                        <button
                          onClick={() => confirmDeleteFile(file)}
                          className="px-3 py-2 bg-transparent text-rust-600 border border-rust-400 rounded-lg text-sm cursor-pointer inline-flex items-center gap-1.5 flex-shrink-0 hover:bg-rust-50 transition-all font-serif"
                        >
                          <i className="fa fa-trash" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
