"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X, User, Shield, Settings2, Moon, Globe, Search, Mail, Volume2, Trash2, LogOut, Loader2, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSettings {
  theme: "light" | "dark" | "system";
  language: "en" | "es" | "fr" | "de";
  defaultModel: "gemini" | "deepseek" | "llama";
  webSearchEnabled: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
  saveHistory: boolean;
  analytics: boolean;
}

const selectClass =
  "px-3 py-1.5 rounded-[10px] bg-raised border border-[var(--border-strong)] text-[13px] text-ink focus:outline-none focus:border-[var(--accent)] transition-colors duration-150";

function ToggleSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`nx-press relative w-10 h-[22px] rounded-full transition-colors duration-150 ${
        on ? "bg-accent" : "bg-overlay border border-[var(--border-strong)]"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full transition-transform duration-150 ${
          on ? "translate-x-[18px] bg-accent-ink" : "bg-ink-faint"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      />
    </button>
  );
}

function SettingRow({
  icon,
  title,
  description,
  control,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-ink-faint">{icon}</span>}
          <span className="text-[13px] text-ink">{title}</span>
        </div>
        {description && <p className="text-[11.5px] text-ink-faint mt-0.5 ml-6">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function SettingsModal({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState("profile");
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const [displayName, setDisplayName] = useState("");

  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    language: "en",
    defaultModel: "gemini",
    webSearchEnabled: true,
    emailNotifications: true,
    browserNotifications: false,
    soundEnabled: true,
    saveHistory: true,
    analytics: true,
  });

  useEffect(() => {
    if (open && session?.user) {
      setDisplayName(session.user.name || "");
      loadSettings();
    }
  }, [open, session]);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      let profileUpdated = false;

      if (displayName !== session?.user?.name) {
        const profileResponse = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: displayName }),
        });

        if (profileResponse.ok) {
          profileUpdated = true;
        } else {
          const error = await profileResponse.json();
          alert(`Failed to update profile: ${error.error}`);
          setIsSaving(false);
          return;
        }
      }

      const settingsResponse = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (settingsResponse.ok) {
        if (profileUpdated) {
          window.location.reload();
        } else {
          onOpenChange(false);
        }
      } else {
        const error = await settingsResponse.json();
        alert(`Failed to save settings: ${error.error}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      router.push("/login");
      onOpenChange(false);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account? This cannot be undone and removes all your data.")) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/profile", { method: "DELETE" });

      if (response.ok) {
        await signOut({ redirect: false });
        router.push("/login");
        onOpenChange(false);
      } else {
        const error = await response.json();
        alert(`Failed to delete account: ${error.error}`);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch("/api/user/clear-history", { method: "DELETE" });

      if (response.ok) {
        router.refresh();
        onOpenChange(false);
      } else {
        const error = await response.json();
        alert(`Failed to clear history: ${error.error}`);
      }
    } catch (error) {
      console.error("Clear history error:", error);
      alert("Failed to clear history. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={15} /> },
    { id: "preferences", label: "Preferences", icon: <Settings2 size={15} /> },
    { id: "notifications", label: "Notifications", icon: <Mail size={15} /> },
    { id: "privacy", label: "Privacy & data", icon: <Shield size={15} /> },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-up"
          style={{ zIndex: "var(--z-backdrop)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-[var(--border-strong)] rounded-2xl w-[92vw] max-w-3xl h-[620px] max-h-[85dvh] shadow-2xl shadow-black/50 focus:outline-none flex overflow-hidden"
          style={{ zIndex: "var(--z-modal)" }}
        >
          {/* Nav rail */}
          <div className="w-52 bg-void/40 border-r border-[var(--border-subtle)] p-3.5 flex-col hidden sm:flex">
            <h2 className="text-[13px] font-semibold text-ink mb-4 px-2.5">Settings</h2>

            <div className="space-y-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[10px] text-[13px] font-medium transition-colors duration-150 ${
                    activeTab === tab.id
                      ? "bg-raised text-ink"
                      : "text-ink-faint hover:text-ink-secondary hover:bg-raised/50"
                  }`}
                >
                  <span className={activeTab === tab.id ? "text-accent" : ""}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex justify-between items-center px-5 h-14 border-b border-[var(--border-subtle)] shrink-0">
              <Dialog.Title className="text-[14px] font-semibold text-ink">
                {tabs.find((t) => t.id === activeTab)?.label}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="nx-press p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors duration-150"
                  aria-label="Close settings"
                >
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            {/* Mobile tab strip */}
            <div className="flex sm:hidden gap-1 px-4 pt-3 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors duration-150 ${
                    activeTab === tab.id ? "bg-raised text-ink" : "text-ink-faint"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar min-h-0">
              {isLoadingSettings && activeTab !== "profile" ? (
                <div className="space-y-3" aria-hidden="true">
                  <div className="nx-skeleton h-10 w-full" />
                  <div className="nx-skeleton h-10 w-4/5" />
                  <div className="nx-skeleton h-10 w-full" />
                </div>
              ) : (
                <>
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        {session?.user?.image ? (
                          <img
                            src={session.user.image}
                            alt=""
                            className="w-14 h-14 rounded-full border border-[var(--border-strong)]"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-raised border border-[var(--border-strong)] flex items-center justify-center text-lg font-bold text-accent">
                            {getUserInitials()}
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-medium text-ink">{session?.user?.name || "User"}</p>
                          <p className="text-[12px] text-ink-faint">{session?.user?.email}</p>
                        </div>
                      </div>

                      <div className="space-y-4 max-w-sm">
                        <div>
                          <label htmlFor="display-name" className="block text-[12px] font-medium text-ink-secondary mb-1.5">
                            Display name
                          </label>
                          <input
                            id="display-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 rounded-[10px] bg-raised border border-[var(--border-strong)] text-[13px] text-ink focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
                          />
                        </div>
                        <div>
                          <label htmlFor="email-field" className="block text-[12px] font-medium text-ink-secondary mb-1.5">
                            Email address
                          </label>
                          <input
                            id="email-field"
                            type="email"
                            value={session?.user?.email || ""}
                            className="w-full px-3 py-2 rounded-[10px] bg-void/50 border border-[var(--border-subtle)] text-[13px] text-ink-faint cursor-not-allowed"
                            disabled
                          />
                          <p className="text-[11px] text-ink-faint mt-1">Email cannot be changed</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="nx-press flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-medium text-danger hover:bg-[oklch(0.68_0.19_20_/_0.1)] transition-colors duration-150 disabled:opacity-50"
                        >
                          {isLoggingOut ? <Loader2 className="animate-spin" size={15} /> : <LogOut size={15} />}
                          {isLoggingOut ? "Logging out…" : "Log out"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "preferences" && (
                    <div className="space-y-7">
                      <div>
                        <h3 className="text-[12px] font-semibold text-ink-secondary mb-3">Appearance</h3>
                        <div className="space-y-3.5">
                          <SettingRow
                            icon={<Moon size={15} />}
                            title="Theme"
                            control={
                              <select
                                value={settings.theme}
                                onChange={(e) => updateSetting("theme", e.target.value as any)}
                                className={selectClass}
                              >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                                <option value="system">System</option>
                              </select>
                            }
                          />
                          <SettingRow
                            icon={<Globe size={15} />}
                            title="Language"
                            control={
                              <select
                                value={settings.language}
                                onChange={(e) => updateSetting("language", e.target.value as any)}
                                className={selectClass}
                              >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                              </select>
                            }
                          />
                        </div>
                      </div>

                      <div className="border-t border-[var(--border-subtle)] pt-6">
                        <h3 className="text-[12px] font-semibold text-ink-secondary mb-3">Chat</h3>
                        <div className="space-y-3.5">
                          <SettingRow
                            icon={<Bot size={15} />}
                            title="Default model"
                            description="Used for new chats"
                            control={
                              <select
                                value={settings.defaultModel}
                                onChange={(e) => updateSetting("defaultModel", e.target.value as any)}
                                className={selectClass}
                              >
                                <option value="gemini">Gemini Pro</option>
                                <option value="deepseek">DeepSeek V3</option>
                                <option value="llama">Llama 3</option>
                              </select>
                            }
                          />
                          <SettingRow
                            icon={<Search size={15} />}
                            title="Web search"
                            description="Search the web automatically when helpful"
                            control={
                              <ToggleSwitch
                                on={settings.webSearchEnabled}
                                onToggle={() => updateSetting("webSearchEnabled", !settings.webSearchEnabled)}
                                label="Web search"
                              />
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "notifications" && (
                    <div className="space-y-3.5">
                      <SettingRow
                        icon={<Mail size={15} />}
                        title="Email updates"
                        description="Product news and account activity"
                        control={
                          <ToggleSwitch
                            on={settings.emailNotifications}
                            onToggle={() => updateSetting("emailNotifications", !settings.emailNotifications)}
                            label="Email updates"
                          />
                        }
                      />
                      <SettingRow
                        icon={<Mail size={15} />}
                        title="Browser notifications"
                        description="Alerts when responses finish in background tabs"
                        control={
                          <ToggleSwitch
                            on={settings.browserNotifications}
                            onToggle={() => updateSetting("browserNotifications", !settings.browserNotifications)}
                            label="Browser notifications"
                          />
                        }
                      />
                      <SettingRow
                        icon={<Volume2 size={15} />}
                        title="Sound effects"
                        description="Play a sound for notifications"
                        control={
                          <ToggleSwitch
                            on={settings.soundEnabled}
                            onToggle={() => updateSetting("soundEnabled", !settings.soundEnabled)}
                            label="Sound effects"
                          />
                        }
                      />
                    </div>
                  )}

                  {activeTab === "privacy" && (
                    <div className="space-y-7">
                      <div className="space-y-3.5">
                        <SettingRow
                          title="Save chat history"
                          description="Store conversations for later access"
                          control={
                            <ToggleSwitch
                              on={settings.saveHistory}
                              onToggle={() => updateSetting("saveHistory", !settings.saveHistory)}
                              label="Save chat history"
                            />
                          }
                        />
                        <SettingRow
                          title="Usage analytics"
                          description="Help improve the app with anonymous usage data"
                          control={
                            <ToggleSwitch
                              on={settings.analytics}
                              onToggle={() => updateSetting("analytics", !settings.analytics)}
                              label="Usage analytics"
                            />
                          }
                        />
                      </div>

                      <div className="border-t border-[var(--border-subtle)] pt-6">
                        <button
                          onClick={handleClearHistory}
                          disabled={isClearing}
                          className="nx-press flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-medium text-warning hover:bg-[oklch(0.8_0.13_85_/_0.1)] transition-colors duration-150 disabled:opacity-50"
                        >
                          {isClearing ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                          {isClearing ? "Clearing…" : "Clear all chat history"}
                        </button>
                      </div>

                      <div className="border-t border-[var(--border-subtle)] pt-6">
                        <div className="rounded-xl border border-[oklch(0.68_0.19_20_/_0.35)] bg-[oklch(0.68_0.19_20_/_0.06)] p-4">
                          <h3 className="text-[13px] font-semibold text-danger mb-1.5">Danger zone</h3>
                          <p className="text-[12px] text-ink-secondary mb-3 leading-relaxed">
                            Deleting your account removes all conversations, documents, and settings. There is no undo.
                          </p>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="nx-press flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-danger hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                            {isDeleting ? "Deleting…" : "Delete account"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[var(--border-subtle)] flex justify-end gap-2 shrink-0">
              <Dialog.Close asChild>
                <button className="nx-press px-4 py-2 rounded-[10px] text-[13px] font-medium text-ink-secondary hover:text-ink hover:bg-raised transition-colors duration-150">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="nx-press px-4 py-2 rounded-[10px] bg-accent text-accent-ink text-[13px] font-semibold hover:bg-accent-strong transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="animate-spin" size={13} />}
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
