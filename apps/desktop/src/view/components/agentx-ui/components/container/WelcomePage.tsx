/**
 * WelcomePage - Initial welcome page for AgentX
 *
 * Displays when no conversation is selected:
 * - Logo
 * - Typewriter effect tagline
 * - Input box (creates new conversation on send)
 * - Preset question cards
 */

import * as React from "react";
import { Send, Hammer, Sparkles, Bot, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/agentx-ui/utils";
import logo from "../../../../../../assets/icons/PromptX-transparent.png";

export interface PresetQuestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  prompt: string;
}

export interface WelcomePageProps {
  /**
   * Callback when user sends a message
   */
  onSend?: (message: string) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Typewriter effect hook
 */
function useTypewriter(text: string, speed: number = 150, loop: boolean = true) {
  const [displayText, setDisplayText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          setIndex(index + 1);
        } else if (loop) {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 3000);
        }
      } else {
        if (index > 0) {
          setDisplayText(text.slice(0, index - 1));
          setIndex(index - 1);
        } else {
          setIsDeleting(false);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timer);
  }, [text, speed, loop, index, isDeleting]);

  return displayText;
}

/**
 * WelcomePage component
 */
export function WelcomePage({
  onSend,
  className,
}: WelcomePageProps): React.ReactElement {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = React.useState("");

  const tagline = t("agentxUI.welcome.tagline");
  const displayText = useTypewriter(tagline, 100, true);

  // Preset questions
  const presetQuestions: PresetQuestion[] = React.useMemo(() => [
    {
      id: "luban",
      icon: <Hammer className="w-4 h-4" />,
      title: t("agentxUI.welcome.presets.luban"),
      prompt: t("agentxUI.welcome.presets.lubanPrompt"),
    },
    {
      id: "nuwa",
      icon: <Sparkles className="w-4 h-4" />,
      title: t("agentxUI.welcome.presets.nuwa"),
      prompt: t("agentxUI.welcome.presets.nuwaPrompt"),
    },
    {
      id: "role",
      icon: <Bot className="w-4 h-4" />,
      title: t("agentxUI.welcome.presets.role"),
      prompt: t("agentxUI.welcome.presets.rolePrompt"),
    },
    {
      id: "tool",
      icon: <Wrench className="w-4 h-4" />,
      title: t("agentxUI.welcome.presets.tool"),
      prompt: t("agentxUI.welcome.presets.toolPrompt"),
    },
  ], [t]);

  const handleSend = React.useCallback(() => {
    if (inputValue.trim() && onSend) {
      onSend(inputValue.trim());
      setInputValue("");
    }
  }, [inputValue, onSend]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handlePresetClick = React.useCallback((prompt: string) => {
    if (onSend) {
      onSend(prompt);
    }
  }, [onSend]);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <img
          src={logo}
          alt="PromptX Logo"
          className="w-28 h-28 mb-6"
        />

        {/* Tagline with typewriter effect */}
        <div className="h-8 mb-8">
          <p className="text-xl font-bold text-muted-foreground">
            {displayText}
            <span className="animate-pulse">|</span>
          </p>
        </div>

        {/* Input box */}
        <div className="w-full max-w-3xl mb-8">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("agentxUI.welcome.inputPlaceholder")}
              className={cn(
                "w-full px-4 py-3 pr-12 rounded-xl",
                "bg-muted/50 border border-border",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "placeholder:text-muted-foreground/50",
                "transition-all duration-200"
              )}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={cn(
                "absolute right-2 p-2 rounded-lg",
                "text-muted-foreground hover:text-primary",
                "hover:bg-primary/10",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset question cards */}
        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-2 gap-3">
            {presetQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => handlePresetClick(question.prompt)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  "bg-muted/30 border border-border/50",
                  "hover:bg-muted/50 hover:border-border",
                  "text-left transition-all duration-200",
                  "group"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  "bg-primary/10 text-primary",
                  "group-hover:bg-primary/20",
                  "transition-colors duration-200"
                )}>
                  {question.icon}
                </div>
                <span className="text-sm text-foreground/80 group-hover:text-foreground">
                  {question.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
