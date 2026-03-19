import { z } from 'zod';

export const TutorialStepSchema = z.enum([
  'login',
  'first_hero_creation',
  'first_battle_1v1',
  'second_hero_creation',
  'second_battle_2v1',
  'third_hero_creation',
  'third_battle_3v3',
  'tutorial_complete'
]);

export type TutorialStep = z.infer<typeof TutorialStepSchema>;

export const TUTORIAL_STEPS_ORDER: TutorialStep[] = [
  'login',
  'first_hero_creation',
  'first_battle_1v1',
  'second_hero_creation',
  'second_battle_2v1',
  'third_hero_creation',
  'third_battle_3v3',
  'tutorial_complete'
];

export const GameProgressSchema = z.object({
  tutorialStep: TutorialStepSchema,
  tutorialCompleted: z.boolean(),
  heroesCreated: z.number(),
  battlesWon: z.number(),
  battlesLost: z.number(),
  totalGold: z.number(),
  totalExperience: z.number(),
  missionsCompleted: z.number(),
  currentMissionId: z.string().nullable(),
});

export type GameProgress = z.infer<typeof GameProgressSchema>;

export function createDefaultProgress(): GameProgress {
  return {
    tutorialStep: 'login',
    tutorialCompleted: false,
    heroesCreated: 0,
    battlesWon: 0,
    battlesLost: 0,
    totalGold: 0,
    totalExperience: 0,
    missionsCompleted: 0,
    currentMissionId: null,
  };
}

export function getNextTutorialStep(current: TutorialStep): TutorialStep {
  const currentIndex = TUTORIAL_STEPS_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex >= TUTORIAL_STEPS_ORDER.length - 1) {
    return 'tutorial_complete';
  }
  return TUTORIAL_STEPS_ORDER[currentIndex + 1];
}

export function getTutorialBattleConfig(step: TutorialStep): {
  playerTeamSize: number;
  enemyTeamSize: number;
  enemyCanAttack: boolean;
  difficulty: number;
} | null {
  switch (step) {
    case 'first_battle_1v1':
      return {
        playerTeamSize: 1,
        enemyTeamSize: 1,
        enemyCanAttack: false,
        difficulty: 0
      };
    case 'second_battle_2v1':
      return {
        playerTeamSize: 2,
        enemyTeamSize: 1,
        enemyCanAttack: true,
        difficulty: 1
      };
    case 'third_battle_3v3':
      return {
        playerTeamSize: 3,
        enemyTeamSize: 3,
        enemyCanAttack: true,
        difficulty: 2
      };
    default:
      return null;
  }
}

export function shouldCreateHero(step: TutorialStep): boolean {
  return step === 'first_hero_creation' || 
         step === 'second_hero_creation' || 
         step === 'third_hero_creation';
}

export function shouldStartBattle(step: TutorialStep): boolean {
  return step === 'first_battle_1v1' || 
         step === 'second_battle_2v1' || 
         step === 'third_battle_3v3';
}

export function getTutorialMessage(step: TutorialStep): string {
  switch (step) {
    case 'login':
      return "Welcome to Tethical! Sign in to begin your journey.";
    case 'first_hero_creation':
      return "Create your first hero! Choose a race and class, then allocate your attribute points.";
    case 'first_battle_1v1':
      return "Time for your first battle! Face a training dummy that won't fight back.";
    case 'second_hero_creation':
      return "Excellent! Create your second hero to strengthen your team.";
    case 'second_battle_2v1':
      return "Now battle 2v1! This enemy will fight back, so be careful.";
    case 'third_hero_creation':
      return "Create your third hero to complete your starting team.";
    case 'third_battle_3v3':
      return "The final tutorial battle! Face a full enemy team.";
    case 'tutorial_complete':
      return "Tutorial complete! The Mission Board is now unlocked.";
    default:
      return "";
  }
}
