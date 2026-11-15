import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, ExternalLink, Lock, AlertCircle } from 'lucide-react';
import { Integration } from '../../types/ai';
import { VizraLogo } from '../VizraLogo';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import {
  fetchServerIntegrations,
  initiateIntegrationOAuth,
} from '../../services/integrationService';

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
  const { user, openLoginModal } = useAuth();
  const [liveIntegration, setLiveIntegration] = useState<Integration | null>(integration);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [pendingAuthUrl, setPendingAuthUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setLiveIntegration(integration);
    setOauthNotice(null);
    setPendingAuthUrl(null);

    if (!isOpen || !integration || integration.id === 'local_files') return;

    let cancelled = false;
    (async () => {
      try {
        const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
        const serverList = await fetchServerIntegrations(token);
        const match = serverList.find((i) => i.id === integration.id);
        if (!cancelled && match) {
          setLiveIntegration(match);
        }
      } catch {
        // Keep passed snapshot
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, integration]);

  if (!isOpen || !liveIntegration) return null;

  const handleStartOAuth = async () => {
    setOauthNotice(null);
    setPendingAuthUrl(null);
    if (!user || !auth?.currentUser) {
      openLoginModal();
      return;
    }
    setIsChecking(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await initiateIntegrationOAuth(liveIntegration.id, idToken);
      if (result.ok && result.authUrl) {
        setPendingAuthUrl(result.authUrl);
        return;
      }
      setOauthNotice(
        result.error ||
          'External OAuth App Approval Required: credentials are not configured on the server.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-5">
          <div className="flex items-center gap-2.5">
            <VizraLogo size={20} />
            <h3 className="font-semibold text-base tracking-tight">
              Connect {liveIntegration.name}
            </h3>
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
              <span>Least-Privilege OAuth Scope</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-mono text-[11px] bg-black/50 p-2.5 rounded-lg border border-neutral-850">
              {liveIntegration.scopeRequired ||
                'Allow Omnia to access the files you choose in this session.'}
            </p>
          </div>

          {liveIntegration.id !== 'local_files' && !liveIntegration.configured && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                <AlertCircle size={13} className="text-amber-400 shrink-0" />
                <span>External OAuth Approval Required</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                This connector uses server-side OAuth 2.0 with AES-256-GCM encrypted token storage. External provider approval and client credentials (
                {(liveIntegration.requiredEnvVars || []).join(', ')}) have not been provisioned yet.
              </p>
            </div>
          )}

          {oauthNotice && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-[11px] text-red-200 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span>{oauthNotice}</span>
            </div>
          )}

          {pendingAuthUrl && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-[11px] text-emerald-200 space-y-2">
              <div>Signed OAuth authorization request ready.</div>
              <a
                href={pendingAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
              >
                <span>Continue to {liveIntegration.name}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div className="space-y-2 text-neutral-400">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>Omnia never reads data without your explicit selection or instruction.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>You can revoke or disconnect authorized providers anytime in Workspace Settings.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {liveIntegration.id === 'local_files' ? (
            <button
              onClick={() => {
                onConfirmConnect(liveIntegration.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
            >
              Enable Local Files
            </button>
          ) : liveIntegration.configured ? (
            <button
              type="button"
              onClick={handleStartOAuth}
              disabled={isChecking}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              {isChecking ? 'Preparing OAuth...' : `Authorize ${liveIntegration.name}`}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[11px] cursor-not-allowed"
            >
              External OAuth Approval Required
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
