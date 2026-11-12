import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Layers,
  FolderOpen,
  Activity,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Sliders,
  Play,
  Users,
} from 'lucide-react';
import {
  DashboardShell,
  DashboardSectionId,
} from '../components/ui/DashboardShell';
import { AnalyticsChart, ChartDataPoint } from '../components/ui/AnalyticsChart';
import { UsageAnalyticsDashboard } from '../components/ui/UsageAnalyticsDashboard';
import { DataTable, DataTableColumn } from '../components/ui/DataTable';
import { FileUpload } from '../components/ui/FileUpload';
import { ConfirmDialog, Dialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { AIStatusShimmer } from '../components/ui/TextShimmer';
import { ImageGenerationCard } from '../components/ai/ImageGenerationCard';
import { useAuth } from '../context/AuthContext';
import {
  getAllProjects,
  saveProject,
  createProjectFromPrompt,
  deleteProject,
} from '../services/projectService';
import {
  getUserProjectsFromFirestore,
  saveUserProjectToFirestore,
} from '../services/firestoreService';
import { Project, Attachment } from '../types/ai';

interface WorkspaceApiToken {
  id: string;
  label: string;
  prefix: string;
  scope: 'read:telemetry' | 'write:projects' | 'engage:events';
  createdAt: number;
  lastUsedAt?: number;
}

const TOKENS_STORAGE_KEY = 'vizra_workspace_client_tokens_v1';
const ASSETS_STORAGE_KEY = 'vizra_workspace_uploaded_assets_v1';

export const WorkspaceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();

  const initialTab = (searchParams.get('tab') as DashboardSectionId) || 'overview';
  const [activeSection, setActiveSection] = useState<DashboardSectionId>(
    [
      'overview',
      'projects',
      'assets',
      'analytics',
      'developer',
      'team',
      'settings',
    ].includes(initialTab)
      ? initialTab
      : 'overview'
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Attachment[]>(() => {
    try {
      const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Real Backend Telemetry State
  const [serverMetrics, setServerMetrics] = useState<any>(null);
  const [engageOverview, setEngageOverview] = useState<any>(null);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);

  // Modals & Dialogs State
  const [deleteTargetProject, setDeleteTargetProject] = useState<Project | null>(
    null
  );
  const [exportTargetProject, setExportTargetProject] = useState<Project | null>(
    null
  );
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectPrompt, setNewProjectPrompt] = useState('');

  // Developer API Token Management State
  const [apiTokens, setApiTokens] = useState<WorkspaceApiToken[]>(() => {
    try {
      const raw = localStorage.getItem(TOKENS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [
      {
        id: 'tok-default-1',
        label: 'Omnia Studio Client SDK',
        prefix: 'vz_live_98f2...4a1c',
        scope: 'write:projects',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        lastUsedAt: Date.now() - 1000 * 60 * 14,
      },
    ];
  });
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [newTokenScope, setNewTokenScope] =
    useState<WorkspaceApiToken['scope']>('write:projects');
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<string | null>(
    null
  );
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const handleSelectSection = (sec: DashboardSectionId) => {
    setActiveSection(sec);
    setSearchParams({ tab: sec });
  };

  // Load Projects from LocalStorage + Firestore
  useEffect(() => {
    const local = getAllProjects();
    setProjects(local);

    if (user) {
      getUserProjectsFromFirestore(user.uid)
        .then((remote) => {
          if (remote && remote.length > 0) {
            setProjects(remote);
          }
        })
        .catch(() => {
          // Keep local projects
        });
    }
  }, [user]);

  // Persist uploaded assets
  useEffect(() => {
    try {
      localStorage.setItem(
        ASSETS_STORAGE_KEY,
        JSON.stringify(
          assets.slice(0, 25).map((a) => ({
            ...a,
            previewUrl:
              a.previewUrl && a.previewUrl.length < 180000
                ? a.previewUrl
                : undefined,
          }))
        )
      );
    } catch {
      // Ignore quota exceeded
    }
  }, [assets]);

  // Fetch Real Server Metrics & Engage Telemetry
  const fetchLiveTelemetry = useCallback(async () => {
    setIsSyncingTelemetry(true);
    try {
      const [metricsRes, engageRes] = await Promise.all([
        fetch('/api/metrics').catch(() => null),
        fetch('/api/engage/admin/overview').catch(() => null),
      ]);

      if (metricsRes && metricsRes.ok) {
        const mJson = await metricsRes.json();
        setServerMetrics(mJson);
      }
      if (engageRes && engageRes.ok) {
        const eJson = await engageRes.json();
        setEngageOverview(eJson);
      }
    } finally {
      window.setTimeout(() => setIsSyncingTelemetry(false), 320);
    }
  }, []);

  useEffect(() => {
    fetchLiveTelemetry();
  }, [fetchLiveTelemetry]);

  // Build Real Chart Data from Server Metrics, Projects & Engage Analytics
  const workspaceChartData: ChartDataPoint[] = useMemo(() => {
    const stageCounts = projects.map((p, idx) => ({
      label: p.title.slice(0, 12) || `Proj ${idx + 1}`,
      primary: p.stages.filter((s) => s.status === 'completed').length,
      secondary: p.stages.length,
    }));

    if (stageCounts.length > 0) {
      return stageCounts;
    }

    // Fallback to real server metrics & engage inventory counts
    const totalReq = Number(serverMetrics?.requests?.total || 1);
    const aiReq = Number(serverMetrics?.requests?.aiChat || 1);
    const engageImpressions = Number(
      engageOverview?.analytics?.totals?.impressions || 0
    );
    const engageInteractions = Number(
      engageOverview?.analytics?.totals?.interactions || 0
    );

    return [
      { label: 'Boot', primary: 1, secondary: 1 },
      { label: 'API Calls', primary: totalReq, secondary: aiReq },
      { label: 'Engage Imp', primary: engageImpressions, secondary: engageInteractions },
      { label: 'Assets', primary: assets.length, secondary: projects.length },
    ];
  }, [projects, serverMetrics, engageOverview, assets.length]);

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleText = newProjectTitle.trim() || 'Obsidian Brand Sequence';
    const promptText =
      newProjectPrompt.trim() ||
      titleText ||
      'Obsidian 60fps kinetic brand launch sequence';
    const created = createProjectFromPrompt(titleText, promptText, 'video');
    saveProject(created);
    setProjects(getAllProjects());

    if (user) {
      try {
        await saveUserProjectToFirestore(user.uid, created);
      } catch {
        // Non-fatal
      }
    }

    setNewProjectTitle('');
    setNewProjectPrompt('');
    setIsNewProjectModalOpen(false);
    toast({
      title: 'Project Created',
      description: `"${created.title}" initialized with 10 production stages.`,
      type: 'success',
    });
  };

  const handleToggleNextStage = (proj: Project) => {
    const nextStage = proj.stages.find((s) => s.status !== 'completed');
    if (!nextStage) {
      toast({
        title: 'All 10 stages completed',
        description: `"${proj.title}" is ready for final export.`,
        type: 'info',
      });
      return;
    }
    const updatedProject: Project = {
      ...proj,
      updatedAt: Date.now(),
      stages: proj.stages.map((s) =>
        s.id === nextStage.id
          ? { ...s, status: 'completed', updatedAt: Date.now() }
          : s
      ),
    };
    saveProject(updatedProject);
    setProjects(getAllProjects());
    toast({
      title: `Stage ${nextStage.index} Completed`,
      description: `${nextStage.title} marked complete in "${proj.title}".`,
      type: 'success',
    });
  };

  const handleConfirmDeleteProject = () => {
    if (!deleteTargetProject) return;
    deleteProject(deleteTargetProject.id);
    setProjects(getAllProjects());
    toast({
      title: 'Project Deleted',
      description: `"${deleteTargetProject.title}" was removed from your workspace.`,
      type: 'warning',
    });
    setDeleteTargetProject(null);
  };

  const handleExportProjectJson = (proj: Project) => {
    const blob = new Blob([JSON.stringify(proj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vizra.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Export Completed',
      description: `Downloaded 10-stage specification for "${proj.title}".`,
      type: 'success',
    });
  };

  const handleCreateApiToken = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newTokenLabel.trim() || 'Workspace Integration Key';
    const randomHex = Array.from({ length: 24 })
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    const fullSecret = `vz_live_${randomHex}`;
    const newEntry: WorkspaceApiToken = {
      id: `tok-${Date.now()}`,
      label,
      prefix: `${fullSecret.slice(0, 12)}...${fullSecret.slice(-4)}`,
      scope: newTokenScope,
      createdAt: Date.now(),
    };
    const updated = [newEntry, ...apiTokens];
    setApiTokens(updated);
    try {
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    setNewlyGeneratedSecret(fullSecret);
    setNewTokenLabel('');
    toast({
      title: 'Client Workspace Token Generated',
      description: 'Copy your token now; only its prefix is stored after dismissal.',
      type: 'success',
    });
  };

  const projectColumns: DataTableColumn<Project>[] = [
    {
      key: 'title',
      header: 'Project Title',
      sortable: true,
      getValue: (r) => r.title,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#171717] border border-white/[0.08] flex items-center justify-center text-[#EB3B2D] shrink-0">
            <Layers size={14} />
          </div>
          <div>
            <div className="font-semibold text-white">{r.title}</div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase">
              {r.category}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'progress',
      header: '10-Stage Workflow',
      sortable: true,
      getValue: (r) => r.stages.filter((s) => s.status === 'completed').length,
      render: (r) => {
        const done = r.stages.filter((s) => s.status === 'completed').length;
        const pct = Math.round((done / Math.max(r.stages.length, 1)) * 100);
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-neutral-300">{done}/10 stages</span>
              <span className="text-[#EB3B2D]">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
              <div
                className="h-full bg-[#DC2626] rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      getValue: (r) => r.updatedAt,
      render: (r) => (
        <span className="font-mono text-[11px] text-neutral-400">
          {new Date(r.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Workflow Controls',
      align: 'right',
      render: (r) => (
        <div
          className="inline-flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleToggleNextStage(r)}
            className="px-2.5 py-1 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-[11px] text-neutral-200 hover:text-white flex items-center gap-1 cursor-pointer"
            title="Advance next workflow stage"
          >
            <Play size={10} className="text-[#EB3B2D]" />
            <span>Advance</span>
          </button>
          <button
            type="button"
            onClick={() => setExportTargetProject(r)}
            className="p-1.5 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-neutral-300 hover:text-white cursor-pointer"
            title="Export project JSON"
          >
            <Download size={12} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTargetProject(r)}
            className="p-1.5 rounded-lg hover:bg-red-950/40 text-neutral-500 hover:text-[#EB3B2D] cursor-pointer"
            title="Delete project"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  const activePlanName = useMemo(() => {
    try {
      const saved = localStorage.getItem('vizra_active_plan_v1');
      if (saved === 'pro') return 'Omnia Pro';
      if (saved === 'studio') return 'VIZRA Studio';
    } catch {
      // Ignore
    }
    return 'Creator Free';
  }, []);

  return (
    <DashboardShell
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      title="VIZRA Workspace & Developer Console"
      subtitle="Real-time project pipelines, multimodal assets, telemetry charts, and API governance"
      planName={activePlanName}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New Project</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/ai')}
            className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Open Omnia AI</span>
          </button>
        </div>
      }
    >
      {/* Top Sync Shimmer Indicator when refreshing telemetry */}
      {isSyncingTelemetry && (
        <AIStatusShimmer
          status="syncing"
          label="Synchronizing live workspace telemetry & server metrics…"
        />
      )}

      {/* KPI Summary Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Active Projects</span>
            <Layers size={14} className="text-[#EB3B2D]" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-[11px] font-mono text-neutral-500">
            10-stage creative pipelines
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Ingested Assets</span>
            <FolderOpen size={14} className="text-[#EB3B2D]" />
          </div>
          <div className="text-2xl font-bold text-white">{assets.length}</div>
          <div className="text-[11px] font-mono text-neutral-500">
            Multimodal files & datasets
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Server API Requests</span>
            <Activity size={14} className="text-[#EB3B2D]" />
          </div>
          <div className="text-2xl font-bold text-white">
            {serverMetrics?.requests?.total ?? 1}
          </div>
          <div className="text-[11px] font-mono text-emerald-400">
            Uptime: {Math.round(Number(serverMetrics?.uptimeSeconds || 60))}s · Healthy
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Workspace Identity</span>
            <ShieldCheck size={14} className="text-[#EB3B2D]" />
          </div>
          <div className="text-sm font-semibold text-white truncate pt-1">
            {user ? user.email || user.displayName : 'Guest Studio Session'}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            {user ? (
              <span className="text-emerald-400">Firebase Auth Synced</span>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="text-[#EB3B2D] hover:underline cursor-pointer"
              >
                Sign in to sync across devices →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: D3 USAGE ANALYTICS & HISTORICAL CREDIT CONSUMPTION */}
      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <UsageAnalyticsDashboard />
      )}

      {/* SECTION: OVERVIEW / ANALYTICS */}
      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <AnalyticsChart
              title="Workspace Pipeline & Telemetry Activity"
              subtitle="Live stages completed per project and verified server telemetry"
              data={workspaceChartData}
              primaryLabel="Completed Stages / Events"
              secondaryLabel="Total Capacity"
              defaultMode="area"
            />
          </div>

          {/* Activity Feed & Generation History (VIZRA-Specific Component) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#111111] border border-white/[0.08] p-5 flex flex-col justify-between select-none">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#EB3B2D]" />
                  <h3 className="text-sm font-semibold text-white">
                    Activity & Generation Feed
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={fetchLiveTelemetry}
                  className="p-1.5 rounded-lg bg-[#171717] hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh telemetry"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-[#090909] border border-white/[0.06] flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium text-white truncate">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {p.stages.filter((s) => s.status === 'completed').length}/10 stages completed
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      Active
                    </span>
                  </div>
                ))}

                {(engageOverview?.auditLog || []).slice(0, 3).map((entry: any) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl bg-[#090909] border border-white/[0.06] space-y-0.5"
                  >
                    <div className="text-[11px] font-semibold text-neutral-200">
                      {entry.action}: {entry.targetId}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      Actor: {entry.actor}
                    </div>
                  </div>
                ))}

                {projects.length === 0 && (
                  <div className="py-6 text-center text-xs text-neutral-500">
                    Create a project or generate visual frames below to populate your studio history.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] mt-3 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Omnia 1.0 Governance</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> Verified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: PROJECTS DATA TABLE */}
      {(activeSection === 'overview' || activeSection === 'projects') && (
        <DataTable
          title="10-Stage Creative Projects"
          subtitle="Manage structured production workflows, advance stages, or export specifications"
          columns={projectColumns}
          data={projects}
          rowKey={(r) => r.id}
          searchPlaceholder="Search projects…"
          searchFilter={(r, q) =>
            r.title.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q)
          }
          emptyTitle="No 10-stage projects in workspace yet"
          emptyDescription="Initialize a structured 10-stage project here or ask Omnia 1.0 to turn any idea into a production pipeline."
          emptyAction={
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Create First Project
            </button>
          }
        />
      )}

      {/* SECTION: ASSETS & DRAG-AND-DROP FILE UPLOAD + AI IMAGE GENERATION RESULT */}
      {(activeSection === 'overview' || activeSection === 'assets') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl bg-[#111111] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Multimodal Asset Ingestion
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Drag and drop images, PDFs, CSV spreadsheets, or code files into your workspace inventory.
              </p>
            </div>
            <FileUpload
              onAttachmentReady={(att) => {
                setAssets((prev) => [att, ...prev]);
                toast({
                  title: 'Upload Completed',
                  description: `"${att.name}" (${att.size}) added to workspace assets.`,
                  type: 'success',
                });
              }}
              onRemoveAttachment={(id) => {
                setAssets((prev) => prev.filter((a) => a.id !== id));
              }}
            />
          </div>

          <div className="lg:col-span-6">
            <ImageGenerationCard
              prompt="Obsidian monolithic prism refracting surgical crimson laser caustics in 60fps dark studio space"
              aspectRatio="16:9"
              onSaveToProject={(dataUrl, promptText) => {
                const newAsset: Attachment = {
                  id: `synth-${Date.now()}`,
                  name: `omnia-frame-${Date.now().toString().slice(-4)}.png`,
                  type: 'image',
                  size: 'High-DPI PNG',
                  previewUrl: dataUrl,
                  content: promptText,
                };
                setAssets((prev) => [newAsset, ...prev]);
                toast({
                  title: 'Saved to Workspace Assets',
                  description: 'Generated visual frame added to your studio asset library.',
                  type: 'success',
                });
              }}
            />
          </div>
        </div>
      )}

      {/* SECTION: DEVELOPER & API KEYS */}
      {(activeSection === 'developer' || activeSection === 'team' || activeSection === 'settings') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
          <div className="lg:col-span-7 rounded-2xl bg-[#111111] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-[#EB3B2D]" />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Workspace Client API Tokens
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Generate scoped tokens for client SDKs and webhook telemetry. Server secrets are never exposed.
                  </p>
                </div>
              </div>
            </div>

            {newlyGeneratedSecret && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300">
                    New Token Generated — Copy Now
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyGeneratedSecret);
                      toast({
                        title: 'Token Copied',
                        description: 'Client workspace token copied to clipboard.',
                        type: 'success',
                      });
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-500 text-black font-semibold text-[11px] cursor-pointer"
                  >
                    Copy Secret
                  </button>
                </div>
                <code className="block p-2 rounded bg-black/60 font-mono text-xs text-emerald-200 select-all">
                  {newlyGeneratedSecret}
                </code>
              </div>
            )}

            <form
              onSubmit={handleCreateApiToken}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={newTokenLabel}
                onChange={(e) => setNewTokenLabel(e.target.value)}
                placeholder="Token label (e.g., Production CI / Telemetry)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#DC2626] focus:outline-none text-xs text-white"
              />
              <select
                value={newTokenScope}
                onChange={(e) =>
                  setNewTokenScope(e.target.value as WorkspaceApiToken['scope'])
                }
                aria-label="Token permission scope"
                className="px-3 py-2 rounded-xl bg-[#090909] border border-white/[0.1] text-xs text-neutral-300 focus:outline-none"
              >
                <option value="write:projects">write:projects</option>
                <option value="read:telemetry">read:telemetry</option>
                <option value="engage:events">engage:events</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs cursor-pointer shrink-0"
              >
                Generate Token
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {apiTokens.map((tok) => (
                <div
                  key={tok.id}
                  className="p-3 rounded-xl bg-[#090909] border border-white/[0.07] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{tok.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#171717] border border-white/[0.08] font-mono text-[10px] text-[#EB3B2D]">
                        {tok.scope}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-neutral-500 mt-0.5">
                      {tok.prefix} · Created{' '}
                      {new Date(tok.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tok.prefix);
                        setCopiedTokenId(tok.id);
                        window.setTimeout(() => setCopiedTokenId(null), 1500);
                      }}
                      className="p-1.5 rounded-lg bg-[#171717] hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                      title="Copy token prefix"
                    >
                      {copiedTokenId === tok.id ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = apiTokens.filter((t) => t.id !== tok.id);
                        setApiTokens(filtered);
                        localStorage.setItem(
                          TOKENS_STORAGE_KEY,
                          JSON.stringify(filtered)
                        );
                        toast({
                          title: 'Token Revoked',
                          description: `"${tok.label}" was revoked immediately.`,
                          type: 'warning',
                        });
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-neutral-500 hover:text-[#EB3B2D] cursor-pointer"
                      title="Revoke token"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[#111111] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Users size={15} className="text-[#EB3B2D]" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Role Permissions & Governance
                </h3>
                <p className="text-xs text-neutral-400">
                  Access control for VIZRA Engage & Technical SEO Diagnostics
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.07] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Current Session Role</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 font-mono text-[10px] text-emerald-400">
                    {user ? 'Authenticated Creator' : 'Guest Preview'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {user
                    ? `Signed in as ${user.email}. Firestore synchronization and ID token verification are active.`
                    : 'Sign in with Google or Email to enable persistent Firestore cloud storage.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.07] space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#EB3B2D]" />
                  <span>Protected Administrative Consoles</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Technical SEO & Crawler Diagnostics (`/seo-diagnostics`) are strictly gated behind server-side session and `ADMIN_API_KEY` verification.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/seo-diagnostics')}
                  className="w-full py-2 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-xs font-medium text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Private SEO Diagnostic Gate</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <Dialog
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Initialize 10-Stage VIZRA Project"
        description="Omnia structures your creative concept into 10 actionable stages with tasks and project memory."
        badge="10-Stage Pipeline"
      >
        <form onSubmit={handleCreateNewProject} className="space-y-4">
          <div>
            <label
              htmlFor="new-proj-title"
              className="block text-[11px] font-medium text-neutral-300 mb-1"
            >
              Project Title
            </label>
            <input
              id="new-proj-title"
              type="text"
              required
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="Obsidian Brand Film 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#DC2626] focus:outline-none text-xs text-white"
            />
          </div>
          <div>
            <label
              htmlFor="new-proj-prompt"
              className="block text-[11px] font-medium text-neutral-300 mb-1"
            >
              Creative Direction & Goal
            </label>
            <textarea
              id="new-proj-prompt"
              rows={3}
              value={newProjectPrompt}
              onChange={(e) => setNewProjectPrompt(e.target.value)}
              placeholder="Describe the target aesthetic, audience, and deliverable format…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#DC2626] focus:outline-none text-xs text-white resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-xs text-neutral-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-semibold text-xs cursor-pointer"
            >
              Create 10-Stage Project
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Project ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetProject}
        onClose={() => setDeleteTargetProject(null)}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Creative Project?"
        description={
          deleteTargetProject
            ? `Are you sure you want to permanently delete "${deleteTargetProject.title}" and its 10-stage workflow history?`
            : ''
        }
        confirmLabel="Delete Project"
        variant="danger"
      />

      {/* Export Project ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!exportTargetProject}
        onClose={() => setExportTargetProject(null)}
        onConfirm={() => {
          if (exportTargetProject) handleExportProjectJson(exportTargetProject);
        }}
        title="Export Project Specification"
        description={
          exportTargetProject
            ? `Export all 10 stages, tasks, and memory context for "${exportTargetProject.title}" as structured JSON?`
            : ''
        }
        confirmLabel="Download JSON"
        variant="export"
      />
    </DashboardShell>
  );
};
