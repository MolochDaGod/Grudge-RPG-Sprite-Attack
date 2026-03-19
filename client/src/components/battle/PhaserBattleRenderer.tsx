import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import type { BattleState, BattleUnit } from '@/lib/battleEngine';
import { getHeroById, getSpriteUrl, type HeroSprite } from '@shared/spriteUUIDs';

interface PhaserBattleRendererProps {
  battleState: BattleState;
  onAnimationComplete?: () => void;
  onUnitClick?: (unitId: string) => void;
}

interface UnitSprite {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Graphics;
  atbBar: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  shadow: Phaser.GameObjects.Ellipse;
  heroSprite?: HeroSprite;
  currentAnimation?: string;
  lastHp: number;
  lastAtb: number;
  isBobbing: boolean;
}

const DEPTH = {
  BG: 0,
  GROUND: 2,
  SHADOW: 4,
  UNIT: 6,
  GLOW: 5,
  EFFECT: 10,
  PROJECTILE: 12,
  UI: 14,
  DAMAGE: 16,
};

class BattleScene extends Phaser.Scene {
  private unitSprites: Map<string, UnitSprite> = new Map();
  private effectsLayer: Phaser.GameObjects.Container | null = null;
  private battleState: BattleState | null = null;
  private isAnimating: boolean = false;
  private onUnitClickCallback: ((unitId: string) => void) | null = null;
  private loadedTextures: Set<string> = new Set();
  private activeGlows: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private groundY = 370;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    this.createBackground();
    this.effectsLayer = this.add.container(0, 0).setDepth(DEPTH.EFFECT);
  }

  private createBackground() {
    const W = 900;
    const H = 500;

    const bg = this.add.graphics().setDepth(DEPTH.BG);
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0f1632, 0x0f1632, 1);
    bg.fillRect(0, 0, W, H);

    bg.lineStyle(1, 0x1e2456, 0.25);
    for (let x = 0; x <= W; x += 60) bg.lineBetween(x, 0, x, this.groundY);
    for (let y = 0; y <= this.groundY; y += 40) bg.lineBetween(0, y, W, y);

    const moonGlow = this.add.graphics().setDepth(DEPTH.BG + 1);
    moonGlow.fillStyle(0xffffff, 0.04);
    moonGlow.fillCircle(700, 60, 120);
    moonGlow.fillStyle(0xffffff, 0.08);
    moonGlow.fillCircle(700, 60, 60);
    moonGlow.fillStyle(0xffffff, 0.18);
    moonGlow.fillCircle(700, 60, 30);

    for (let i = 0; i < 40; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(20, 880),
        Phaser.Math.Between(10, this.groundY - 60),
        Phaser.Math.FloatBetween(0.5, 1.5),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.9)
      ).setDepth(DEPTH.BG + 1);

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.05, 0.3),
        duration: Phaser.Math.Between(1200, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    const ground = this.add.graphics().setDepth(DEPTH.GROUND);
    ground.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0d0d1a, 0x0d0d1a, 1);
    ground.fillRect(0, this.groundY, W, H - this.groundY);

    ground.lineStyle(2, 0x4466aa, 0.5);
    ground.lineBetween(0, this.groundY, W, this.groundY);

    ground.lineStyle(1, 0x2233aa, 0.15);
    for (let x = 0; x < W; x += 30) {
      ground.lineBetween(x, this.groundY, x, H);
    }
  }

  setOnUnitClick(callback: (unitId: string) => void) {
    this.onUnitClickCallback = callback;
  }

  updateBattleState(state: BattleState) {
    this.battleState = state;

    const allUnits = [...state.playerUnits, ...state.enemyUnits];

    allUnits.forEach(unit => {
      if (!this.unitSprites.has(unit.id)) {
        this.createUnitSprite(unit);
      } else {
        this.updateUnitSprite(unit, state.activeUnitId === unit.id);
      }
    });

    this.unitSprites.forEach((_, id) => {
      if (!allUnits.find(u => u.id === id)) {
        this.removeUnitSprite(id);
      }
    });

    this.updateActiveGlow(state.activeUnitId);
  }

  private async createUnitSprite(unit: BattleUnit) {
    const container = this.add.container(unit.position.x, unit.position.y).setDepth(DEPTH.UNIT);
    container.setSize(80, 120);
    container.setInteractive();

    container.on('pointerover', () => {
      if (this.isAnimating) return;
      this.tweens.killTweensOf(container, 'scaleX,scaleY');
      this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 120, ease: 'Power2' });
    });

    container.on('pointerout', () => {
      this.tweens.killTweensOf(container, 'scaleX,scaleY');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
    });

    container.on('pointerdown', () => {
      if (this.onUnitClickCallback && !this.isAnimating) {
        this.onUnitClickCallback(unit.id);
      }
    });

    const shadow = this.add.ellipse(0, 58, 55, 14, 0x000000, 0.35).setDepth(DEPTH.SHADOW);
    this.add.existing(shadow);

    const heroId = `${unit.race}-${unit.heroClass}`;
    const heroSprite = getHeroById(heroId);
    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

    if (heroSprite) {
      sprite = await this.loadUnitSprite(unit, heroSprite, 'idle');
    } else {
      sprite = this.createPlaceholderSprite(unit);
    }

    if (unit.isEnemy && sprite instanceof Phaser.GameObjects.Sprite) {
      sprite.setFlipX(true);
    }
    container.add(sprite);

    const nameText = this.add.text(0, -68, unit.name, {
      fontSize: '11px',
      color: '#e8e8ff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(nameText);

    const lvBadge = this.add.graphics();
    lvBadge.fillStyle(0x111133, 0.9);
    lvBadge.fillRoundedRect(-14, -84, 28, 14, 3);
    lvBadge.lineStyle(1, 0x5566bb, 1);
    lvBadge.strokeRoundedRect(-14, -84, 28, 14, 3);
    container.add(lvBadge);

    const lvText = this.add.text(0, -77, `Lv${unit.level}`, {
      fontSize: '9px',
      color: '#99aaff',
    }).setOrigin(0.5);
    container.add(lvText);

    const hpBar = this.add.graphics();
    const atbBar = this.add.graphics();
    container.add(hpBar);
    container.add(atbBar);

    this.unitSprites.set(unit.id, {
      container,
      sprite,
      hpBar,
      atbBar,
      nameText,
      shadow,
      heroSprite: heroSprite || undefined,
      currentAnimation: 'idle',
      lastHp: unit.stats.hp,
      lastAtb: unit.atbGauge,
      isBobbing: false,
    });

    this.drawHpBar(hpBar, unit);
    this.drawAtbBar(atbBar, unit);

    container.setAlpha(0).setScale(0.5);
    this.tweens.add({ targets: container, alpha: 1, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });
  }

  private async loadUnitSprite(
    unit: BattleUnit,
    heroSprite: HeroSprite,
    animKey: string
  ): Promise<Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle> {
    const heroId = heroSprite.id;
    const textureKey = `${heroId}-${animKey}`;
    const spriteUrl = getSpriteUrl(heroSprite, animKey);
    if (!spriteUrl) return this.createPlaceholderSprite(unit);

    const publicUrl = spriteUrl.replace('dist/sprites/', '/sprites/');

    if (!this.textures.exists(textureKey)) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.load.spritesheet(textureKey, publicUrl, {
            frameWidth: heroSprite.spriteSize,
            frameHeight: heroSprite.spriteSize,
          });
          this.load.once('complete', resolve);
          this.load.once('loaderror', reject);
          this.load.start();
        });
        this.loadedTextures.add(textureKey);
      } catch {
        return this.createPlaceholderSprite(unit);
      }
    }

    const anim = heroSprite.animations[animKey];
    const animName = `${textureKey}-anim`;
    if (anim && !this.anims.exists(animName)) {
      this.anims.create({
        key: animName,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: (anim.frames || 6) - 1 }),
        frameRate: anim.fps || 8,
        repeat: anim.loop ? -1 : 0,
      });
    }

    const sprite = this.add.sprite(0, 0, textureKey, 0).setScale(2.0);
    if (anim) sprite.play(animName);
    return sprite;
  }

  private createPlaceholderSprite(unit: BattleUnit): Phaser.GameObjects.Rectangle {
    const color = unit.isEnemy ? 0xcc3333 : 0x3388cc;
    const rect = this.add.rectangle(0, 0, 52, 64, color, 1);
    rect.setStrokeStyle(2, 0xffffff, 0.5);
    return rect;
  }

  private updateUnitSprite(unit: BattleUnit, isActive: boolean) {
    const us = this.unitSprites.get(unit.id);
    if (!us) return;

    const { container, hpBar, atbBar } = us;
    const isDead = unit.stats.hp <= 0;

    container.setAlpha(isDead ? 0.3 : 1);

    if (!this.isAnimating) {
      const dx = Math.abs(container.x - unit.position.x);
      const dy = Math.abs(container.y - unit.position.y);
      if (dx > 0.5 || dy > 0.5) {
        this.tweens.killTweensOf(container, 'x,y');
        this.tweens.add({
          targets: container,
          x: unit.position.x,
          y: unit.position.y,
          duration: 180,
          ease: 'Power2',
        });
      }
    }

    if (us.lastHp !== unit.stats.hp) {
      this.drawHpBar(hpBar, unit);
      us.lastHp = unit.stats.hp;
    }

    const atbChanged = Math.abs(us.lastAtb - unit.atbGauge) > 0.005;
    if (atbChanged) {
      this.drawAtbBar(atbBar, unit);
      us.lastAtb = unit.atbGauge;
    }

    if (isActive && unit.atbGauge >= 1 && !isDead && !us.isBobbing) {
      us.isBobbing = true;
      this.tweens.add({
        targets: container,
        y: unit.position.y - 6,
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if ((!isActive || isDead) && us.isBobbing) {
      us.isBobbing = false;
      this.tweens.killTweensOf(container, 'y');
      container.y = unit.position.y;
    }
  }

  private updateActiveGlow(activeUnitId: string | null) {
    this.activeGlows.forEach((glow, id) => {
      if (id !== activeUnitId) {
        glow.destroy();
        this.activeGlows.delete(id);
      }
    });

    if (!activeUnitId) return;
    if (this.activeGlows.has(activeUnitId)) return;

    const us = this.unitSprites.get(activeUnitId);
    if (!us) return;

    const unit = this.battleState
      ? [...this.battleState.playerUnits, ...this.battleState.enemyUnits].find(u => u.id === activeUnitId)
      : null;

    const glowColor = unit?.isEnemy ? 0xff6644 : 0x44aaff;

    const glow = this.add.graphics().setDepth(DEPTH.GLOW);
    glow.fillStyle(glowColor, 0.18);
    glow.fillCircle(us.container.x, us.container.y, 52);
    glow.lineStyle(1.5, glowColor, 0.5);
    glow.strokeCircle(us.container.x, us.container.y, 52);
    this.activeGlows.set(activeUnitId, glow);

    this.tweens.add({
      targets: glow,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawHpBar(hpBar: Phaser.GameObjects.Graphics, unit: BattleUnit) {
    hpBar.clear();
    const W = 54, H = 6, y = 64;
    const pct = Math.max(0, unit.stats.hp / unit.stats.maxHp);
    const color = pct > 0.6 ? 0x44ee44 : pct > 0.3 ? 0xeeee22 : 0xee4444;

    hpBar.fillStyle(0x111111, 1);
    hpBar.fillRoundedRect(-W / 2 - 1, y - 1, W + 2, H + 2, 2);
    hpBar.fillStyle(0x333333, 1);
    hpBar.fillRoundedRect(-W / 2, y, W, H, 2);
    if (pct > 0) {
      hpBar.fillStyle(color, 1);
      hpBar.fillRoundedRect(-W / 2, y, W * pct, H, 2);
    }
  }

  private drawAtbBar(atbBar: Phaser.GameObjects.Graphics, unit: BattleUnit) {
    atbBar.clear();
    const W = 54, H = 4, y = 72;
    const pct = Math.min(1, unit.atbGauge);
    const color = pct >= 1 ? 0xffee44 : 0x4488ff;

    atbBar.fillStyle(0x222222, 1);
    atbBar.fillRoundedRect(-W / 2, y, W, H, 1);
    if (pct > 0) {
      atbBar.fillStyle(color, 1);
      atbBar.fillRoundedRect(-W / 2, y, W * pct, H, 1);
    }
  }

  private removeUnitSprite(id: string) {
    const us = this.unitSprites.get(id);
    if (us) {
      this.tweens.killTweensOf(us.container);
      us.shadow.destroy();
      us.container.destroy();
      this.unitSprites.delete(id);
    }
    const glow = this.activeGlows.get(id);
    if (glow) { glow.destroy(); this.activeGlows.delete(id); }
  }

  async switchAnimation(unitId: string, animKey: string): Promise<void> {
    const us = this.unitSprites.get(unitId);
    if (!us?.heroSprite) return;
    if (!(us.sprite instanceof Phaser.GameObjects.Sprite)) return;
    if (us.currentAnimation === animKey) return;

    const heroSprite = us.heroSprite;
    const heroId = heroSprite.id;
    const textureKey = `${heroId}-${animKey}`;
    const spriteUrl = getSpriteUrl(heroSprite, animKey);
    if (!spriteUrl) return;

    const publicUrl = spriteUrl.replace('dist/sprites/', '/sprites/');

    if (!this.textures.exists(textureKey)) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.load.spritesheet(textureKey, publicUrl, {
            frameWidth: heroSprite.spriteSize,
            frameHeight: heroSprite.spriteSize,
          });
          this.load.once('complete', resolve);
          this.load.once('loaderror', reject);
          this.load.start();
        });
      } catch { return; }
    }

    const anim = heroSprite.animations[animKey];
    const animName = `${textureKey}-anim`;
    if (anim && !this.anims.exists(animName)) {
      this.anims.create({
        key: animName,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: (anim.frames || 4) - 1 }),
        frameRate: anim.fps || 8,
        repeat: anim.loop ? -1 : 0,
      });
    }

    us.sprite.setTexture(textureKey, 0);
    if (this.anims.exists(animName)) us.sprite.play(animName);
    us.currentAnimation = animKey;
  }

  async playMeleeAttack(actorId: string, targetId: string, damage: number, isCrit: boolean): Promise<void> {
    const actorUs = this.unitSprites.get(actorId);
    const targetUs = this.unitSprites.get(targetId);
    if (!actorUs || !targetUs) return;

    this.isAnimating = true;

    const origX = actorUs.container.x;
    const origY = actorUs.container.y;
    const isEnemy = this.battleState?.enemyUnits.find(u => u.id === actorId);
    const chargeX = isEnemy ? targetUs.container.x + 70 : targetUs.container.x - 70;

    this.tweens.killTweensOf(actorUs.container);
    await this.tweenPromise(actorUs.container, { x: chargeX, y: targetUs.container.y, duration: 220, ease: 'Power3.easeIn' });

    const attackAnim = Math.random() > 0.5 ? 'attack01' : 'attack02';
    await this.switchAnimation(actorId, attackAnim);
    await this.shake(actorUs.container, 5, 80);

    this.showImpact(targetUs.container.x, targetUs.container.y, 0xff4444);
    await this.switchAnimation(targetId, 'hurt');
    await this.shake(targetUs.container, 14, 180);
    this.showDamageNumber(targetUs.container.x, targetUs.container.y - 50, damage, isCrit, false);

    await this.tweenPromise(actorUs.container, { x: origX, y: origY, duration: 220, ease: 'Power2.easeOut' });

    await this.switchAnimation(actorId, 'idle');
    await this.switchAnimation(targetId, 'idle');

    this.isAnimating = false;
  }

  async playRangedAttack(actorId: string, targetId: string, damage: number, isCrit: boolean, color: number = 0x44aaff): Promise<void> {
    const actorUs = this.unitSprites.get(actorId);
    const targetUs = this.unitSprites.get(targetId);
    if (!actorUs || !targetUs) return;

    this.isAnimating = true;

    const attackAnim = Math.random() > 0.5 ? 'attack01' : 'attack02';
    await this.switchAnimation(actorId, attackAnim);
    await this.shake(actorUs.container, 3, 80);

    const startX = actorUs.container.x;
    const startY = actorUs.container.y;
    const endX = targetUs.container.x;
    const endY = targetUs.container.y;
    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - 80;

    const projectile = this.add.circle(startX, startY, 8, color).setDepth(DEPTH.PROJECTILE);
    projectile.setStrokeStyle(2, 0xffffff, 0.8);

    await new Promise<void>(resolve => {
      this.tweens.addCounter({
        from: 0, to: 1, duration: 300, ease: 'Sine.easeIn',
        onUpdate: tween => {
          const t = tween.getValue() as number;
          const x = (1 - t) ** 2 * startX + 2 * (1 - t) * t * ctrlX + t ** 2 * endX;
          const y = (1 - t) ** 2 * startY + 2 * (1 - t) * t * ctrlY + t ** 2 * endY;
          const trail = this.add.circle(projectile.x, projectile.y, 4, color, 0.5).setDepth(DEPTH.PROJECTILE);
          this.tweens.add({ targets: trail, alpha: 0, scale: 0, duration: 180, onComplete: () => trail.destroy() });
          projectile.setPosition(x, y);
        },
        onComplete: () => resolve(),
      });
    });

    projectile.destroy();

    this.showImpact(targetUs.container.x, targetUs.container.y, color);
    await this.switchAnimation(targetId, 'hurt');
    await this.shake(targetUs.container, 10, 160);
    this.showDamageNumber(targetUs.container.x, targetUs.container.y - 50, damage, isCrit, false);

    await this.switchAnimation(actorId, 'idle');
    await this.switchAnimation(targetId, 'idle');

    this.isAnimating = false;
  }

  async playMagicAttack(actorId: string, targetId: string, damage: number, isCrit: boolean): Promise<void> {
    const actorUs = this.unitSprites.get(actorId);
    const targetUs = this.unitSprites.get(targetId);
    if (!actorUs || !targetUs) return;

    this.isAnimating = true;

    await this.switchAnimation(actorId, 'attack01');

    const color = 0xaa44ff;
    for (let i = 0; i < 10; i++) {
      const delay = i * 60;
      const angle = (i / 10) * Math.PI * 2;
      const r = 40;
      const ring = this.add.circle(
        actorUs.container.x + Math.cos(angle) * r,
        actorUs.container.y + Math.sin(angle) * r,
        5, color, 0.9
      ).setDepth(DEPTH.EFFECT);

      this.tweens.add({
        targets: ring, delay,
        x: targetUs.container.x, y: targetUs.container.y,
        alpha: 0, scale: 0,
        duration: 500, ease: 'Power2.easeIn',
        onComplete: () => ring.destroy(),
      });
    }

    await this.delay(700);
    this.showImpact(targetUs.container.x, targetUs.container.y, color);
    await this.switchAnimation(targetId, 'hurt');
    await this.shake(targetUs.container, 10, 180);
    this.showDamageNumber(targetUs.container.x, targetUs.container.y - 50, damage, isCrit, false);

    await this.switchAnimation(actorId, 'idle');
    await this.switchAnimation(targetId, 'idle');

    this.isAnimating = false;
  }

  async playHealEffect(targetId: string, amount: number): Promise<void> {
    const targetUs = this.unitSprites.get(targetId);
    if (!targetUs) return;

    this.isAnimating = true;

    const x = targetUs.container.x;
    const y = targetUs.container.y;

    for (let i = 0; i < 14; i++) {
      const p = this.add.circle(
        x + Phaser.Math.Between(-28, 28), y + 50,
        Phaser.Math.Between(3, 6), 0x44ff88
      ).setDepth(DEPTH.EFFECT);

      this.tweens.add({
        targets: p,
        y: y - 80, alpha: 0,
        duration: Phaser.Math.Between(700, 1100),
        delay: i * 45,
        ease: 'Power1',
        onComplete: () => p.destroy(),
      });
    }

    this.tweens.add({ targets: targetUs.container, scaleX: 1.1, scaleY: 1.1, duration: 200, yoyo: true, ease: 'Power2' });
    this.showDamageNumber(x, y - 50, amount, false, true);

    await this.delay(500);
    this.isAnimating = false;
  }

  private showImpact(x: number, y: number, color: number = 0xff4444) {
    const flash = this.add.circle(x, y, 36, 0xffffff, 0.85).setDepth(DEPTH.EFFECT);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2.2, duration: 140, onComplete: () => flash.destroy() });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = this.add.circle(
        x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, 4, color
      ).setDepth(DEPTH.EFFECT);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 48,
        y: y + Math.sin(angle) * 48,
        alpha: 0, scale: 0,
        duration: 280, ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(15, 55);
      const p = this.add.circle(
        x + Phaser.Math.Between(-12, 12),
        y + Phaser.Math.Between(-12, 12),
        Phaser.Math.Between(2, 4), color
      ).setDepth(DEPTH.EFFECT);
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist - 20,
        alpha: 0, scale: 0,
        duration: Phaser.Math.Between(250, 500), ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  private showDamageNumber(x: number, y: number, value: number, isCrit: boolean, isHeal: boolean) {
    if (isCrit && !isHeal) {
      const critLabel = this.add.text(x, y - 22, 'CRITICAL!', {
        fontSize: '13px', fontStyle: 'bold', color: '#ffff44',
        stroke: '#442200', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(DEPTH.DAMAGE);
      this.tweens.add({
        targets: critLabel, y: critLabel.y - 35, alpha: 0,
        duration: 1000, ease: 'Power2',
        onComplete: () => critLabel.destroy(),
      });
    }

    const label = isHeal ? `+${value}` : `-${value}`;
    const color = isHeal ? '#44ff88' : isCrit ? '#ffee44' : '#ff5544';
    const stroke = isHeal ? '#004422' : '#000000';
    const size = isCrit ? '30px' : '22px';

    const text = this.add.text(x, y, label, {
      fontSize: size, fontStyle: 'bold', color, stroke, strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.DAMAGE);

    this.tweens.add({
      targets: text,
      y: text.y - 55,
      alpha: 0,
      scale: isCrit ? 1.25 : 1.05,
      duration: 1100, ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private tweenPromise(
    target: Phaser.GameObjects.Container,
    cfg: { x?: number; y?: number; duration?: number; ease?: string }
  ): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({ targets: target, ...cfg, onComplete: () => resolve() });
    });
  }

  private shake(target: Phaser.GameObjects.Container, intensity: number, duration: number): Promise<void> {
    const origX = target.x;
    return new Promise(resolve => {
      this.tweens.add({
        targets: target, x: origX + intensity,
        duration: duration / 6, yoyo: true, repeat: 5,
        ease: 'Sine.easeInOut',
        onComplete: () => { target.x = origX; resolve(); },
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  get animating(): boolean { return this.isAnimating; }
}

export function PhaserBattleRenderer({
  battleState,
  onAnimationComplete,
  onUnitClick,
}: PhaserBattleRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BattleScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 900,
      height: 500,
      parent: containerRef.current,
      backgroundColor: '#0a0a1a',
      scene: BattleScene,
      render: {
        antialias: true,
        pixelArt: false,
        failIfMajorPerformanceCaveat: false,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      audio: { disableWebAudio: true },
    };

    gameRef.current = new Phaser.Game(config);

    gameRef.current.events.once('ready', () => {
      sceneRef.current = gameRef.current?.scene.getScene('BattleScene') as BattleScene;
      if (sceneRef.current && onUnitClick) {
        sceneRef.current.setOnUnitClick(onUnitClick);
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateBattleState(battleState);
    }
  }, [battleState]);

  useEffect(() => {
    if (sceneRef.current && onUnitClick) {
      sceneRef.current.setOnUnitClick(onUnitClick);
    }
  }, [onUnitClick]);

  const playAttack = useCallback(async (
    actorId: string,
    targetId: string,
    damage: number,
    isCrit: boolean,
    attackType: 'melee' | 'ranged' | 'magic' = 'melee'
  ) => {
    if (!sceneRef.current) return;
    switch (attackType) {
      case 'melee': await sceneRef.current.playMeleeAttack(actorId, targetId, damage, isCrit); break;
      case 'ranged': await sceneRef.current.playRangedAttack(actorId, targetId, damage, isCrit); break;
      case 'magic': await sceneRef.current.playMagicAttack(actorId, targetId, damage, isCrit); break;
    }
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  const playHeal = useCallback(async (targetId: string, amount: number) => {
    if (!sceneRef.current) return;
    await sceneRef.current.playHealEffect(targetId, amount);
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[9/5] bg-slate-950 rounded-lg overflow-hidden"
      data-testid="phaser-battle-renderer"
    />
  );
}

export type { BattleScene };
