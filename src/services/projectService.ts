import { Project, ProjectWorkflowStage, ProjectTask, ProjectMemory } from '../types/ai';
import { createDefaultProjectMemory } from './memoryService';

const PROJECTS_STORAGE_KEY = 'vizra_omnia_projects_v1';

export const DEFAULT_STAGE_TEMPLATES: { title: string; description: string; defaultContent: string }[] = [
  {
    title: '1. Concept',
    description: 'Core thematic angle, narrative hook, and overarching creative premise.',
    defaultContent: `### Core Creative Concept
- **Premise**: Cinematic exploration into the gravitational singularity of supermassive black holes.
- **Tone**: Awe-inspiring, ominous, minimalist, mathematically precise.
- **Color Grade**: Pure void black, event horizon golden accretion, surgical Vizra red gravitational lensing.
- **Target Emotion**: Existential grandeur transitioning into technological mastery.`,
  },
  {
    title: '2. Research',
    description: 'Scientific and thematic foundations, factual references, and physical principles.',
    defaultContent: `### Research & Reference Data
- **General Relativity**: Kerr metric describing spinning black holes.
- **Photon Sphere**: Light orbits at 1.5x the Schwarzschild radius before irreversible horizon descent.
- **Relativistic Beaming**: Asymmetrical Doppler brightening of the approaching accretion disk limb.
- **Audio Physics**: Sub-bass gravitational wave frequencies transposed into audible spectrum (18Hz - 42Hz).`,
  },
  {
    title: '3. Script',
    description: 'Time-coded script with dialog, narrative beats, and pacing cues.',
    defaultContent: `### 30-Second Master Script

[00:00 - 00:05]
VO: "At the threshold of spacetime, geometry ceases to behave."
VISUAL: A singular filament of crimson light bends around a spherical shadow in total vacuum.

[00:05 - 00:15]
VO: "Time stretches to infinity. Matter accelerates to ninety-nine percent the speed of light."
VISUAL: Accretion disk ignites with hyper-relativistic plasma ribbons weaving across the frame.

[00:15 - 00:24]
VO: "Omnia models the singularity not as an abyss—but as the ultimate canvas of creative physics."
VISUAL: Camera pierces through the photon sphere. Geometric wireframes resolve into crystalline precision.

[00:24 - 00:30]
VO: "Turn infinite ideas into finished reality. Vizra."
VISUAL: Singularity pulses into the minimalist Vizra mark. Absolute silence.`,
  },
  {
    title: '4. Storyboard',
    description: 'Visual scene sequences, key framing directions, and focal points.',
    defaultContent: `### Storyboard Frame Blueprint
- **Frame 1 (00:00 - 00:05)**: Extreme Wide Shot (EWS) - Isolated black sphere centered in 16:9 obsidian space.
- **Frame 2 (00:05 - 00:10)**: Close-Up (CU) - Accretion disk edge showing gravitational Doppler shift.
- **Frame 3 (00:10 - 00:18)**: Dutch Angle Push-In - Relativistic jets erupting perpendicularly.
- **Frame 4 (00:18 - 00:25)**: First-Person Infall - Event horizon warping stars into Einstein rings.
- **Frame 5 (00:25 - 00:30)**: Center Lockup - Singular red refraction resolving to the Vizra glyph.`,
  },
  {
    title: '5. Shot List',
    description: 'Technical camera movements, lens choices, fps, and lighting setups.',
    defaultContent: `### Technical Shot List
| Shot | Angle | Lens | Motion | Lighting | FPS |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SH-01 | EWS Static | 35mm Prime | 0.2m Slow Dolly In | Ambient Void, Rim Edge | 24 fps |
| SH-02 | Macro CU | 100mm Anamorphic | Spiral Orbital Track | Plasma Luminescence | 60 fps |
| SH-03 | Dynamic Low | 24mm Ultra-Wide | Exponential Inward Dolly | Accretion Glow + Crimson Laser | 60 fps |
| SH-04 | Center Lock | 50mm Clean | Static Lock with Snap Zoom | Pure Monochrome with 4% Red | 24 fps |`,
  },
  {
    title: '6. Visual Prompts',
    description: 'Engineered prompts for AI image & video generation models.',
    defaultContent: `### Generation-Ready Visual Prompts

**Prompt 1 (Accretion Horizon)**:
\`cinematic wide shot of a Kerr supermassive black hole, luminous molten relativistic accretion disk, gravitational lensing curving background starfields into Einstein rings, obsidian volumetric space dust, hyper-detailed raymarched plasma, 8k render, Unreal Engine 5.4 aesthetics, Kodak Vision3 500T color tone --ar 16:9 --style raw\`

**Prompt 2 (Event Horizon Warp)**:
\`abstract kinetic geometry falling toward an event horizon, crimson laser refraction lines intersecting black glass bevels, mathematical precision, clean dark aesthetic, 60fps render style, high contrast, zero-noise void --ar 16:9\``,
  },
  {
    title: '7. Voiceover',
    description: 'Voice style, pacing, cadence notes, and audio frequency direction.',
    defaultContent: `### Voiceover Direction
- **Voice Profile**: Calm, authoritative, resonant baritone with intimate near-mic proximity (minimal room reflection).
- **Pacing**: Deliberate, 110 words per minute, intentional 0.8s micro-pauses at key punctuation.
- **Audio Chain**: Warm tube saturation, high-pass filter at 35Hz, dynamic de-esser at 5.8kHz.`,
  },
  {
    title: '8. Editing Plan',
    description: 'Pacing curve, cut points, sound design layers, and transition effects.',
    defaultContent: `### Post-Production & Editing Timeline
- **Cuts**: Rhythmic jump cuts synced to 120 BPM sub-bass pulse.
- **Transitions**: Zero generic cross-dissolves. Strictly hard cuts or light-refraction flash frames.
- **Sound Design**:
  - Sub-drop at 00:05 (40Hz ramp down).
  - High-frequency metallic tension wire at 00:15.
  - Total audio vacuum cut at 00:28 preceding the final title mark.`,
  },
  {
    title: '9. Thumbnail',
    description: 'High-CTR thumbnail concept, typography lockup, and visual focal hierarchy.',
    defaultContent: `### High-CTR Thumbnail Strategy
- **Visual Subject**: Massive asymmetrical glowing black hole disk consuming the right 65% of the frame.
- **Focal Hook**: A tiny silver spacecraft silhouette silhouetted against the colossal crimson light ring.
- **Typography**: Single word "SINGULARITY" in heavy grotesque serif, right aligned.
- **Contrast Check**: 98% pure black background ensures maximum thumbnail pop in YouTube dark & light modes.`,
  },
  {
    title: '10. Final Checklist',
    description: 'Pre-launch quality assurance, technical compliance, and distribution checks.',
    defaultContent: `### Pre-Export Quality Assurance
- [x] Aspect ratio verified: 16:9 (3840x2160 UHD).
- [x] Color space: Rec.709 with true black clamp (0,0,0).
- [x] Audio loudness: -14 LUFS integrated, -1.0 dB true peak.
- [ ] Subtitle SRT file generated and synced.
- [ ] Export archive bundled with all prompt seeds and project memory.`,
  },
];

