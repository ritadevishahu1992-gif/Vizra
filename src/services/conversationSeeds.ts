import { Conversation } from '../types/ai';

export function createInitialConversations(): Conversation[] {
  const now = Date.now();
  return [
    {
      id: 'conv-1',
      title: 'Welcome to Omnia',
      createdAt: now - 1000 * 60 * 60 * 2,
      updatedAt: now - 1000 * 60 * 60 * 2,
      group: 'today',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hi Omnia, what can you help me with?',
          timestamp: '10:14 AM',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content:
            "Hey! I can answer questions across science, history, coding, and general knowledge, explain complex concepts, write code, research topics, or help you build creative projects whenever you're ready. What are you working on today?",
          timestamp: '10:14 AM',
          isDemo: true,
          mode: 'quick',
          canCreateProject: false,
        },
      ],
    },
    {
      id: 'conv-2',
      title: 'Photosynthesis Overview',
      createdAt: now - 1000 * 60 * 60 * 24,
      updatedAt: now - 1000 * 60 * 60 * 24,
      group: 'yesterday',
      messages: [
        {
          id: 'msg-2-1',
          role: 'user',
          content: 'What is photosynthesis?',
          timestamp: '8:30 AM',
        },
        {
          id: 'msg-2-2',
          role: 'assistant',
          content:
            'Photosynthesis is the process plants use to convert light energy into chemical energy, mainly producing glucose from carbon dioxide and water.',
          timestamp: '8:30 AM',
          isDemo: true,
          mode: 'quick',
          canCreateProject: false,
        },
      ],
    },
    {
      id: 'conv-3',
      title: 'Procedural GLSL Shader Concept',
      createdAt: now - 1000 * 60 * 60 * 72,
      updatedAt: now - 1000 * 60 * 60 * 72,
      group: 'previous7Days',
      messages: [
        {
          id: 'msg-3-1',
          role: 'user',
          content: 'Synthesize a WebGL raymarched fluid shader in GLSL',
          timestamp: '3:15 PM',
        },
        {
          id: 'msg-3-2',
          role: 'assistant',
          content:
            'Here is a starter GLSL fragment shader structure for raymarched volumetric fluid motion:\n\n```glsl\nfloat sdSphere(vec3 p, float r) {\n  return length(p) - r;\n}\n```\n\nSend a follow-up prompt to expand camera ray setup, signed-distance smoothing, and rim lighting.',
          timestamp: '3:15 PM',
          isDemo: true,
          mode: 'code',
          canCreateProject: false,
        },
      ],
    },
  ];
}
