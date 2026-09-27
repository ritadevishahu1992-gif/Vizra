import React, { useState } from 'react';
import {
  Project,
  ProjectWorkflowStage,
  ProjectMemory,
} from '../../types/ai';
import {
  updateStageContent,
  updateProjectMemory,
  toggleTask,
  addTask,
  saveProject,
} from '../../services/projectService';
import {
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Copy,
  Check,
  Download,
  Trash2,
  Plus,
  BrainCircuit,
  Film,
  FileText,
  ListTodo,
  Layers,
  ChevronRight,
  ArrowLeft,
  Share2,
  Database,
  UploadCloud,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { ragVectorStore } from '../../services/ragVectorStore';
import { RAGDocument } from '../../types/rag';

interface ProjectWorkspaceProps {
  project: Project;
  onBackToChat: () => void;
  onProjectUpdated: (updated: Project) => void;
  onRefineWithOmnia?: (stage: ProjectWorkflowStage) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBackToChat,
  onProjectUpdated,
  onRefineWithOmnia,
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'memory' | 'knowledge' | 'tasks' | 'notes'>('workflow');
  const [projectDocs, setProjectDocs] = useState<RAGDocument[]>(() => {
    return ragVectorStore.getDocuments().filter((d) => d.project_id === project.id || d.tier === 'project');
  });
  const [selectedStageId, setSelectedStageId] = useState<string>(project.stages[0]?.id || 'stage-1');
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [stageEditText, setStageEditText] = useState('');
  const [copiedStageId, setCopiedStageId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Project Memory editing state
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [memoryGoal, setMemoryGoal] = useState(project.memory.goal);
  const [memoryAudience, setMemoryAudience] = useState(project.memory.targetAudience);
  const [memoryStyle, setMemoryStyle] = useState(project.memory.style);

  const selectedStage = project.stages.find((s) => s.id === selectedStageId) || project.stages[0];

  const completedStagesCount = project.stages.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedStagesCount / project.stages.length) * 100);

  const handleSelectStage = (stage: ProjectWorkflowStage) => {
    setSelectedStageId(stage.id);
    setIsEditingStage(false);
  };

  const handleStartEditStage = () => {
    setStageEditText(selectedStage.content);
    setIsEditingStage(true);
  };

  const handleSaveEditStage = () => {
    const updated = updateStageContent(project.id, selectedStage.id, stageEditText);
    if (updated) onProjectUpdated(updated);
    setIsEditingStage(false);
  };

  const handleToggleStageStatus = (stageId: string, currentStatus: ProjectWorkflowStage['status']) => {
    const nextStatus: ProjectWorkflowStage['status'] =
      currentStatus === 'completed'
        ? 'not_started'
        : currentStatus === 'in_progress'
        ? 'completed'
        : 'in_progress';

    const stage = project.stages.find((s) => s.id === stageId);
    if (!stage) return;
    const updated = updateStageContent(project.id, stageId, stage.content, nextStatus);
    if (updated) onProjectUpdated(updated);
  };

  const handleCopyStageContent = (stage: ProjectWorkflowStage) => {
    navigator.clipboard.writeText(stage.content);
    setCopiedStageId(stage.id);
    setTimeout(() => setCopiedStageId(null), 2000);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = toggleTask(project.id, taskId);
    if (updated) onProjectUpdated(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const updated = addTask(project.id, newTaskInput.trim());
    if (updated) onProjectUpdated(updated);
    setNewTaskInput('');
  };

  const handleSaveMemory = () => {
    const updated = updateProjectMemory(project.id, {
      goal: memoryGoal,
      targetAudience: memoryAudience,
      style: memoryStyle,
    });
    if (updated) onProjectUpdated(updated);
    setIsEditingMemory(false);
  };

  const handleClearMemory = () => {
    const updated = updateProjectMemory(project.id, {
      goal: '',
      targetAudience: '',
      style: '',
      requirements: [],
      previousDecisions: [],
      currentProgress: '',
    });
    if (updated) onProjectUpdated(updated);
    setMemoryGoal('');
    setMemoryAudience('');
    setMemoryStyle('');
    setIsEditingMemory(false);
  };

  const handleExportMarkdown = () => {
    let md = `# ${project.title}\n\n`;
    md += `**Category**: ${project.category} | **Created**: ${new Date(project.createdAt).toLocaleDateString()}\n\n`;
    md += `> ${project.description}\n\n`;
    md += `## Project Memory & Context\n`;
    md += `- **Goal**: ${project.memory.goal}\n`;
    md += `- **Audience**: ${project.memory.targetAudience}\n`;
    md += `- **Style**: ${project.memory.style}\n\n`;
    md += `## 10-Stage Production Plan\n\n`;

    project.stages.forEach((stage) => {
      md += `### ${stage.title} (${stage.status.toUpperCase()})\n`;
      md += `${stage.description}\n\n`;
      md += `${stage.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white overflow-hidden select-none">
      {/* Top Project Bar */}
      <div className="h-14 border-b border-neutral-800/80 bg-neutral-950 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Return to Omnia Chat"
          >
            <ArrowLeft size={14} />
            <span>Chat</span>
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white">{project.title}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#eb3b2d]/10 text-[#eb3b2d] border border-[#eb3b2d]/25 uppercase">
                {project.category}
              </span>
            </div>
          </div>
        </div>

        {/* Progress & Export */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400">
              {completedStagesCount}/10 Stages ({progressPercent}%)
            </span>
            <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#eb3b2d] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
            title="Export full project brief as Markdown"
          >
            <Download size={13} className="text-[#eb3b2d]" />
            <span className="hidden sm:inline">Export Brief</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-900 bg-neutral-950/60 px-4 md:px-6 flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'workflow'
              ? 'border-[#eb3b2d] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>10-Stage Workflow</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'memory'
              ? 'border-[#eb3b2d] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <BrainCircuit size={14} />
          <span>Project Memory</span>
        </button>

        <button
          onClick={() => {
            setProjectDocs(ragVectorStore.getDocuments().filter((d) => d.project_id === project.id || d.tier === 'project'));
            setActiveTab('knowledge');
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'knowledge'
              ? 'border-[#eb3b2d] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Database size={14} />
          <span>Project RAG Documents ({projectDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-[#eb3b2d] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <ListTodo size={14} />
          <span>Tasks ({project.tasks.filter((t) => !t.completed).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'notes'
              ? 'border-[#eb3b2d] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <FileText size={14} />
          <span>Notes</span>
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-hidden">
        {/* 1. Workflow Tab: Left Stages List (280px) + Right Editor Pane */}
        {activeTab === 'workflow' && (
          <div className="h-full flex flex-col md:flex-row overflow-hidden">
            {/* Left Stages Column */}
            <div className="w-full md:w-80 h-44 md:h-full border-b md:border-b-0 md:border-r border-neutral-900 bg-[#090909] overflow-y-auto p-2 space-y-1 shrink-0">
              <div className="px-2 py-1.5 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                Production Stages
              </div>
              {project.stages.map((stage) => {
                const isSelected = stage.id === selectedStageId;
                return (
                  <div
                    key={stage.id}
                    onClick={() => handleSelectStage(stage)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-700 text-white'
                        : 'bg-transparent border-transparent hover:bg-neutral-900/50 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">
                        {stage.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStageStatus(stage.id, stage.status);
                        }}
                        className="p-0.5 rounded hover:scale-110 transition-transform cursor-pointer"
                        title="Toggle stage status"
                      >
                        {stage.status === 'completed' ? (
                          <CheckCircle2 size={15} className="text-[#eb3b2d]" />
                        ) : stage.status === 'in_progress' ? (
                          <Clock size={15} className="text-amber-400" />
                        ) : (
                          <Circle size={15} className="text-neutral-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">
                      {stage.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right Stage Content Pane */}
            <div className="flex-1 h-full overflow-y-auto bg-black p-4 md:p-8 flex flex-col">
              <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col space-y-4">
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {selectedStage.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {selectedStage.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyStageContent(selectedStage)}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
                      title="Copy stage content"
                    >
                      {copiedStageId === selectedStage.id ? (
                        <Check size={14} className="text-[#eb3b2d]" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>

                    {isEditingStage ? (
                      <button
                        onClick={handleSaveEditStage}
                        className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Save Stage
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEditStage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
                      >
                        <Edit3 size={13} className="text-[#eb3b2d]" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stage Content or Textarea */}
                <div className="flex-1">
                  {isEditingStage ? (
                    <textarea
                      autoFocus
                      value={stageEditText}
                      onChange={(e) => setStageEditText(e.target.value)}
                      className="w-full h-96 p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-neutral-200 focus:outline-none focus:border-[#eb3b2d] resize-none leading-relaxed"
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-neutral-300 font-sans whitespace-pre-wrap bg-neutral-950/40 p-5 rounded-2xl border border-neutral-900">
                      {selectedStage.content}
                    </div>
                  )}
                </div>

                {/* Refine with Omnia suggestion bar */}
                <div className="pt-4 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-2">
                    <VizraLogo size={15} />
                    <span>Omnia 1.0 Creative Engine</span>
                  </div>
                  <button
                    onClick={() => {
                      if (onRefineWithOmnia) onRefineWithOmnia(selectedStage);
                      onBackToChat();
                    }}
                    className="text-[#eb3b2d] hover:underline cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <span>Refine this stage in Chat</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Project Memory Tab */}
        {activeTab === 'memory' && (
          <div className="h-full overflow-y-auto p-4 md:p-8 bg-black">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <BrainCircuit size={18} className="text-[#eb3b2d]" />
                    <span>Project Memory & Context</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Omnia retains this context across all chats so you never have to re-explain requirements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isEditingMemory ? (
                    <button
                      onClick={handleSaveMemory}
                      className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      Save Memory
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditingMemory(true)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-white transition-colors cursor-pointer"
                      >
                        Edit Memory
                      </button>
                      <button
                        onClick={handleClearMemory}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-[#eb3b2d] border border-neutral-800 text-xs transition-colors cursor-pointer"
                        title="Clear Project Memory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Memory Form / View */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-neutral-300 block mb-1.5">Project Goal</label>
                  {isEditingMemory ? (
                    <textarea
                      value={memoryGoal}
                      onChange={(e) => setMemoryGoal(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-[#eb3b2d] h-20"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 text-neutral-300">
                      {project.memory.goal || 'No goal specified yet.'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1.5">Target Audience</label>
                  {isEditingMemory ? (
                    <input
                      type="text"
                      value={memoryAudience}
                      onChange={(e) => setMemoryAudience(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-[#eb3b2d]"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 text-neutral-300">
                      {project.memory.targetAudience || 'General audience'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1.5">Creative Style & Tone</label>
                  {isEditingMemory ? (
                    <textarea
                      value={memoryStyle}
                      onChange={(e) => setMemoryStyle(e.target.value)}
                      className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-[#eb3b2d] h-20"
                    />
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 text-neutral-300">
                      {project.memory.style || 'Kinetic minimalism, obsidian depth, surgical accents'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 block mb-1.5">Requirements & Invariants</label>
                  <ul className="space-y-1.5">
                    {project.memory.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-900 text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2.5 Project Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="h-full overflow-y-auto p-4 md:p-8 bg-black">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-850">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Database size={18} className="text-[#eb3b2d]" />
                    <span>Project RAG Documents & Grounding</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Externalized documents bound to this project's tenant isolation tier. Omnia 1.0 retrieves from these files to ground answers and plans.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/60">
                  {projectDocs.length} Verified Docs
                </span>
              </div>

              {/* Document List */}
              <div className="space-y-3">
                {projectDocs.length === 0 ? (
                  <div className="p-8 border border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
                    No documents currently indexed for this project. Upload files or specs below to ground Omnia's reasoning.
                  </div>
                ) : (
                  projectDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={16} className="text-[#eb3b2d] shrink-0" />
                          <div>
                            <h4 className="font-semibold text-xs text-white truncate">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] font-mono text-neutral-500">
                              {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {doc.chunk_count} Chunks
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
                        <span>~{doc.token_count} Indexed Tokens</span>
                        <span className="uppercase">{doc.access_level}</span>
                        <span>Indexed: {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ingestion Info Banner */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eb3b2d]/10 border border-[#eb3b2d]/30 flex items-center justify-center text-[#eb3b2d] shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-white">
                      Strict Tenant Isolation Tier
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      Project knowledge is isolated to this project ID. Omnia cross-references these files automatically when you work in this workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="h-full overflow-y-auto p-4 md:p-8 bg-black">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <ListTodo size={18} className="text-[#eb3b2d]" />
                  <span>Production Tasks</span>
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  {project.tasks.filter((t) => t.completed).length}/{project.tasks.length} Completed
                </span>
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add a new production task..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </form>

              {/* Task list */}
              <div className="space-y-2">
                {project.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      task.completed
                        ? 'bg-neutral-950/40 border-neutral-900 text-neutral-500 line-through'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {task.completed ? (
                        <CheckCircle2 size={16} className="text-[#eb3b2d]" />
                      ) : (
                        <Circle size={16} className="text-neutral-600" />
                      )}
                      <span className="text-xs font-medium">{task.title}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        task.priority === 'high'
                          ? 'bg-red-950/40 text-[#eb3b2d] border border-red-900/40'
                          : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. Notes Tab */}
        {activeTab === 'notes' && (
          <div className="h-full overflow-y-auto p-4 md:p-8 bg-black">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <FileText size={18} className="text-[#eb3b2d]" />
                  <span>Project Notes & Scratchpad</span>
                </h3>
              </div>

              <textarea
                value={project.notes}
                onChange={(e) => {
                  const updated: Project = { ...project, notes: e.target.value, updatedAt: Date.now() };
                  saveProject(updated);
                  onProjectUpdated(updated);
                }}
                placeholder="Write freeform notes, ideas, reference links, and creative drafts here..."
                className="w-full h-80 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-sm font-sans text-neutral-200 focus:outline-none focus:border-[#eb3b2d] leading-relaxed resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
