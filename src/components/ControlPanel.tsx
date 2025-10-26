import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, RefreshCw, Settings, FileText, Mic, X } from "lucide-react";
import SettingsModal from "./SettingsModal";
import TitleBar from "./TitleBar";
import SupportDropdown from "./ui/SupportDropdown";
import TranscriptionItem from "./ui/TranscriptionItem";
import { ConfirmDialog, AlertDialog } from "./ui/dialog";
import { useDialogs } from "../hooks/useDialogs";
import { useHotkey } from "../hooks/useHotkey";
import { useToast } from "./ui/Toast";
import type { TranscriptionItem as TranscriptionItemType } from "../types/electron";

export default function ControlPanel() {
  const [history, setHistory] = useState<TranscriptionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { hotkey } = useHotkey();
  const { toast } = useToast();
  const [updateStatus, setUpdateStatus] = useState({
    updateAvailable: false,
    updateDownloaded: false,
    isDevelopment: false,
  });
  const isWindows =
    typeof window !== "undefined" && window.electronAPI?.getPlatform?.() === "win32";

  const {
    confirmDialog,
    alertDialog,
    showConfirmDialog,
    showAlertDialog,
    hideConfirmDialog,
    hideAlertDialog,
  } = useDialogs();

  const handleClose = () => {
    void window.electronAPI.windowClose();
  };

  // Memoize loadTranscriptions to prevent recreating on every render
  const loadTranscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const transcriptions = await window.electronAPI.getTranscriptions(50);
      console.log('[ControlPanel] Loaded transcriptions:', transcriptions.length);
      setHistory(transcriptions);
    } catch (error) {
      console.error('[ControlPanel] Error loading transcriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - function never changes

  useEffect(() => {
    // Load transcription history from database on mount
    loadTranscriptions();

    // Listen for new transcriptions (event-based, no polling)
    const handleTranscriptionAdded = (_event: any, _result: any) => {
      console.log('[ControlPanel] New transcription added, refreshing list...');
      loadTranscriptions();
    };

    window.electronAPI.onTranscriptionAdded(handleTranscriptionAdded);

    // Initialize update status
    const initializeUpdateStatus = async () => {
      try {
        const status = await window.electronAPI.getUpdateStatus();
        setUpdateStatus(status);
      } catch (error) {
        // Update status not critical for app function
      }
    };

    initializeUpdateStatus();

    // Set up update event listeners
    const handleUpdateAvailable = (_event: any, _info: any) => {
      setUpdateStatus((prev) => ({ ...prev, updateAvailable: true }));
    };

    const handleUpdateDownloaded = (_event: any, _info: any) => {
      setUpdateStatus((prev) => ({ ...prev, updateDownloaded: true }));
    };

    const handleUpdateError = (_event: any, _error: any) => {
      // Update errors are handled by the update service
    };

    window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    window.electronAPI.onUpdateError(handleUpdateError);

    // Cleanup listeners on unmount
    return () => {
      window.electronAPI.removeAllListeners?.("transcription-added");
      window.electronAPI.removeAllListeners?.("update-available");
      window.electronAPI.removeAllListeners?.("update-downloaded");
      window.electronAPI.removeAllListeners?.("update-error");
    };
  }, [loadTranscriptions]); // Include loadTranscriptions as dependency

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to your clipboard",
        variant: "success",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearHistory = async () => {
    showConfirmDialog({
      title: "Clear History",
      description:
        "Are you certain you wish to clear all inscribed records? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const result = await window.electronAPI.clearTranscriptions();
          setHistory([]);
          showAlertDialog({
            title: "History Cleared",
            description: `Successfully cleared ${result.cleared} transcriptions from your chronicles.`,
          });
        } catch (error) {
          showAlertDialog({
            title: "Error",
            description: "Failed to clear history. Please try again.",
          });
        }
      },
      variant: "destructive",
    });
  };

  const deleteTranscription = async (id: number) => {
    showConfirmDialog({
      title: "Delete Transcription",
      description: "Are you certain you wish to remove this inscription from your records?",
      onConfirm: async () => {
        try {
          const result = await window.electronAPI.deleteTranscription(id);
          if (result.success) {
            // Remove from local state
            setHistory((prev) => prev.filter((item) => item.id !== id));
          } else {
            showAlertDialog({
              title: "Delete Failed",
              description: "Failed to delete transcription. It may have already been removed.",
            });
          }
        } catch (error) {
          showAlertDialog({
            title: "Delete Failed",
            description: "Failed to delete transcription. Please try again.",
          });
        }
      },
      variant: "destructive",
    });
  };

  const refreshHistory = async () => {
    await loadTranscriptions();
  };

  return (
    <div className="min-h-screen bg-white">
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={hideConfirmDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      <AlertDialog
        open={alertDialog.open}
        onOpenChange={hideAlertDialog}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />

      <TitleBar
        actions={
          <>
            {/* Update notification badge */}
            {!updateStatus.isDevelopment &&
              (updateStatus.updateAvailable || updateStatus.updateDownloaded) && (
                <div className="relative">
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
              )}
            <SupportDropdown />
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={16} />
            </Button>
            {isWindows && (
              <div className="ml-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleClose}
                  aria-label="Close window"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </>
        }
      />

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />

      {/* Main content */}
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Transcriptions - Modern Clean Design */}
          <Card className="border border-neutral-200 shadow-none">
            <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Recent Transcriptions
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Your dictation history
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={refreshHistory}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </Button>
                  {history.length > 0 && (
                    <Button
                      onClick={clearHistory}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-neutral-500 hover:bg-error-50 hover:text-error-600"
                      title="Clear all"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-neutral-50/30 px-6 pb-6">
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="loader mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600" />
                  <p className="text-sm text-neutral-500">Loading transcriptions...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="mb-2 text-base font-semibold text-neutral-900">
                    No transcriptions yet
                  </h4>
                  <p className="mb-6 text-sm text-neutral-500">
                    Start recording to see your transcriptions here
                  </p>

                  {/* Quick Start - Clean Card */}
                  <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-neutral-900">Quick Start</p>
                    <p className="text-xs leading-relaxed text-neutral-600">
                      Press{" "}
                      <kbd className="mx-0.5 rounded border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-700 shadow-sm">
                        {hotkey}
                      </kbd>{" "}
                      to start recording, speak your text, then press{" "}
                      <kbd className="mx-0.5 rounded border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-700 shadow-sm">
                        {hotkey}
                      </kbd>{" "}
                      again to stop.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      {history.length} {history.length === 1 ? 'transcription' : 'transcriptions'}
                    </p>
                  </div>
                  <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                    {history.map((item, index) => (
                      <TranscriptionItem
                        key={item.id}
                        item={item}
                        index={index}
                        total={history.length}
                        onCopy={copyToClipboard}
                        onDelete={deleteTranscription}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
