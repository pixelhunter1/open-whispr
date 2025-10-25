import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RefreshCw, Download, Keyboard, Mic, Shield } from "lucide-react";
import WhisperModelPicker from "./WhisperModelPicker";
import ProcessingModeSelector from "./ui/ProcessingModeSelector";
import ApiKeyInput from "./ui/ApiKeyInput";
import { ConfirmDialog, AlertDialog } from "./ui/dialog";
import { useSettings } from "../hooks/useSettings";
import { useDialogs } from "../hooks/useDialogs";
import { useAgentName } from "../utils/agentName";
import { useWhisper } from "../hooks/useWhisper";
import { usePermissions } from "../hooks/usePermissions";
import { useClipboard } from "../hooks/useClipboard";
import { REASONING_PROVIDERS } from "../utils/languages";
import { formatHotkeyLabel } from "../utils/hotkeys";
import LanguageSelector from "./ui/LanguageSelector";
import PromptStudio from "./ui/PromptStudio";
import { API_ENDPOINTS } from "../config/constants";
import AIModelSelectorEnhanced from "./AIModelSelectorEnhanced";
import type { UpdateInfoResult } from "../types/electron";
const InteractiveKeyboard = React.lazy(() => import("./ui/Keyboard"));
import HotkeyCapture from "./ui/HotkeyCapture";
import { getLanguageLabel } from "../utils/languages";

export type SettingsSectionType =
  | "general"
  | "transcription"
  | "aiModels"
  | "agentConfig"
  | "prompts";

interface SettingsPageProps {
  activeSection?: SettingsSectionType;
}

