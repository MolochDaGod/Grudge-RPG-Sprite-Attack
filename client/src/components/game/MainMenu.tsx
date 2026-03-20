import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import { UserMenu } from "@/components/UserMenu";
import { Swords, Book, Users, Play, Moon, Sun, Sparkles, Shield, Trophy, Bot, Wrench, UserPlus, TreeDeciduous, Database } from "lucide-react";
import { motion } from "framer-motion";

interface MainMenuProps {
  battlesWon: number;
  username?: string;
  tutorialCompleted?: boolean;
  heroCount?: number;
  onStartBattle: () => void;
  onViewRoster: () => void;
  onViewCodex: () => void;
  onViewChat?: () => void;
  onViewAdmin?: () => void;
  onViewCharacterSelect?: () => void;
  onViewSkillTrees?: () => void;
  onViewSpriteAssistant?: () => void;
  onStartGrudgeFighter?: () => void;
  onLogout?: () => void;
}

export function MainMenu({
  battlesWon,
  username,
  tutorialCompleted,
  heroCount,
  onStartBattle,
  onViewRoster,
  onViewCodex,
  onViewChat,
  onViewAdmin,
  onViewCharacterSelect,
  onViewSkillTrees,
  onViewSpriteAssistant,
  onStartGrudgeFighter,
  onLogout,
}: MainMenuProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-screen campfire background */}
      <div className="absolute inset-0">
        <img
          src="/landing-bg.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
        {/* Gold ambient glow from campfire area */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgba(212,175,55,0.08)_0%,transparent_50%)]" />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <UserMenu />
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleTheme}
          className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1 className="font-serif text-6xl md:text-8xl font-black tracking-wider gold-text text-shadow-gold drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            GRUDGES
          </h1>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-display text-2xl md:text-4xl tracking-[0.3em] uppercase mt-1"
            style={{ color: "hsl(0 70% 45%)" }}
          >
            ALPHA
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mx-auto mt-4 h-px w-48 bg-gradient-to-r from-transparent via-[hsl(43_85%_55%)] to-transparent"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm md:text-base text-[hsl(45_30%_75%)] font-body tracking-widest uppercase mt-3"
          >
            Settle the score. Forge your legacy.
          </motion.p>

          {battlesWon > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4"
            >
              <Badge className="bg-black/40 text-[hsl(43_85%_60%)] border border-[hsl(43_60%_30%)] text-sm px-4 py-1 backdrop-blur-sm">
                <Trophy className="w-4 h-4 mr-2" />
                {battlesWon} Battles Won
              </Badge>
            </motion.div>
          )}
        </motion.div>

        {/* Menu buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-md space-y-3"
        >
          {/* Primary CTA — gilded gold */}
          <button
            onClick={onStartBattle}
            className="gilded-button w-full h-14 text-lg flex items-center justify-center gap-2 group"
            data-testid="button-start-battle"
          >
            <Play className="w-5 h-5" />
            Enter the Fray
            <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {onViewCharacterSelect && (
            <button
              onClick={onViewCharacterSelect}
              className="dark-button w-full h-12 flex items-center justify-center gap-2"
              data-testid="button-create-character"
            >
              <UserPlus className="w-5 h-5" />
              Create Character
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onViewRoster}
              className="dark-button h-12 flex items-center justify-center gap-2 text-sm"
              data-testid="button-view-roster"
            >
              <Users className="w-4 h-4" />
              Roster
            </button>

            <button
              onClick={onViewCodex}
              className="dark-button h-12 flex items-center justify-center gap-2 text-sm"
              data-testid="button-view-codex"
            >
              <Book className="w-4 h-4" />
              Codex
            </button>
          </div>

          {onViewSkillTrees && (
            <button
              onClick={onViewSkillTrees}
              className="dark-button w-full h-12 flex items-center justify-center gap-2"
              style={{ borderColor: "hsl(142 60% 30%)" }}
              data-testid="button-view-skill-trees"
            >
              <TreeDeciduous className="w-5 h-5" style={{ color: "hsl(142 71% 45%)" }} />
              <span style={{ color: "hsl(142 71% 55%)" }}>Skill Trees</span>
            </button>
          )}

          {onStartGrudgeFighter && (
            <button
              onClick={onStartGrudgeFighter}
              className="gilded-button w-full h-12 flex items-center justify-center gap-2 text-sm"
              data-testid="button-start-grudge-fighter"
            >
              <Swords className="w-5 h-5" />
              Grudge Fighter (2D)
            </button>
          )}

          {onViewAdmin && (
            <button
              onClick={onViewAdmin}
              className="dark-button w-full h-10 flex items-center justify-center gap-2 text-xs opacity-70 hover:opacity-100 transition-opacity"
              data-testid="button-view-admin"
            >
              <Wrench className="w-4 h-4" />
              Admin: Sprite & Weapon Editor
            </button>
          )}

          {onViewSpriteAssistant && (
            <button
              onClick={onViewSpriteAssistant}
              className="dark-button w-full h-10 flex items-center justify-center gap-2 text-xs"
              style={{ borderColor: "hsl(220 60% 35%)" }}
              data-testid="button-view-sprite-assistant"
            >
              <Database className="w-4 h-4" style={{ color: "hsl(220 60% 55%)" }} />
              <span style={{ color: "hsl(220 60% 65%)" }}>Sprite API Assistant</span>
            </button>
          )}

          {onViewChat && (
            <button
              onClick={onViewChat}
              className="dark-button w-full h-11 flex items-center justify-center gap-2 group"
              style={{ borderColor: "hsl(160 50% 25%)" }}
              data-testid="button-view-chat"
            >
              <Bot className="w-5 h-5" style={{ color: "hsl(160 60% 50%)" }} />
              <span style={{ color: "hsl(160 60% 55%)" }}>AI Assistant</span>
              <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(160 60% 50%)" }} />
            </button>
          )}
        </motion.div>

        {/* Footer lore */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-xs font-body text-[hsl(45_20%_50%)] tracking-wide">
            Four factions. Endless grudges. Only the worthy survive.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <p className="text-[10px] text-white/20 font-body tracking-widest">
            GRUDGE STUDIO · ALPHA BUILD
          </p>
        </motion.div>
      </div>
    </div>
  );
}
