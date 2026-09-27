import React from 'react';
import { X, ShieldCheck, ExternalLink, Lock } from 'lucide-react';
import { Integration } from '../../types/ai';
import { VizraLogo } from '../VizraLogo';

interface IntegrationPermissionModalProps {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmConnect: (integrationId: string) => void;
}

export const IntegrationPermissionModal: React.FC<IntegrationPermissionModalProps> = ({
  integration,
  isOpen,
  onClose,
  onConfirmConnect,
}) => {
  if (!isOpen || !integration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-5">
          <div className="flex items-center gap-2.5">
            <VizraLogo size={20} />
            <h3 className="font-semibold text-base tracking-tight">Connect {integration.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold">
              <Lock size={14} className="text-[#eb3b2d]" />
              <span>Requested Permission Scope</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-mono text-[11px] bg-black/50 p-2.5 rounded-lg border border-neutral-850">
              {integration.scopeRequired || 'Allow Omnia to access the files you choose in this session.'}
            </p>
          </div>

          <div className="space-y-2 text-neutral-400">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>Omnia never reads data without your explicit selection or instruction.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>You can revoke or disconnect this service anytime in Workspace Settings.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirmConnect(integration.id);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
          >
            Authorize Connection
          </button>
        </div>
      </div>
    </div>
  );
};