export default function SettingsPage({
  activeSection = "general",
}: SettingsPageProps) {
  // Use custom hooks
  const {
    confirmDialog,
    alertDialog,
    showConfirmDialog,
    showAlertDialog,
    hideConfirmDialog,
    hideAlertDialog,
  } = useDialogs();

  const {
    useLocalWhisper,
    whisperModel,
    allowOpenAIFallback,
    allowLocalFallback,
    fallbackWhisperModel,
    preferredLanguage,
    cloudTranscriptionBaseUrl,
    enableTranslation,
    targetLanguage,
    cloudReasoningBaseUrl,
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    openaiApiKey,
    anthropicApiKey,
    geminiApiKey,
    dictationKey,
    setUseLocalWhisper,
    setWhisperModel,
    setAllowOpenAIFallback,
    setAllowLocalFallback,
    setFallbackWhisperModel,
    setPreferredLanguage,
    setCloudTranscriptionBaseUrl,
    setEnableTranslation,
    setTargetLanguage,
    setCloudReasoningBaseUrl,
    setUseReasoningModel,
    setReasoningModel,
    setReasoningProvider,
    setOpenaiApiKey,
    setAnthropicApiKey,
    setGeminiApiKey,
    setDictationKey,
    updateTranscriptionSettings,
    updateReasoningSettings,
    updateApiKeys,
  } = useSettings();

  // Update state
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<{
    updateAvailable: boolean;
    updateDownloaded: boolean;
    isDevelopment: boolean;
  }>({ updateAvailable: false, updateDownloaded: false, isDevelopment: false });
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [installInitiated, setInstallInitiated] = useState(false);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string;
    releaseDate?: string;
    releaseNotes?: string;
  }>({});
  const [isRemovingModels, setIsRemovingModels] = useState(false);
  const [hotkeyInputMode, setHotkeyInputMode] = useState<"keyboard" | "capture">("capture");
  const cachePathHint =
    typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent)
      ? "%USERPROFILE%\\.cache\\openwhispr\\models"
      : "~/.cache/openwhispr/models";

  const isUpdateAvailable =
    !updateStatus.isDevelopment &&
    (updateStatus.updateAvailable || updateStatus.updateDownloaded);

  const whisperHook = useWhisper(showAlertDialog);
  const permissionsHook = usePermissions(showAlertDialog);
  const { pasteFromClipboardWithFallback } = useClipboard(showAlertDialog);
  const { agentName, setAgentName } = useAgentName();
  const installTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subscribeToUpdates = useCallback(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onUpdateAvailable?.((_event, info) => {
      setUpdateStatus((prev) => ({ ...prev, updateAvailable: true, updateDownloaded: false }));
      if (info) {
        setUpdateInfo({
          version: info.version || "unknown",
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes ?? undefined,
        });
      }
    });

    window.electronAPI.onUpdateNotAvailable?.(() => {
      setUpdateStatus((prev) => ({ ...prev, updateAvailable: false, updateDownloaded: false }));
      setUpdateInfo({});
      setDownloadingUpdate(false);
      setInstallInitiated(false);
      setUpdateDownloadProgress(0);
    });

    window.electronAPI.onUpdateDownloaded?.((_event, info) => {
      setUpdateStatus((prev) => ({ ...prev, updateDownloaded: true }));
      setDownloadingUpdate(false);
      setInstallInitiated(false);
      if (info) {
        setUpdateInfo({
          version: info.version || "unknown",
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes ?? undefined,
        });
      }
    });

    window.electronAPI.onUpdateDownloadProgress?.((_event, progressObj) => {
      setUpdateDownloadProgress(progressObj.percent || 0);
    });

    window.electronAPI.onUpdateError?.((_event, error) => {
      setCheckingForUpdates(false);
      setDownloadingUpdate(false);
      setInstallInitiated(false);
      console.error("Update error:", error);
      showAlertDialog({
        title: "Update Error",
        description:
          typeof error?.message === "string"
            ? error.message
            : "The updater encountered a problem. Please try again or download the latest release manually.",
      });
    });
  }, [showAlertDialog]);

  // Local state for provider selection (overrides computed value)
  const [localReasoningProvider, setLocalReasoningProvider] = useState(() => {
    return localStorage.getItem("reasoningProvider") || reasoningProvider;
  });

  // Defer heavy operations for better performance
  useEffect(() => {
    let mounted = true;

    // Defer version and update checks to improve initial render
    const timer = setTimeout(async () => {
      if (!mounted) return;

      const versionResult = await window.electronAPI?.getAppVersion();
      if (versionResult && mounted) setCurrentVersion(versionResult.version);

      const statusResult = await window.electronAPI?.getUpdateStatus();
      if (statusResult && mounted) {
        setUpdateStatus((prev) => ({
          ...prev,
          ...statusResult,
          updateAvailable: prev.updateAvailable || statusResult.updateAvailable,
          updateDownloaded: prev.updateDownloaded || statusResult.updateDownloaded,
        }));
        if ((statusResult.updateAvailable || statusResult.updateDownloaded) && window.electronAPI?.getUpdateInfo) {
          const info = await window.electronAPI.getUpdateInfo();
          if (info) {
            setUpdateInfo({
              version: info.version || "unknown",
              releaseDate: info.releaseDate,
              releaseNotes: info.releaseNotes ?? undefined,
            });
          }
        }
      }

      subscribeToUpdates();

      // Check whisper after initial render
      if (mounted) {
        whisperHook.checkWhisperInstallation();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      // Always clean up update listeners if they exist
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners?.("update-available");
        window.electronAPI.removeAllListeners?.("update-not-available");
        window.electronAPI.removeAllListeners?.("update-downloaded");
        window.electronAPI.removeAllListeners?.("update-error");
        window.electronAPI.removeAllListeners?.("update-download-progress");
      }
    };
  }, [whisperHook, subscribeToUpdates]);

  useEffect(() => {
    if (installInitiated) {
      if (installTimeoutRef.current) {
        clearTimeout(installTimeoutRef.current);
      }
      installTimeoutRef.current = setTimeout(() => {
        setInstallInitiated(false);
        showAlertDialog({
          title: "Still Running",
          description:
            "OpenWhispr didn't restart automatically. Please quit the app manually to finish installing the update.",
        });
      }, 10000);
    } else if (installTimeoutRef.current) {
      clearTimeout(installTimeoutRef.current);
      installTimeoutRef.current = null;
    }

    return () => {
      if (installTimeoutRef.current) {
        clearTimeout(installTimeoutRef.current);
        installTimeoutRef.current = null;
      }
    };
  }, [installInitiated, showAlertDialog]);

  const saveReasoningSettings = useCallback(async () => {
    const normalizedReasoningBase = (cloudReasoningBaseUrl || '').trim();
    setCloudReasoningBaseUrl(normalizedReasoningBase);

    // Update reasoning settings
    updateReasoningSettings({ 
      useReasoningModel, 
      reasoningModel,
      cloudReasoningBaseUrl: normalizedReasoningBase
    });
    
    // Save API keys to backend based on provider
    if (localReasoningProvider === "openai" && openaiApiKey) {
      await window.electronAPI?.saveOpenAIKey(openaiApiKey);
    }
    if (localReasoningProvider === "anthropic" && anthropicApiKey) {
      await window.electronAPI?.saveAnthropicKey(anthropicApiKey);
    }
    if (localReasoningProvider === "gemini" && geminiApiKey) {
      await window.electronAPI?.saveGeminiKey(geminiApiKey);
    }
    
    updateApiKeys({
      ...(localReasoningProvider === "openai" &&
        openaiApiKey.trim() && { openaiApiKey }),
      ...(localReasoningProvider === "anthropic" &&
        anthropicApiKey.trim() && { anthropicApiKey }),
      ...(localReasoningProvider === "gemini" &&
        geminiApiKey.trim() && { geminiApiKey }),
    });
    
    // Save the provider separately since it's computed from the model
    localStorage.setItem("reasoningProvider", localReasoningProvider);

    const providerLabel =
      localReasoningProvider === 'custom'
        ? 'Custom'
        : REASONING_PROVIDERS[
            localReasoningProvider as keyof typeof REASONING_PROVIDERS
          ]?.name || localReasoningProvider;

    showAlertDialog({
      title: "Reasoning Settings Saved",
      description: `AI text enhancement ${
        useReasoningModel ? "enabled" : "disabled"
      } with ${
        providerLabel
      } ${reasoningModel}`,
    });
  }, [
    useReasoningModel,
    reasoningModel,
    localReasoningProvider,
    openaiApiKey,
    anthropicApiKey,
    updateReasoningSettings,
    updateApiKeys,
    showAlertDialog,
  ]);

  const saveApiKey = useCallback(async () => {
    try {
      // Save all API keys to backend
      if (openaiApiKey) {
        await window.electronAPI?.saveOpenAIKey(openaiApiKey);
      }
      if (anthropicApiKey) {
        await window.electronAPI?.saveAnthropicKey(anthropicApiKey);
      }
      if (geminiApiKey) {
        await window.electronAPI?.saveGeminiKey(geminiApiKey);
      }
      
      updateApiKeys({ openaiApiKey, anthropicApiKey, geminiApiKey });
      updateTranscriptionSettings({ allowLocalFallback, fallbackWhisperModel });

      try {
        if (openaiApiKey) {
          await window.electronAPI?.createProductionEnvFile(openaiApiKey);
        }
        
        const savedKeys: string[] = [];
        if (openaiApiKey) savedKeys.push("OpenAI");
        if (anthropicApiKey) savedKeys.push("Anthropic");
        if (geminiApiKey) savedKeys.push("Gemini");
        
        showAlertDialog({
          title: "API Keys Saved",
          description: `${savedKeys.join(", ")} API key${savedKeys.length > 1 ? 's' : ''} saved successfully! Your credentials have been securely recorded.${
            allowLocalFallback ? " Local Whisper fallback is enabled." : ""
          }`,
        });
      } catch (envError) {
        showAlertDialog({
          title: "API Key Saved",
          description: `OpenAI API key saved successfully and will be available for transcription${
            allowLocalFallback ? " with Local Whisper fallback enabled" : ""
          }`,
        });
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      updateApiKeys({ openaiApiKey });
      updateTranscriptionSettings({ allowLocalFallback, fallbackWhisperModel });
      showAlertDialog({
        title: "API Key Saved",
        description: "OpenAI API key saved to localStorage (fallback mode)",
      });
    }
  }, [
    openaiApiKey,
    anthropicApiKey,
    geminiApiKey,
    allowLocalFallback,
    fallbackWhisperModel,
    updateApiKeys,
    updateTranscriptionSettings,
    showAlertDialog,
  ]);

  const resetAccessibilityPermissions = () => {
    const message = `🔄 RESET ACCESSIBILITY PERMISSIONS\n\nIf you've rebuilt or reinstalled OpenWhispr and automatic inscription isn't functioning, you may have obsolete permissions from the previous version.\n\n📋 STEP-BY-STEP RESTORATION:\n\n1️⃣ Open System Settings (or System Preferences)\n   • macOS Ventura+: Apple Menu → System Settings\n   • Older macOS: Apple Menu → System Preferences\n\n2️⃣ Navigate to Privacy & Security → Accessibility\n\n3️⃣ Look for obsolete OpenWhispr entries:\n   • Any entries named "OpenWhispr"\n   • Any entries named "Electron"\n   • Any entries with unclear or generic names\n   • Entries pointing to old application locations\n\n4️⃣ Remove ALL obsolete entries:\n   • Select each old entry\n   • Click the minus (-) button\n   • Enter your password if prompted\n\n5️⃣ Add the current OpenWhispr:\n   • Click the plus (+) button\n   • Navigate to and select the CURRENT OpenWhispr app\n   • Ensure the checkbox is ENABLED\n\n6️⃣ Restart OpenWhispr completely\n\n💡 This is very common during development when rebuilding applications!\n\nClick OK when you're ready to open System Settings.`;

    showConfirmDialog({
      title: "Reset Accessibility Permissions",
      description: message,
      onConfirm: () => {
        showAlertDialog({
          title: "Opening System Settings",
          description:
            "Opening System Settings... Look for the Accessibility section under Privacy & Security.",
        });

        window.open(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
          "_blank"
        );
      },
    });
  };

  const saveKey = async () => {
    try {
      const result = await window.electronAPI?.updateHotkey(dictationKey);

      if (!result?.success) {
        showAlertDialog({
          title: "Hotkey Not Saved",
          description:
            result?.message ||
            "This key could not be registered. Please choose a different key.",
        });
        return;
      }

      showAlertDialog({
        title: "Key Saved",
        description: `Dictation key saved: ${formatHotkeyLabel(dictationKey)}`,
      });
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      showAlertDialog({
        title: "Error",
        description: `Failed to update hotkey: ${error.message}`,
      });
    }
  };

  const handleRemoveModels = useCallback(() => {
    if (isRemovingModels) return;

    showConfirmDialog({
      title: "Remove downloaded models?",
      description:
        `This deletes all locally cached Whisper models (${cachePathHint}) and frees disk space. You can download them again from the model picker.`,
      confirmText: "Delete Models",
      variant: "destructive",
      onConfirm: () => {
        setIsRemovingModels(true);
        window.electronAPI
          ?.modelDeleteAll?.()
          .then((result) => {
            if (!result?.success) {
              showAlertDialog({
                title: "Unable to Remove Models",
                description:
                  result?.error ||
                  "Something went wrong while deleting the cached models.",
              });
              return;
            }

            window.dispatchEvent(new Event("openwhispr-models-cleared"));

            showAlertDialog({
              title: "Models Removed",
              description:
                "All downloaded Whisper models were deleted. You can re-download any model from the picker when needed.",
            });
          })
          .catch((error) => {
            showAlertDialog({
              title: "Unable to Remove Models",
              description: error?.message || "An unknown error occurred.",
            });
          })
          .finally(() => {
            setIsRemovingModels(false);
          });
      },
    });
  }, [isRemovingModels, cachePathHint, showConfirmDialog, showAlertDialog]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-6">
            {/* App Updates Section */}
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  App Updates
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Keep OpenWhispr up to date with the latest features and improvements
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#1d1d1f]">Current Version</p>
                  <p className="text-sm text-[#86868b] mt-0.5">{currentVersion || "Loading..."}</p>
                </div>
                <div>
                  {updateStatus.isDevelopment ? (
                    <span className="text-xs text-[#86868b] bg-white px-2.5 py-1 rounded-md border border-[#d2d2d7]">
                      Development
                    </span>
                  ) : updateStatus.updateAvailable ? (
                    <span className="text-xs text-[#007AFF] bg-[rgba(0,122,255,0.1)] px-2.5 py-1 rounded-md border-0 font-medium">
                      Update Available
                    </span>
                  ) : (
                    <span className="text-xs text-[#86868b] bg-white px-2.5 py-1 rounded-md border border-[#d2d2d7]">
                      Up to Date
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={async () => {
                    setCheckingForUpdates(true);
                    try {
                      const result = await window.electronAPI?.checkForUpdates();
                      if (result?.updateAvailable) {
                        setUpdateInfo({
                          version: result.version || 'unknown',
                          releaseDate: result.releaseDate,
                          releaseNotes: result.releaseNotes,
                        });
                        setUpdateStatus((prev) => ({
                          ...prev,
                          updateAvailable: true,
                          updateDownloaded: false,
                        }));
                        showAlertDialog({
                          title: "Update Available",
                          description: `Update available: v${result.version || 'new version'}`,
                        });
                      } else {
                        showAlertDialog({
                          title: "No Updates",
                          description: result?.message || "No updates available",
                        });
                      }
                    } catch (error: any) {
                      showAlertDialog({
                        title: "Update Check Failed",
                        description: `Error checking for updates: ${error.message}`,
                      });
                    } finally {
                      setCheckingForUpdates(false);
                    }
                  }}
                  disabled={checkingForUpdates || updateStatus.isDevelopment}
                  variant="outline"
                  className="w-full justify-start text-sm h-10 bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#b8b8bd] text-[#1d1d1f] rounded-lg transition-all duration-150"
                >
                  <RefreshCw size={16} className="mr-2" />
                  {checkingForUpdates ? "Checking for Updates..." : "Check for Updates"}
                </Button>

                {isUpdateAvailable && !updateStatus.updateDownloaded && (
                  <div className="space-y-2">
                    <Button
                      onClick={async () => {
                        setDownloadingUpdate(true);
                        setUpdateDownloadProgress(0);
                        try {
                          await window.electronAPI?.downloadUpdate();
                        } catch (error: any) {
                          setDownloadingUpdate(false);
                          showAlertDialog({
                            title: "Download Failed",
                            description: `Failed to download update: ${error.message}`,
                          });
                        }
                      }}
                      disabled={downloadingUpdate}
                      className="w-full justify-start text-sm h-10 bg-[#007AFF] hover:bg-[#0051D5] active:bg-[#004BB8] text-white rounded-lg transition-all duration-150 font-medium border-0"
                    >
                      <Download size={16} className="mr-2" />
                      {downloadingUpdate
                        ? `Downloading Update... ${Math.round(updateDownloadProgress)}%`
                        : `Download Update${updateInfo.version ? ` v${updateInfo.version}` : ''}`
                      }
                    </Button>

                    {downloadingUpdate && (
                      <div className="px-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[#d2d2d7]">
                          <div
                            className="h-full bg-[#007AFF] transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, updateDownloadProgress))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {updateStatus.updateDownloaded && (
                  <Button
                    onClick={() => {
                      showConfirmDialog({
                        title: "Install Update",
                        description: `Ready to install update${updateInfo.version ? ` v${updateInfo.version}` : ''}. The app will restart to complete installation.`,
                        confirmText: "Install & Restart",
                        onConfirm: async () => {
                          try {
                            setInstallInitiated(true);
                            const result = await window.electronAPI?.installUpdate?.();
                            if (!result?.success) {
                              setInstallInitiated(false);
                              showAlertDialog({
                                title: "Install Failed",
                                description: result?.message || "Failed to start the installer. Please try again.",
                              });
                              return;
                            }
                            showAlertDialog({
                              title: "Installing Update",
                              description: "OpenWhispr will restart automatically to finish installing the newest version.",
                            });
                          } catch (error: any) {
                            setInstallInitiated(false);
                            showAlertDialog({
                              title: "Install Failed",
                              description: `Failed to install update: ${error.message}`,
                            });
                          }
                        },
                      });
                    }}
                    disabled={installInitiated}
                    className="w-full justify-start text-sm h-10 bg-[#007AFF] hover:bg-[#0051D5] active:bg-[#004BB8] text-white rounded-lg transition-all duration-150 font-medium border-0"
                  >
                    <RefreshCw size={16} className={`mr-2 ${installInitiated ? 'animate-spin' : ''}`} />
                    {installInitiated ? "Installing Update..." : "Install & Restart"}
                  </Button>
                )}

                {updateInfo.version && (
                  <div className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg text-sm">
                    <p className="font-medium text-[#1d1d1f] mb-1">
                      Version {updateInfo.version}
                    </p>
                    {updateInfo.releaseDate && (
                      <p className="text-xs text-[#86868b] mb-2">
                        {new Date(updateInfo.releaseDate).toLocaleDateString()}
                      </p>
                    )}
                    {updateInfo.releaseNotes && (
                      <div className="text-xs text-[#1d1d1f] mt-2 pt-2 border-t border-[#d2d2d7]">
                        <div className="whitespace-pre-wrap">{updateInfo.releaseNotes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Hotkey Section */}
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  Dictation Hotkey
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Configure the key combination to start and stop voice dictation
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-1 p-1 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
                  <button
                    onClick={() => setHotkeyInputMode("capture")}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      hotkeyInputMode === "capture"
                        ? "bg-white text-[#1d1d1f] border border-[#d2d2d7] shadow-sm"
                        : "text-[#86868b] hover:text-[#1d1d1f]"
                    }`}
                  >
                    Key Combinations
                  </button>
                  <button
                    onClick={() => setHotkeyInputMode("keyboard")}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      hotkeyInputMode === "keyboard"
                        ? "bg-white text-[#1d1d1f] border border-[#d2d2d7] shadow-sm"
                        : "text-[#86868b] hover:text-[#1d1d1f]"
                    }`}
                  >
                    Visual Keyboard
                  </button>
                </div>

                {hotkeyInputMode === "capture" ? (
                  <div>
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                      Hotkey Combination
                    </label>
                    <HotkeyCapture
                      value={dictationKey}
                      onChange={setDictationKey}
                      placeholder="Click and press a key combination"
                    />
                    <p className="text-xs text-[#86868b] mt-2">
                      Supports modifier keys (Ctrl, Alt, Shift)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                        Activation Key
                      </label>
                      <Input
                        placeholder="Default: ` (backtick)"
                        value={dictationKey}
                        onChange={(e) => setDictationKey(e.target.value)}
                        className="text-center text-lg font-mono"
                      />
                      <p className="text-xs text-[#86868b] mt-2">
                        Press this key from anywhere to start/stop dictation
                      </p>
                    </div>
                    <div className="bg-[#f5f5f7] p-3 border border-[#d2d2d7] rounded-lg">
                      <p className="text-sm font-medium text-[#1d1d1f] mb-2">
                        Select a key:
                      </p>
                      <React.Suspense
                        fallback={
                          <div className="h-32 flex items-center justify-center text-[#86868b] text-sm">
                            Loading keyboard...
                          </div>
                        }
                      >
                        <InteractiveKeyboard
                          selectedKey={dictationKey}
                          setSelectedKey={setDictationKey}
                        />
                      </React.Suspense>
                    </div>
                  </div>
                )}

                <Button
                  onClick={saveKey}
                  disabled={!dictationKey.trim()}
                  className="w-full justify-start text-sm h-10 bg-[#007AFF] hover:bg-[#0051D5] active:bg-[#004BB8] text-white disabled:opacity-50 rounded-lg transition-all duration-150 font-medium border-0"
                >
                  <Keyboard size={16} className="mr-2" />
                  Save Hotkey Configuration
                </Button>
              </div>
            </section>

            {/* Permissions Section */}
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  System Permissions
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Manage microphone and accessibility permissions
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={permissionsHook.requestMicPermission}
                  variant="outline"
                  className="w-full justify-start text-sm h-10 bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#b8b8bd] text-[#1d1d1f] rounded-lg transition-all duration-150"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Test Microphone Access
                </Button>
                <Button
                  onClick={permissionsHook.testAccessibilityPermission}
                  variant="outline"
                  className="w-full justify-start text-sm h-10 bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#b8b8bd] text-[#1d1d1f] rounded-lg transition-all duration-150"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Test Accessibility Access
                </Button>
                <Button
                  onClick={resetAccessibilityPermissions}
                  variant="outline"
                  className="w-full justify-start text-sm h-10 bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#b8b8bd] text-[#1d1d1f] rounded-lg transition-all duration-150"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Accessibility Permissions
                </Button>
              </div>
            </section>

            {/* App Information */}
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  Application Info
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg text-center">
                  <Keyboard className="w-5 h-5 text-[#86868b] mx-auto mb-2" />
                  <p className="text-xs font-medium text-[#1d1d1f] mb-1">Hotkey</p>
                  <p className="text-xs text-[#86868b] font-mono">
                    {formatHotkeyLabel(dictationKey)}
                  </p>
                </div>
                <div className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg text-center">
                  <div className="w-5 h-5 mx-auto mb-2 text-[#86868b] font-medium">v</div>
                  <p className="text-xs font-medium text-[#1d1d1f] mb-1">Version</p>
                  <p className="text-xs text-[#86868b]">{currentVersion || "0.1.0"}</p>
                </div>
                <div className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg text-center">
                  <div className="w-5 h-5 mx-auto mb-2 text-[#007AFF] font-bold">•</div>
                  <p className="text-xs font-medium text-[#1d1d1f] mb-1">Status</p>
                  <p className="text-xs text-[#007AFF] font-medium">Active</p>
                </div>
              </div>
            </section>

            {/* Maintenance Section */}
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  Maintenance
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Reset settings and manage local data
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    showConfirmDialog({
                      title: "Reset Onboarding",
                      description: "Are you sure you want to reset the onboarding process? This will clear your setup and show the welcome flow again.",
                      onConfirm: () => {
                        localStorage.removeItem("onboardingCompleted");
                        window.location.reload();
                      },
                      variant: "destructive",
                    });
                  }}
                  variant="outline"
                  className="w-full justify-start text-sm h-10 bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#b8b8bd] text-[#1d1d1f] rounded-lg transition-all duration-150"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Onboarding Flow
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRemoveModels}
                  disabled={isRemovingModels}
                  className="w-full justify-start text-sm h-10 bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#b8b8bd] text-[#1d1d1f] rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isRemovingModels ? "Removing Models..." : "Remove Downloaded Models"}
                </Button>

                <div className="pt-2 border-t border-[#d2d2d7]">
                  <Button
                    onClick={() => {
                      showConfirmDialog({
                        title: "Clean Up App Data",
                        description: "This will permanently delete ALL OpenWhispr data including database, settings, and downloaded models. This action cannot be undone. Are you sure?",
                        onConfirm: () => {
                          window.electronAPI
                            ?.cleanupApp()
                            .then(() => {
                              showAlertDialog({
                                title: "Cleanup Completed",
                                description: "All app data has been removed.",
                              });
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            })
                            .catch((error) => {
                              showAlertDialog({
                                title: "Cleanup Failed",
                                description: `Cleanup failed: ${error.message}`,
                              });
                            });
                        },
                        variant: "destructive",
                      });
                    }}
                    variant="outline"
                    className="w-full justify-start text-sm h-10 bg-white text-[#ff3b30] border-[#ff3b30]/20 hover:bg-[#ff3b30]/5 hover:border-[#ff3b30]/30 rounded-lg transition-all duration-150"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete All Application Data
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
                <p className="text-xs text-[#86868b]">
                  Model cache: <code className="text-[#1d1d1f]">{cachePathHint}</code>
                </p>
              </div>
            </section>
          </div>
        );

      case "transcription":
        return (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  Speech to Text Processing
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Configure how your voice is transcribed
                </p>
              </div>
              <ProcessingModeSelector
                useLocalWhisper={useLocalWhisper}
                setUseLocalWhisper={(value) => {
                  setUseLocalWhisper(value);
                  updateTranscriptionSettings({ useLocalWhisper: value });
                }}
              />
            </section>

            {!useLocalWhisper && (
              <section className="space-y-4 p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
                <h4 className="font-medium text-[#1d1d1f]">Cloud Setup</h4>
                <ApiKeyInput
                  apiKey={openaiApiKey}
                  setApiKey={setOpenaiApiKey}
                  helpText="Supports OpenAI or compatible endpoints"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1d1d1f]">
                    Custom Base URL (optional)
                  </label>
                  <Input
                    value={cloudTranscriptionBaseUrl}
                    onChange={(event) => setCloudTranscriptionBaseUrl(event.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCloudTranscriptionBaseUrl(API_ENDPOINTS.TRANSCRIPTION_BASE)}
                  >
                    Reset to Default
                  </Button>
                  <p className="text-xs text-[#86868b]">
                    Requests use this OpenAI-compatible base URL. Leave empty for default
                    <code className="ml-1 text-[#1d1d1f]">{API_ENDPOINTS.TRANSCRIPTION_BASE}</code>
                  </p>
                </div>
              </section>
            )}

            {useLocalWhisper && whisperHook.whisperInstalled && (
            <section className="space-y-4 p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
              <h4 className="font-medium text-[#1d1d1f]">
                Local Whisper Model
              </h4>
              <WhisperModelPicker
                selectedModel={whisperModel}
                onModelSelect={setWhisperModel}
                variant="settings"
              />
            </section>
          )}

          <section className="space-y-4 p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
            <h4 className="font-medium text-[#1d1d1f]">Preferred Language</h4>
            <LanguageSelector
              value={preferredLanguage}
              onChange={(value) => {
                setPreferredLanguage(value);
                updateTranscriptionSettings({ preferredLanguage: value });
              }}
              className="w-full"
            />
            <p className="text-xs text-[#86868b]">
              Language for speech recognition
            </p>
          </section>

          {/* Translation Section */}
          <section className="space-y-3 p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">Automatic Translation</p>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Translate text to another language
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTranslation}
                  onChange={(e) => {
                    setEnableTranslation(e.target.checked);
                    updateTranscriptionSettings({ enableTranslation: e.target.checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#d2d2d7] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#007AFF]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#d2d2d7] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007AFF]"></div>
              </label>
            </div>

            {enableTranslation && (
              <div className="space-y-3 pt-3 border-t border-[#d2d2d7]">
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#d2d2d7] text-xs">
                  <div className="flex-1">
                    <p className="text-[#86868b] mb-0.5">From</p>
                    <p className="text-[#1d1d1f] font-medium">
                      {getLanguageLabel(preferredLanguage)}
                    </p>
                  </div>
                  <div className="text-[#86868b]">→</div>
                  <div className="flex-1">
                    <p className="text-[#86868b] mb-0.5">To</p>
                    <p className="text-[#1d1d1f] font-medium">
                      {getLanguageLabel(targetLanguage)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                    Target Language
                  </label>
                  <LanguageSelector
                    value={targetLanguage}
                    onChange={(value) => {
                      setTargetLanguage(value);
                      updateTranscriptionSettings({ targetLanguage: value });
                    }}
                    className="w-full"
                  />
                </div>

                <div className="bg-white border border-[#d2d2d7] rounded-lg p-2.5">
                  <p className="text-xs text-[#86868b]">
                    Uses {reasoningModel}. Requires API key.
                  </p>
                </div>
              </div>
            )}
          </section>

          <Button
            onClick={() => {
              const normalizedTranscriptionBase = (cloudTranscriptionBaseUrl || '').trim();
              setCloudTranscriptionBaseUrl(normalizedTranscriptionBase);

              updateTranscriptionSettings({
                useLocalWhisper,
                whisperModel,
                preferredLanguage,
                cloudTranscriptionBaseUrl: normalizedTranscriptionBase,
                enableTranslation,
                targetLanguage,
              });

              if (!useLocalWhisper && openaiApiKey.trim()) {
                updateApiKeys({ openaiApiKey });
              }

              const descriptionParts = [
                `Transcription mode: ${useLocalWhisper ? 'Local Whisper' : 'Cloud'}.`,
                `Language: ${preferredLanguage}.`,
              ];

              if (enableTranslation) {
                descriptionParts.push(`Translation enabled: ${preferredLanguage} → ${targetLanguage}.`);
              }

              if (!useLocalWhisper) {
                const baseLabel = normalizedTranscriptionBase || API_ENDPOINTS.TRANSCRIPTION_BASE;
                descriptionParts.push(`Endpoint: ${baseLabel}.`);
              }

              showAlertDialog({
                title: "Settings Saved",
                description: descriptionParts.join(' '),
              });
            }}
            className="w-full h-10"
          >
            Save Transcription Settings
          </Button>
        </div>
      );

      case "aiModels":
        return (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  AI Text Enhancement
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Configure how AI models clean up and format your transcriptions
                </p>
              </div>
            </section>

            <AIModelSelectorEnhanced
              useReasoningModel={useReasoningModel}
              setUseReasoningModel={(value) => {
                setUseReasoningModel(value);
                updateReasoningSettings({ useReasoningModel: value });
              }}
              setCloudReasoningBaseUrl={setCloudReasoningBaseUrl}
              cloudReasoningBaseUrl={cloudReasoningBaseUrl}
              reasoningModel={reasoningModel}
              setReasoningModel={setReasoningModel}
              localReasoningProvider={localReasoningProvider}
              setLocalReasoningProvider={setLocalReasoningProvider}
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKey}
              anthropicApiKey={anthropicApiKey}
              setAnthropicApiKey={setAnthropicApiKey}
              geminiApiKey={geminiApiKey}
              setGeminiApiKey={setGeminiApiKey}
              pasteFromClipboard={pasteFromClipboardWithFallback}
              showAlertDialog={showAlertDialog}
            />

            <Button onClick={saveReasoningSettings} className="w-full h-10">
              Save AI Model Settings
            </Button>
          </div>
        );

      case "agentConfig":
        return (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  Agent Configuration
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  Customize your AI assistant name and behavior
                </p>
              </div>
            </section>

            <section className="space-y-4 p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
              <h4 className="font-medium text-[#1d1d1f] mb-3">
                How to use agent names
              </h4>
              <ul className="text-sm text-[#1d1d1f] space-y-2">
                <li>
                  Say "Hey {agentName}, write a formal email" for specific instructions
                </li>
                <li>
                  Use "Hey {agentName}, format this as a list" for text enhancement
                </li>
                <li>
                  The agent recognizes when you're addressing it directly vs. dictating content
                </li>
                <li>
                  Makes conversations natural and helps distinguish commands from dictation
                </li>
              </ul>
            </section>

            <section className="space-y-4 p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg">
              <h4 className="font-medium text-[#1d1d1f]">Current Agent Name</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., Assistant, Jarvis, Alex..."
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="flex-1 text-center text-lg font-mono"
                />
                <Button
                  onClick={() => {
                    setAgentName(agentName.trim());
                    showAlertDialog({
                      title: "Agent Name Updated",
                      description: `Your agent is now named "${agentName.trim()}". You can address it by saying "Hey ${agentName.trim()}" followed by your instructions.`,
                    });
                  }}
                  disabled={!agentName.trim()}
                  className="h-10"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-[#86868b] mt-2">
                Choose a name that feels natural to say and remember
              </p>
            </section>

            <section className="bg-[#f5f5f7] p-4 border border-[#d2d2d7] rounded-lg">
              <h4 className="font-medium text-[#1d1d1f] mb-3">
                Example Usage
              </h4>
              <div className="text-sm text-[#1d1d1f] space-y-2">
                <p>
                  "Hey {agentName}, write an email to my team about the meeting"
                </p>
                <p>
                  "Hey {agentName}, make this more professional" (after dictating text)
                </p>
                <p>"Hey {agentName}, convert this to bullet points"</p>
                <p className="text-[#86868b]">
                  Regular dictation: "This is just normal text" (no agent name needed)
                </p>
              </div>
            </section>
          </div>
        );


      case "prompts":
        return (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="border-b border-[#d2d2d7] pb-3">
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  AI Prompt Management
                </h3>
                <p className="text-sm text-[#86868b] mt-1">
                  View and customize prompts that power AI text processing
                </p>
              </div>
            </section>

            <PromptStudio />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && hideConfirmDialog()}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

      <AlertDialog
        open={alertDialog.open}
        onOpenChange={(open) => !open && hideAlertDialog()}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />

      {renderSectionContent()}
    </>
  );
}
