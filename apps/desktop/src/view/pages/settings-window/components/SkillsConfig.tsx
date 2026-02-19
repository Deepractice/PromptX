/**
 * SkillsConfig - Skills 管理配置组件
 *
 * 全局 Skills 管理，启用/禁用 Skills
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw, Wrench } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface Skill {
  name: string;
  description: string;
  version?: string;
}

export function SkillsConfig() {
  const { t } = useTranslation();
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [enabledSkills, setEnabledSkills] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // 加载 Skills 列表
  const loadSkills = React.useCallback(async () => {
    setLoading(true);
    try {
      const [available, enabled] = await Promise.all([
        window.electronAPI?.agentx?.getAvailableSkills?.() || [],
        window.electronAPI?.agentx?.getEnabledSkills?.() || [],
      ]);
      setSkills(available);
      setEnabledSkills(enabled);
    } catch (error) {
      console.error("Failed to load skills:", error);
      toast.error(t("settings.agentx.skills.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // 切换 Skill 启用状态
  const toggleSkill = (skillName: string) => {
    setEnabledSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((name) => name !== skillName)
        : [...prev, skillName]
    );
  };

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await window.electronAPI?.agentx?.updateEnabledSkills?.(enabledSkills);
      if (result?.success) {
        toast.success(t("settings.agentx.skills.saveSuccess"));
      } else {
        toast.error(result?.error || t("settings.agentx.skills.saveError"));
      }
    } catch (error) {
      console.error("Failed to save skills:", error);
      toast.error(t("settings.agentx.skills.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {t("settings.agentx.skills.title")}
        </CardTitle>
        <CardDescription>{t("settings.agentx.skills.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {skills.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {t("settings.agentx.skills.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.name}</span>
                    {skill.version && (
                      <span className="text-xs text-muted-foreground">v{skill.version}</span>
                    )}
                  </div>
                  {skill.description && (
                    <p className="text-sm text-muted-foreground truncate">{skill.description}</p>
                  )}
                </div>
                <Switch
                  checked={enabledSkills.includes(skill.name)}
                  onCheckedChange={() => toggleSkill(skill.name)}
                  className="ml-4"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={loadSkills} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {t("settings.agentx.skills.refresh")}
          </Button>
          <Button onClick={handleSave} disabled={saving || skills.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SkillsConfig;