export function createProjectFromPrompt(title: string, promptText: string, category: Project['category'] = 'video'): Project {
  const stages: ProjectWorkflowStage[] = DEFAULT_STAGE_TEMPLATES.map((tmpl, idx) => ({
    id: `stage-${idx + 1}`,
    index: idx + 1,
    title: tmpl.title,
    description: tmpl.description,
    status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'not_started',
    content: tmpl.defaultContent,
    updatedAt: Date.now(),
  }));

  const initialTasks: ProjectTask[] = [
    { id: 't-1', title: 'Review core creative concept', completed: true, stageId: 'stage-1', priority: 'high' },
    { id: 't-2', title: 'Verify relativistic physics parameters', completed: true, stageId: 'stage-2', priority: 'medium' },
    { id: 't-3', title: 'Record voiceover scratch track', completed: false, stageId: 'stage-7', priority: 'high' },
    { id: 't-4', title: 'Render visual prompt prototypes in 4K', completed: false, stageId: 'stage-6', priority: 'high' },
    { id: 't-5', title: 'Final edit and audio mixdown (-14 LUFS)', completed: false, stageId: 'stage-8', priority: 'medium' },
  ];

  const project: Project = {
    id: `proj-${Date.now()}`,
    title: title || 'Kinetic Singularity 30s',
    category,
    description: promptText ? `Created from prompt: "${promptText.slice(0, 100)}..."` : 'Cinematic multimodal project powered by Omnia 1.0.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stages,
    memory: createDefaultProjectMemory(promptText),
    tasks: initialTasks,
    notes: 'Project initialized via Omnia 1.0 Idea -> Project engine.',
    files: [],
  };

  saveProject(project);
  return project;
}

export function getAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      // Seed initial sample project
      const sample = createProjectFromPrompt(
        'Black Hole Cinematic 30s',
        'I want to make a 30-second cinematic video about black holes with 60fps kinetic motion.',
        'video'
      );
      return [sample];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getProjectById(id: string): Project | undefined {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id);
}

export function saveProject(project: Project): void {
  try {
    const projects = getAllProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    let updated: Project[];
    if (idx >= 0) {
      updated = [...projects];
      updated[idx] = { ...project, updatedAt: Date.now() };
    } else {
      updated = [project, ...projects];
    }
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save project', err);
  }
}

export function deleteProject(id: string): void {
  try {
    const projects = getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete project', err);
  }
}

export function updateStageContent(projectId: string, stageId: string, newContent: string, newStatus?: ProjectWorkflowStage['status']): Project | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  const stages = project.stages.map((s) => {
    if (s.id === stageId) {
      return {
        ...s,
        content: newContent,
        status: newStatus || s.status,
        updatedAt: Date.now(),
      };
    }
    return s;
  });

  const updatedProject: Project = {
    ...project,
    stages,
    updatedAt: Date.now(),
  };

  saveProject(updatedProject);
  return updatedProject;
}

export function updateProjectMemory(projectId: string, newMemory: Partial<ProjectMemory>): Project | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  const updatedProject: Project = {
    ...project,
    memory: { ...project.memory, ...newMemory },
    updatedAt: Date.now(),
  };

  saveProject(updatedProject);
  return updatedProject;
}

export function toggleTask(projectId: string, taskId: string): Project | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  const tasks = project.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  const updatedProject: Project = { ...project, tasks, updatedAt: Date.now() };
  saveProject(updatedProject);
  return updatedProject;
}

export function addTask(projectId: string, title: string, priority: ProjectTask['priority'] = 'medium'): Project | null {
  const project = getProjectById(projectId);
  if (!project) return null;

  const newTask: ProjectTask = {
    id: `t-${Date.now()}`,
    title: title.trim(),
    completed: false,
    priority,
  };
  const updatedProject: Project = { ...project, tasks: [...project.tasks, newTask], updatedAt: Date.now() };
  saveProject(updatedProject);
  return updatedProject;
}
