import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Load transcription history from database
    loadTranscriptions();

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
      window.electronAPI.removeAllListeners?.("update-available");
      window.electronAPI.removeAllListeners?.("update-downloaded");
      window.electronAPI.removeAllListeners?.("update-error");
    };
  }, []);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      const transcriptions = await window.electronAPI.getTranscriptions(50);
      setHistory(transcriptions);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Transcriptions - Minimal Professional Design */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[15px] font-semibold text-gray-900">
                  Recent Transcriptions
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    onClick={refreshHistory}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw size={14} className="text-gray-600" />
                  </Button>
                  {history.length > 0 && (
                    <Button
                      onClick={clearHistory}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-600 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="loader mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  <p className="text-[12px] text-gray-500">Loading...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="mb-1 text-[14px] font-medium text-gray-900">
                    No transcriptions yet
                  </p>
                  <p className="mb-6 text-[12px] text-gray-500">
                    Press your hotkey to start recording
                  </p>

                  {/* Quick Start Guide - Minimal */}
                  <div className="mx-auto max-w-sm rounded border border-gray-200 bg-gray-50 p-4 text-left">
                    <p className="mb-3 text-[13px] font-medium text-gray-900">Quick Start</p>
                    <ol className="space-y-1.5 text-[12px] text-gray-600">
                      <li>1. Click in any text field</li>
                      <li>
                        2. Press{" "}
                        <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[11px]">
                          {hotkey}
                        </kbd>{" "}
                        to start
                      </li>
                      <li>3. Speak your text</li>
                      <li>
                        4. Press{" "}
                        <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[11px]">
                          {hotkey}
                        </kbd>{" "}
                        to stop
                      </li>
                      <li>5. Text appears automatically</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
