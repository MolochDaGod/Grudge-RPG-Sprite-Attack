import { MainMenu } from "@/components/game/MainMenu";

interface HomeProps {
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

export default function Home({ 
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
}: HomeProps) {
  return (
    <MainMenu
      battlesWon={battlesWon}
      username={username}
      tutorialCompleted={tutorialCompleted}
      heroCount={heroCount}
      onStartBattle={onStartBattle}
      onViewRoster={onViewRoster}
      onViewCodex={onViewCodex}
      onViewChat={onViewChat}
      onViewAdmin={onViewAdmin}
      onViewCharacterSelect={onViewCharacterSelect}
      onViewSkillTrees={onViewSkillTrees}
      onViewSpriteAssistant={onViewSpriteAssistant}
  onStartGrudgeFighter = { onStartGrudgeFighter }
      onLogout={onLogout}
    />
  );
}
