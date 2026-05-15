'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import './DogAnimation.css';
import {
  DogState, DogBreed,
  STATE_TO_FILE, ACTIONS, BREEDS, MSGS, BREED_MSGS, isFullMoon,
} from './dogConstants';

interface Props {
  muted?: boolean;
  selectedName?: string;
  selectedPosition?: string;
  selectedDept?: string;
  selectedGender?: 'M' | 'F' | '';
  /** Mount inside a relative container (e.g. the header bar) instead of fixed at bottom */
  inline?: boolean;
  /** Sprite size in px (default 100). Use ~53 for the header bar. */
  dogSize?: number;
  /** Suppress all speech bubbles — dog just animates silently */
  silent?: boolean;
  /** Skip daily rotation and use this breed directly */
  forcedBreed?: DogBreed;
  /** Override z-index of the fixed container (default 9999) */
  zIndex?: number;
}

export default function DogAnimation({
  muted = false,
  selectedName = '',
  selectedPosition = '',
  selectedDept = '',
  selectedGender = '',
  inline = false,
  dogSize = 100,
  silent = false,
  forcedBreed,
  zIndex = 9999,
}: Props) {
  const DOG_SIZE = dogSize;
  const silentRef = useRef(silent);
  useEffect(() => { silentRef.current = silent; }, [silent]);
  const SLEEP_DELAY = 3 * 60 * 1000;
  const ROTATION_KEY = 'pt_dog_rotation_v3';
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  const MALE_BREEDS: DogBreed[]   = ['Dog-2-Akita', 'Dog-3-Great-Dane', 'Dog-5-Saint-Bernard'];
  const FEMALE_BREEDS: DogBreed[] = ['Dog-1-Golden-Retriever', 'Dog-4-Schnauzer', 'Dog-6-Siberian-Husky'];

  // ── Render state ──────────────────────────────────────────────────────
  const [currentBreed,         setCurrentBreed]         = useState<DogBreed>('Dog-1-Golden-Retriever');
  const [currentState,         setCurrentState]         = useState<DogState>('idle');
  const [currentDirection,     setCurrentDirection]     = useState<'left'|'right'>('right');
  const [currentPixelPosition, setCurrentPixelPosition] = useState(0);
  const [isReady,              setIsReady]              = useState(false);
  const [showTip,              setShowTip]              = useState(false);
  const [currentTip,           setCurrentTip]           = useState('');
  const [moveDuration,         setMoveDuration]         = useState(0);
  const [isZoomies,            setIsZoomies]            = useState(false);
  const [showHearts,           setShowHearts]           = useState(false);
  const [showPoop,             setShowPoop]             = useState(false);
  const [showPee,              setShowPee]              = useState(false);
  const [showDirt,             setShowDirt]             = useState(false);
  const [showTrophy,           setShowTrophy]           = useState(false);
  const [isJumping,            setIsJumping]            = useState(false);
  const [isSuperman,           setIsSuperman]           = useState(false);
  const [badMood,              setBadMood]              = useState(false);
  const [isHyper,              setIsHyper]              = useState(false);
  const [isSexy,               setIsSexy]               = useState(false);
  const [isDragging,           setIsDragging]           = useState(false);
  const [isDancing,            setIsDancing]            = useState(false);
  const [isKonami,             setIsKonami]             = useState(false);
  const [heartList, setHeartList] = useState<{ id: number; delay: number; dx: number; emoji: string }[]>([]);

  // ── Refs mirroring render state (for stale-closure-free callbacks) ────
  const currentBreedRef         = useRef<DogBreed>('Dog-1-Golden-Retriever');
  const currentStateRef         = useRef<DogState>('idle');
  const currentDirectionRef     = useRef<'left'|'right'>('right');
  const currentPixelPositionRef = useRef(0);
  const isReadyRef              = useRef(false);
  const moveDurationRef         = useRef(0);
  const isZoomiesRef            = useRef(false);
  const isJumpingRef            = useRef(false);
  const isSupermanRef           = useRef(false);
  const badMoodRef              = useRef(false);
  const isHyperRef              = useRef(false);
  const isSexyRef               = useRef(false);
  const isDraggingRef           = useRef(false);
  const isDancingRef            = useRef(false);
  const isKonamiRef             = useRef(false);
  const mutedRef                = useRef(muted);

  // ── Sync setters (update both ref and state) ──────────────────────────
  const updateBreed     = (b: DogBreed)       => { currentBreedRef.current         = b; setCurrentBreed(b); };
  const updateState     = (s: DogState)       => { currentStateRef.current         = s; setCurrentState(s); };
  const updateDirection = (d: 'left'|'right') => { currentDirectionRef.current     = d; setCurrentDirection(d); };
  const updatePosition  = (x: number)         => { currentPixelPositionRef.current = x; setCurrentPixelPosition(x); };
  const updateDuration  = (d: number)         => { moveDurationRef.current         = d; setMoveDuration(d); };
  const updateZoomies   = (v: boolean)        => { isZoomiesRef.current            = v; setIsZoomies(v); };
  const updateJumping   = (v: boolean)        => { isJumpingRef.current            = v; setIsJumping(v); };
  const updateSuperman  = (v: boolean)        => { isSupermanRef.current           = v; setIsSuperman(v); };
  const updateBadMood   = (v: boolean)        => { badMoodRef.current              = v; setBadMood(v); };
  const updateHyper     = (v: boolean)        => { isHyperRef.current              = v; setIsHyper(v); };
  const updateSexy      = (v: boolean)        => { isSexyRef.current               = v; setIsSexy(v); };
  const updateDragging  = (v: boolean)        => { isDraggingRef.current           = v; setIsDragging(v); };
  const updateDancing   = (v: boolean)        => { isDancingRef.current            = v; setIsDancing(v); };
  const updateKonami    = (v: boolean)        => { isKonamiRef.current             = v; setIsKonami(v); };

  // ── Pure internal refs ────────────────────────────────────────────────
  const dogWrapperRef       = useRef<HTMLDivElement>(null);
  const dogContainerRef     = useRef<HTMLDivElement>(null);
  const timeoutIdsRef       = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sleepTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeObserverRef   = useRef<ResizeObserver | null>(null);
  const isDestroyedRef      = useRef(false);
  const containerWidthRef   = useRef(0);
  const clickCountRef       = useRef(0);
  const lastClickTimeRef    = useRef(0);
  const clickResetTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseBarkAtRef  = useRef(0);
  const lastKeyReactAtRef   = useRef(0);
  const keyTypeCountRef     = useRef(0);
  const isSleepingRef       = useRef(false);
  const energyWalkCountRef  = useRef(0);
  const rafIdRef            = useRef<number | null>(null);
  const heartCounterRef     = useRef(0);
  const lastMouseXRef       = useRef(0);
  const lastMouseYRef       = useRef(0);
  const lastMouseTimeRef    = useRef(0);
  const isChasingRef        = useRef(false);
  const chaseTimeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const konamiProgressRef   = useRef(0);
  const dragMoveHandlerRef  = useRef<((e: MouseEvent) => void) | null>(null);
  const dragUpHandlerRef    = useRef<(() => void) | null>(null);
  const dragStartXRef       = useRef(0);
  const didDragRef          = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // ── Computed ──────────────────────────────────────────────────────────
  const isSleepState = currentState === 'sleeping' || currentState === 'lying-down';
  const isMoving     = currentState === 'walking'  || currentState === 'running';

  const spriteFilter = useMemo(() => {
    if (badMood)    return 'hue-rotate(320deg) saturate(2) brightness(0.85)';
    if (isKonami)   return 'hue-rotate(var(--konami-hue,0deg)) saturate(3) brightness(1.4)';
    if (isSexy)     return 'hue-rotate(300deg) saturate(1.8) brightness(1.1) drop-shadow(0 0 5px #f9a8d4)';
    if (isSuperman) return 'drop-shadow(0 0 8px #ffd700) brightness(1.2)';
    if (isHyper)    return 'hue-rotate(280deg) saturate(3) brightness(1.3) drop-shadow(0 0 6px #f0abfc)';
    return '';
  }, [badMood, isKonami, isSexy, isSuperman, isHyper]);

  const dogStyle = useMemo((): React.CSSProperties => {
    const breed  = BREEDS[currentBreed];
    const action = ACTIONS.find(a => a.name === currentState);
    if (!action || !breed) return {};
    let fileName = STATE_TO_FILE[action.name];
    if (action.name === 'idle' && breed.idleCase === 'Idle') fileName = 'Idle';
    const url    = `/assets_dog/Pet Dogs Pack/${breed.folder}/${breed.prefix}${fileName}.png`;
    const endPos = -(action.width * (DOG_SIZE / 100));
    return {
      backgroundImage:    `url('${url}')`,
      backgroundSize:     `auto ${DOG_SIZE}px`,
      backgroundPositionX: '0px',
      width:  `${DOG_SIZE}px`,
      height: `${DOG_SIZE}px`,
      ['--sprite-width' as string]: `${endPos}px`,
      animation: action.frames > 1
        ? `play-sprite ${action.duration} steps(${action.frames}) infinite both`
        : 'none',
    };
  }, [currentBreed, currentState]);

  // ── Helpers ───────────────────────────────────────────────────────────
  function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  function clearActions() {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
  }

  function freezeMovement() {
    const wrapper   = dogWrapperRef.current;
    const container = dogContainerRef.current;
    if (!wrapper || !container) return;
    const rect  = wrapper.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    updatePosition(rect.left - cRect.left);
    updateDuration(0);
  }

  function updateMetrics() {
    containerWidthRef.current =
      dogContainerRef.current?.clientWidth ??
      (typeof window !== 'undefined' ? window.innerWidth : 0);
  }

  function clamp() {
    const max = containerWidthRef.current - DOG_SIZE - 25;
    const pos = currentPixelPositionRef.current;
    if (pos > max) updatePosition(max);
    else if (pos < 0) updatePosition(0);
  }

  // ── Speech bubbles ────────────────────────────────────────────────────
  function showMsgDirect(msg: string) {
    if (silentRef.current) return;
    setShowTip(false);
    const id0 = setTimeout(() => {
      if (isDestroyedRef.current) return;
      setCurrentTip(msg);
      setShowTip(true);
      const id1 = setTimeout(() => { if (!isDestroyedRef.current) setShowTip(false); }, 3500);
      timeoutIdsRef.current.push(id1);
    }, 40);
    timeoutIdsRef.current.push(id0);
  }

  function showStateMessage(key: string) {
    if (silentRef.current) return;
    const breedArr   = BREED_MSGS[currentBreedRef.current]?.[key];
    const genericArr = MSGS[key];
    const arr = breedArr && breedArr.length && Math.random() < 0.65
      ? breedArr
      : (genericArr ?? breedArr ?? []);
    if (arr && arr.length > 0) showMsgDirect(rnd(arr));
  }

  // ── Sound ─────────────────────────────────────────────────────────────
  function playSound(type: 'bark'|'squeak'|'zoomies'|'jump'|'growl'|'howl'|'sneeze'|'pee'|'lick'|'eating'|'panting'|'whoosh') {
    if (mutedRef.current || typeof window === 'undefined') return;
    try {
      const FILE_MAP: Partial<Record<string, string>> = {
        bark: 'sounds/bark.mp3', growl: 'sounds/growl.mp3', howl: 'sounds/howl.mp3',
        sneeze: 'sounds/sneeze.mp3', pee: 'sounds/pee.mp3', lick: 'sounds/lick.mp3',
        eating: 'sounds/eating.mp3', panting: 'sounds/panting.mp3', whoosh: 'sounds/whoosh.mp3',
      };
      const file = FILE_MAP[type];
      if (file) {
        const audio = new Audio(file);
        audio.volume = type === 'squeak' ? 0.6 : 0.5;
        audio.play().catch(() => {});
        return;
      }
      const AC = (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const g = ctx.createGain();
      g.connect(ctx.destination);
      if (type === 'zoomies') {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(300, ctx.currentTime);
        o.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.28);
        g.gain.setValueAtTime(0.07, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.28);
        o.connect(g); o.start(); o.stop(ctx.currentTime + 0.28);
      } else if (type === 'jump') {
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(220, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.14);
        o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.32);
        g.gain.setValueAtTime(0.14, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.32);
        o.connect(g); o.start(); o.stop(ctx.currentTime + 0.32);
      }
      setTimeout(() => ctx.close(), 1500);
    } catch { /* audio not supported */ }
  }

  // ── Paw trail ─────────────────────────────────────────────────────────
  function dropPawPrint(x: number, flip: boolean) {
    const container = dogContainerRef.current;
    if (!container) return;
    const el = document.createElement('div');
    el.textContent = '🐾';
    el.style.cssText = `position:absolute;bottom:28px;left:${x}px;font-size:0.7rem;pointer-events:none;transform:scaleX(${flip ? -1 : 1});animation:paw-fade 1.4s ease-out forwards;z-index:1;opacity:0;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function spawnPawTrail(fromX: number, toX: number, durationMs: number) {
    if (inline) return; // paw prints look wrong in the header bar
    const dist      = Math.abs(toX - fromX);
    const numPrints = Math.min(Math.floor(dist / 65), 12);
    if (numPrints < 1) return;
    for (let i = 1; i <= numPrints; i++) {
      const t       = i / (numPrints + 1);
      const x       = fromX + (toX - fromX) * t + 30;
      const delayMs = t * durationMs;
      const id = setTimeout(() => {
        if (!isDestroyedRef.current) dropPawPrint(x, i % 2 === 0);
      }, delayMs);
      timeoutIdsRef.current.push(id);
    }
  }

  // ── Hearts ────────────────────────────────────────────────────────────
  function spawnHearts(count = 5, kisses = false) {
    const emojis = kisses
      ? ['💋', '😘', '💕', '❤️', '💗']
      : ['❤️', '🧡', '💛', '💚', '💙', '🩷'];
    setHeartList(Array.from({ length: count }, (_, i) => ({
      id:    heartCounterRef.current++,
      delay: i * 0.1,
      dx:    (Math.random() - 0.5) * 60,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    })));
    setShowHearts(true);
    const id = setTimeout(() => { if (!isDestroyedRef.current) setShowHearts(false); }, 1800);
    timeoutIdsRef.current.push(id);
  }

  // ── scheduleNext / decide ─────────────────────────────────────────────
  function scheduleNext(delay?: number) {
    if (isDestroyedRef.current) return;
    const d = delay ?? (Math.random() * 2000 + 800);
    const id = setTimeout(() => decide(), d);
    timeoutIdsRef.current.push(id);
  }

  function decide() {
    if (isDestroyedRef.current || isSleepingRef.current || isChasingRef.current) return;
    const now          = new Date();
    const h            = now.getHours();
    const dow          = now.getDay();
    const isNight      = h >= 22 || h < 6;
    const isMorn       = h >= 6  && h < 9;
    const isLunch      = h >= 12 && h < 14;
    const isMonday     = dow === 1;
    const isFriday     = dow === 5;
    const isAprilFools = now.getMonth() === 3 && now.getDate() === 1;
    const fullMoon     = isNight && isFullMoon();
    const tired        = energyWalkCountRef.current > 5;
    const grumpy       = badMoodRef.current;
    const roll         = Math.random();

    if (isAprilFools && !grumpy && roll < 0.10) {
      showMsgDirect(rnd(MSGS['aprilFools']));
      if (Math.random() < 0.5) triggerZoomies(); else { updateState('barking'); scheduleNext(1200); }
      return;
    }
    if (isFriday && !grumpy && !tired && roll < 0.07) { showStateMessage('friday'); doExcited(); return; }
    if (isMonday && !grumpy && roll < 0.05)            { showStateMessage('monday'); triggerBadMood(); return; }
    if (!grumpy && roll < 0.03)                        { triggerBadMood(); return; }
    if (!grumpy && !isSexyRef.current && roll < 0.015) { triggerSexyMode(); scheduleNext(1500); return; }
    const zoomieChance = isFriday ? 0.04 : isMorn ? 0.025 : 0.012;
    if (!tired && !grumpy && roll < zoomieChance) { triggerZoomies(); return; }
    if (roll < 0.008) { doPoop(); return; }
    if (tired && roll < 0.45) { energyWalkCountRef.current = 0; enterSleep(); return; }

    if (isNight) {
      if (fullMoon && roll < 0.35)    doHowl();
      else if (roll < 0.20)           doHowl();
      else if (roll < 0.40)           { updateState('idle'); scheduleNext(3500); }
      else if (roll < 0.62)           doWalk();
      else if (roll < 0.72)           doConfused();
      else                            enterSleep();
      return;
    }

    if (grumpy) {
      if      (roll < 0.40) doAction('barking', 1200);
      else if (roll < 0.60) { updateState('idle'); showStateMessage('grumpy'); scheduleNext(1800); }
      else if (roll < 0.75) doWalk();
      else                  doAction('itching', 1600);
      resetSleepTimer(); return;
    }

    if (isLunch && roll < 0.20) {
      if (Math.random() < 0.5) doSnack(); else doHungry();
      resetSleepTimer(); return;
    }

    if      (roll < 0.24) doWalkMaybeStretch();
    else if (roll < 0.32) doAction('barking',    1400);
    else if (roll < 0.39) doAction('itching',    2200);
    else if (roll < 0.45) doAction('stretching', 2000);
    else if (roll < 0.50) doSneeze();
    else if (roll < 0.54) doChaseTail();
    else if (roll < 0.58) doExcited();
    else if (roll < 0.61) doHungry();
    else if (roll < 0.63) doSnack();
    else if (roll < 0.66) doConfused();
    else if (roll < 0.69) doJump();
    else if (roll < 0.72) doPee();
    else if (roll < 0.75) doDig();
    else if (roll < 0.78) doRoll();
    else if (roll < 0.80) doSupermanAction();
    else if (roll < 0.83) doLick();
    else if (roll < 0.86) doDance();
    else if (roll < 0.88) doTrophy();
    else if (roll < 0.91) doBlackDogShoutout();
    else if (roll < 0.93) doSpin();
    else if (roll < 0.95) doFloat();
    else if (roll < 0.97) doWiggle();
    else if (roll < 0.99) doShrink();
    else { updateState('idle'); if (Math.random() < 0.35) showStateMessage('idle'); scheduleNext(2500); }

    resetSleepTimer();
  }

  function doAction(state: DogState, dur: number) {
    updateState(state);
    showStateMessage(state);
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(400); }
    }, dur);
    timeoutIdsRef.current.push(id);
  }

  function doWalkMaybeStretch() {
    if (Math.random() < 0.3) {
      updateState('stretching');
      showStateMessage('stretching');
      const id = setTimeout(() => { if (!isDestroyedRef.current) doWalk(); }, 1800);
      timeoutIdsRef.current.push(id);
    } else { doWalk(); }
  }

  function doWalk() {
    if (containerWidthRef.current === 0) updateMetrics();
    const margin = 25;
    const maxPos = Math.max(25, containerWidthRef.current - margin - DOG_SIZE);
    const minPos = margin;
    const corner = Math.random() < 0.22;
    let target: number;

    if (corner) {
      target = currentPixelPositionRef.current > containerWidthRef.current / 2 ? minPos : maxPos;
    } else {
      target = Math.random() * (maxPos - minPos) + minPos;
      if (Math.abs(target - currentPixelPositionRef.current) < 100)
        target = currentPixelPositionRef.current > containerWidthRef.current / 2 ? minPos + 50 : maxPos - 50;
    }

    const fromX    = currentPixelPositionRef.current;
    const dist     = Math.abs(target - fromX);
    const speed    = 55 + Math.random() * 20;
    const duration = Math.min(dist / speed, 5);

    updateDirection(target > fromX ? 'right' : 'left');
    updateDuration(duration);
    updateState('walking');
    updatePosition(target);
    energyWalkCountRef.current++;
    spawnPawTrail(fromX, target, duration * 1000);

    const id = setTimeout(() => {
      if (isDestroyedRef.current) return;
      if (corner && Math.random() < 0.55) {
        doAction(Math.random() < 0.5 ? 'itching' : 'barking', 1800);
      } else {
        updateState('idle');
        scheduleNext(800 + Math.random() * 1200);
      }
    }, duration * 1000 + 50);
    timeoutIdsRef.current.push(id);
  }

  // ── Behaviors ─────────────────────────────────────────────────────────
  function doLick() {
    updateState('licking'); showStateMessage('licking');
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(500); } }, 2200);
    timeoutIdsRef.current.push(id);
  }

  function doPee() {
    updateState('sitting'); showStateMessage('pee');
    const id1 = setTimeout(() => {
      if (isDestroyedRef.current) return;
      setShowPee(true);
      const id2 = setTimeout(() => {
        if (!isDestroyedRef.current) { setShowPee(false); updateState('idle'); scheduleNext(800); }
      }, 2500);
      timeoutIdsRef.current.push(id2);
    }, 900);
    timeoutIdsRef.current.push(id1);
  }

  function doJump() {
    if (isJumpingRef.current) return;
    updateJumping(true); showStateMessage('jump'); updateState('barking');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateJumping(false); updateState('idle'); scheduleNext(600); }
    }, 750);
    timeoutIdsRef.current.push(id);
  }

  function doSupermanAction() {
    if (isSupermanRef.current) return;
    updateSuperman(true); playSound('whoosh'); showStateMessage('superman'); updateState('stretching');
    const goRight = currentPixelPositionRef.current < containerWidthRef.current / 2;
    updateDirection(goRight ? 'right' : 'left');
    updateDuration(2.2);
    updatePosition(goRight ? Math.max(25, containerWidthRef.current - DOG_SIZE - 25) : 25);
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateSuperman(false); updateState('idle'); scheduleNext(1000); }
    }, 2500);
    timeoutIdsRef.current.push(id);
  }

  function doDig() {
    updateState('sitting'); showStateMessage('dig'); setShowDirt(true);
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { setShowDirt(false); updateState('idle'); scheduleNext(600); }
    }, 2200);
    timeoutIdsRef.current.push(id);
  }

  function doRoll() {
    updateState('lying-down'); showStateMessage('roll');
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(500); } }, 1800);
    timeoutIdsRef.current.push(id);
  }

  function doSneeze() {
    updateState('sitting'); showStateMessage('sneeze');
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(600); } }, 1800);
    timeoutIdsRef.current.push(id);
  }

  function doChaseTail() {
    updateState('itching'); showMsgDirect(rnd(MSGS['chase']));
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(400); } }, 2500);
    timeoutIdsRef.current.push(id);
  }

  function doHowl() {
    updateState('barking'); showStateMessage('howl');
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(800); } }, 1600);
    timeoutIdsRef.current.push(id);
  }

  function doExcited() {
    updateState('barking'); showMsgDirect(rnd(MSGS['excited'])); spawnHearts();
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(500); } }, 1500);
    timeoutIdsRef.current.push(id);
  }

  function doHungry() {
    updateState('sitting'); showMsgDirect(rnd(MSGS['hungry']));
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(600); } }, 2000);
    timeoutIdsRef.current.push(id);
  }

  function doSnack() {
    updateState('sitting'); showMsgDirect(rnd(MSGS['snack']));
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(800); } }, 2500);
    timeoutIdsRef.current.push(id);
  }

  function doConfused() {
    updateState('sitting'); showMsgDirect(rnd(MSGS['confused']));
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(400); } }, 1800);
    timeoutIdsRef.current.push(id);
  }

  function doTrophy() {
    updateState('sitting'); showStateMessage('trophy'); setShowTrophy(true); spawnHearts(6);
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { setShowTrophy(false); updateState('idle'); scheduleNext(800); }
    }, 3500);
    timeoutIdsRef.current.push(id);
  }

  function doDance() {
    updateDancing(true); updateState('idle'); showStateMessage('dance');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateDancing(false); updateState('idle'); scheduleNext(600); }
    }, 4000);
    timeoutIdsRef.current.push(id);
  }

  function doSpin() {
    updateState('sitting');
    showMsgDirect(rnd(['¡SPIN! 🌀', '¡Giro! 💫', '¡Vuelta entera! 🌀', '¡Trompo activado! 💫']));
    dogWrapperRef.current?.classList.add('dog-spinning');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) {
        dogWrapperRef.current?.classList.remove('dog-spinning');
        updateState('idle'); scheduleNext(800);
      }
    }, 700);
    timeoutIdsRef.current.push(id);
  }

  function doFloat() {
    updateState('running');
    showMsgDirect(rnd(['¡Vuelo! ✈️', '*levita* 🐕', '¡Soy astronauta! 🚀', '¡Sin gravedad! 🌌']));
    dogWrapperRef.current?.classList.add('dog-floating');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) {
        dogWrapperRef.current?.classList.remove('dog-floating');
        updateState('idle'); scheduleNext(800);
      }
    }, 1300);
    timeoutIdsRef.current.push(id);
  }

  function doWiggle() {
    updateState('barking');
    showMsgDirect(rnd(['¡Wiggle wiggle! 🐕', '*menea menea*', '¡Baile movimiento!', '🕺 *wiggle*']));
    dogWrapperRef.current?.classList.add('dog-wiggling');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) {
        dogWrapperRef.current?.classList.remove('dog-wiggling');
        updateState('idle'); scheduleNext(800);
      }
    }, 600);
    timeoutIdsRef.current.push(id);
  }

  function doShrink() {
    updateState('sitting');
    showMsgDirect(rnd(['¿Me achiqué? 🐾', '*modo mini* 🐕', 'Ahora soy Chihuahua~', '¡Modo bolsillo! 👝']));
    dogWrapperRef.current?.classList.add('dog-shrinking');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) {
        dogWrapperRef.current?.classList.remove('dog-shrinking');
        updateState('idle'); scheduleNext(800);
      }
    }, 600);
    timeoutIdsRef.current.push(id);
  }

  function doBlackDogShoutout() {
    updateState('barking'); showMsgDirect(rnd(MSGS['blackdog']));
    const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(800); } }, 1400);
    timeoutIdsRef.current.push(id);
  }

  function doPoop() {
    updateState('sitting'); showMsgDirect(rnd(MSGS['poop']));
    const id1 = setTimeout(() => {
      if (isDestroyedRef.current) return;
      setShowPoop(true);
      const id2 = setTimeout(() => {
        if (!isDestroyedRef.current) { setShowPoop(false); updateState('idle'); scheduleNext(1000); }
      }, 3200);
      timeoutIdsRef.current.push(id2);
    }, 1200);
    timeoutIdsRef.current.push(id1);
  }

  // ── Special modes ─────────────────────────────────────────────────────
  function triggerZoomies(laps = 0) {
    if (isDestroyedRef.current) return;
    clearActions();
    isSleepingRef.current = false;
    isChasingRef.current  = false;
    const goRight   = laps % 2 === 0
      ? currentPixelPositionRef.current < containerWidthRef.current / 2
      : currentPixelPositionRef.current >= containerWidthRef.current / 2;
    const targetPos = goRight ? Math.max(25, containerWidthRef.current - DOG_SIZE - 25) : 25;

    updateDirection(goRight ? 'right' : 'left');
    updateDuration(0.55);
    updateState('running');
    updateZoomies(true);
    updatePosition(targetPos);
    if (laps === 0) showStateMessage('zoomies');
    spawnPawTrail(currentPixelPositionRef.current, targetPos, 550);

    const totalLaps = 2 + Math.floor(Math.random() * 3);
    const id = setTimeout(() => {
      if (isDestroyedRef.current) return;
      if (laps + 1 < totalLaps) { triggerZoomies(laps + 1); }
      else {
        updateZoomies(false); updateState('idle');
        energyWalkCountRef.current = 0;
        scheduleNext(1500); resetSleepTimer();
      }
    }, 600);
    timeoutIdsRef.current.push(id);
  }

  function triggerHyper() {
    if (isDestroyedRef.current || isHyperRef.current) return;
    clearActions();
    isSleepingRef.current = false;
    isChasingRef.current  = false;
    updateHyper(true); updateZoomies(true);
    showMsgDirect(rnd(MSGS['hyper']));
    energyWalkCountRef.current = 0;
    doHyperLap(0, 6 + Math.floor(Math.random() * 4));
  }

  function doHyperLap(lap: number, total: number) {
    if (isDestroyedRef.current) return;
    const goRight   = lap % 2 === 0
      ? currentPixelPositionRef.current < containerWidthRef.current / 2
      : currentPixelPositionRef.current >= containerWidthRef.current / 2;
    const targetPos = goRight ? Math.max(25, containerWidthRef.current - DOG_SIZE - 25) : 25;
    updateDirection(goRight ? 'right' : 'left');
    updateDuration(0.4); updateState('running'); updatePosition(targetPos);
    spawnPawTrail(currentPixelPositionRef.current, targetPos, 400);
    if (lap % 2 === 0) spawnHearts(5);

    const id = setTimeout(() => {
      if (isDestroyedRef.current) return;
      if (lap + 1 < total) {
        doHyperLap(lap + 1, total);
      } else {
        updateHyper(false); updateZoomies(false);
        showMsgDirect(rnd(MSGS['hyperDone']));
        updateState('lying-down');
        isSleepingRef.current = true;
        const restId = setTimeout(() => {
          if (!isDestroyedRef.current) {
            updateState('sleeping');
            const wakeId = setTimeout(() => {
              if (!isDestroyedRef.current) wakeUp();
            }, 8000 + Math.random() * 5000);
            timeoutIdsRef.current.push(wakeId);
          }
        }, 2000);
        timeoutIdsRef.current.push(restId);
      }
    }, 450);
    timeoutIdsRef.current.push(id);
  }

  function triggerKonami() {
    if (isDestroyedRef.current) return;
    clearActions(); updateKonami(true);
    showMsgDirect(rnd(MSGS['konami'])); spawnHearts(10); doSupermanAction();
    const id = setTimeout(() => { if (!isDestroyedRef.current) updateKonami(false); }, 3000);
    timeoutIdsRef.current.push(id);
  }

  function triggerBadMood() {
    if (isDestroyedRef.current || badMoodRef.current) return;
    updateBadMood(true); updateSexy(false); clearActions();
    updateState('barking'); showStateMessage('grumpy');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateBadMood(false); showMsgDirect('😌 Ya pasó~'); }
    }, 90_000 + Math.random() * 150_000);
    timeoutIdsRef.current.push(id);
    scheduleNext(1200);
  }

  function triggerSexyMode() {
    if (isDestroyedRef.current || isSexyRef.current || badMoodRef.current) return;
    updateSexy(true); showStateMessage('sexy'); spawnHearts(6, true);
    const id = setTimeout(() => { if (!isDestroyedRef.current) updateSexy(false); }, 25_000 + Math.random() * 20_000);
    timeoutIdsRef.current.push(id);
  }

  // ── Sleep ─────────────────────────────────────────────────────────────
  function resetSleepTimer() {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    const h     = new Date().getHours();
    const delay = (h >= 22 || h < 6) ? 60_000 : (h >= 12 && h < 14) ? 90_000 : SLEEP_DELAY;
    sleepTimerRef.current = setTimeout(() => enterSleep(), delay);
  }

  function enterSleep() {
    if (isDestroyedRef.current || isSleepingRef.current) return;
    isSleepingRef.current = true; clearActions();
    updateZoomies(false); updateSexy(false); updateDancing(false);
    updateState('lying-down'); showStateMessage('lying-down');
    const id = setTimeout(() => {
      if (isDestroyedRef.current) return;
      updateState('sleeping'); showStateMessage('sleeping');
      const wId = setTimeout(() => {
        if (!isDestroyedRef.current) wakeUp();
      }, 120_000 + Math.random() * 180_000);
      timeoutIdsRef.current.push(wId);
    }, 2500);
    timeoutIdsRef.current.push(id);
  }

  function wakeUp() {
    if (isDestroyedRef.current) return;
    isSleepingRef.current = false; clearActions();
    showMsgDirect(rnd(MSGS['wake'])); updateState('stretching');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(900); resetSleepTimer(); }
    }, 2000);
    timeoutIdsRef.current.push(id);
  }

  // ── Mouse chase ───────────────────────────────────────────────────────
  function startMouseChase(mouseClientX: number) {
    if (isDestroyedRef.current || isSleepingRef.current || isDraggingRef.current) return;
    isChasingRef.current = true; clearActions();
    if (chaseTimeoutRef.current) clearTimeout(chaseTimeoutRef.current);

    const container = dogContainerRef.current;
    if (!container) return;
    const cRect   = container.getBoundingClientRect();
    const targetX = Math.max(25, Math.min(mouseClientX - cRect.left - DOG_SIZE / 2, containerWidthRef.current - DOG_SIZE - 25));

    updateDirection(targetX > currentPixelPositionRef.current ? 'right' : 'left');
    const dist     = Math.abs(targetX - currentPixelPositionRef.current);
    const duration = Math.min(dist / 450, 2.5);
    updateDuration(duration); updateState('running'); updatePosition(targetX);
    showStateMessage('chase_mouse');
    spawnPawTrail(currentPixelPositionRef.current, targetX, duration * 1000);

    chaseTimeoutRef.current = setTimeout(() => {
      if (!isDestroyedRef.current) {
        isChasingRef.current = false; updateState('sitting');
        showMsgDirect(rnd(['¡Lo atrapé! 😤', '*jadea*', '¡Era mío!', '*mira triunfante*', 'Siguiente vez no escapa.']));
        const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(1200); } }, 1500);
        timeoutIdsRef.current.push(id);
      }
    }, duration * 1000 + 200);
    timeoutIdsRef.current.push(chaseTimeoutRef.current);
  }

  // ── Greet by name ─────────────────────────────────────────────────────
  function greetByName(name: string, position = '', dept = '') {
    if (isDestroyedRef.current || isSleepingRef.current) return;
    const first = name.split(' ')[0];
    const pos   = position.toLowerCase();
    const dep   = dept.toLowerCase();

    const byPosition = ((): string[] => {
      if (/peluc|groo|estilis/i.test(pos)) return [`¡${first} el/la peluquero/a llegó! ✂️🐾`,`¡${first}! ¡A transformar peludos! ✂️`,`¡Las tijeras están listas, ${first}! ✂️`,`¡${first}! ¡Artista del pelaje! 🎨🐾`,`¡Llegó el/la estilista más crack! ✂️ ${first} in da house`,`${first}: las mascotas ya suspiran de alivio ✂️😌`,`¡${first}! ¡Black Dog Grooming te necesita! 🐕💅`,`El secador pregunta por ti, ${first} ✂️🔥`];
      if (/vet|doctor|dr\.|médic|clínic/i.test(pos)) return [`¡Dr(a). ${first} en el edificio! 🩺🐾`,`¡${first}! ¡Las mascotas están en buenas manos! 🩺`,`¡${first}! El estetoscopio te espera 🩺`,`Diagnóstico del día: ${first} es crack 🩺💪`,`¡${first}! ¡Guardián de las patitas! 🐾🩺`,`Las mascotas enfermas ya se sienten mejor, ${first} llegó 🩺❤️`,`¡${first}! ¡Medicina pura Black Dog! 🏥🐾`];
      if (/caj|cajero|cash|cobrad/i.test(pos)) return [`¡${first}! ¡La caja registradora te saluda! 💰`,`¡${first} al frente! 💵🐾`,`¡${first}! Sin ti no hay flujo de caja 💰💪`,`${first}: maestro/a del POS 🖥️💳`,`¡${first}! Las ventas dependen de ti hoy 💵`,`¡${first}! ¡El dinero fluye cuando llegas! 💰🌊`];
      if (/gerent|manager|supervis|jef[ae]|direct|coord/i.test(pos)) return [`¡El/La jefe/a en la casa! 👑 ${first}`,`¡${first}! ¡Comandante del turno! 🎖️`,`¡${first}! El equipo estaba esperando al líder 👑`,`${first}: máxima autoridad ha llegado 📋👑`,`¡Boss ${first} activado! 💼`,`¡${first}! ¡Liderazgo nivel Black Dog! 🖤👑`,`El perro reconoce al/a la líder: ${first} 🐕👑`];
      if (/vend|sales|comerc|asesore|ejecutiv/i.test(pos)) return [`¡${first}! ¡A vender todo! 💼🔥`,`¡${first} en modo ventas! 📈`,`¡${first}! ¡Las metas tiemblan cuando llegas! 🎯`,`${first}: números al alza hoy 📊💪`,`¡${first}! ¡El mejor pitch de Black Dog! 💬`,`¡${first} llega y las ventas suben! 📈🚀`];
      if (/guard|segur|vigilant|cuidad/i.test(pos)) return [`¡${first}! ¡Protector oficial! 🛡️`,`¡${first}! ¡Black Dog está seguro contigo! 🛡️🐾`,`¡${first} en guardia! El perro duerme tranquilo 🛡️😴`,`¡${first}! ¡Nadie pasa sin tu ok! 🚫🛡️`,`Seguridad máxima: ${first} llegó 🛡️💪`];
      if (/recep|recepcion|atenc|front|bienven/i.test(pos)) return [`¡${first}! ¡La cara bonita de Black Dog! 😊🐾`,`¡${first}! ¡Recepción habilitada! 📞`,`${first}: primera impresión = 10/10 ✨`,`¡${first}! ¡Bienvenida oficial está aquí! 🤝`,`¡Las visitas preguntan por ${first}! 😊💐`];
      if (/bodeg|almac|invent|stock|logis|bodeguero/i.test(pos)) return [`¡${first}! ¡El inventario en orden! 📦`,`¡${first}! ¡Sin ti no hay stock! 📦💪`,`¡${first}! ¡Maestro/a de la bodega! 🏭📦`,`${first}: el corazón del inventario late fuerte 📦❤️`,`¡${first}! ¡Las cajas te extrañaban! 📦🎉`];
      if (/limpiez|manten|aseo|higiene|janitor/i.test(pos)) return [`¡${first}! ¡Black Dog brilla gracias a ti! ✨🧹`,`¡${first}! ¡El héroe/heroína del orden! 🧹✨`,`${first}: sin ti esto sería un caos 🧹💪`,`¡${first}! ¡Limpieza nivel profesional! ✨🏆`];
      if (/train|entren|instruc|coach/i.test(pos)) return [`¡${first}! ¡A entrenar perritos! 🎾🐕`,`¡${first}! ¡Maestro/a de comandos! 🐕‍🦺`,`${first}: los perros obedecen cuando llegas 🎾`,`¡${first}! ¡Training mode ON! 🎾💪`];
      if (/gustavo/i.test(name)) return [`¡GUSTAVO! ¡Llegó el rey de la moto! 🏍️👑`,`¡Gustavo! ¿A cuántos km/h viniste hoy? 💨🏍️`,`¡El perro quiere subirse a la moto de Gustavo! 🐕🏍️`,`¡GUSTAVO EN LA CASA! 🏍️🔥`,`¡Gustavo Pereira: terrorista de las calles panameñas! 🏍️😤`,`¡Llegó Gustavo! El perro corre a esconderse 🐕💨`,`¡Gustavo! ¿Me prestas el casco? 🪖🐕`,`¡El motorista más crack de Black Dog! 🏍️⭐ Gustavo`,`¡Gustavo llegó y la moto quedó afuera! ¿Cómo quedó la moto? 👀🏍️`,`¡Gustavo! El perro ya marcó tu llegada antes de que parquearas 🐕🏍️`];
      if (/mensaj|delivery|domicil|moto|motoriz|repartid|courier|chofer|conductor/i.test(pos)) return [`¡${first}! ¡Lleváme en tu moto! 🏍️🐕`,`¡${first}! ¿Puedo ir en la caja de delivery? 📦🐾`,`¡${first} llegó! ¿Y los paquetes? 🏍️`,`¡${first}! ¿A cuántos km/h vienes? 💨🏍️`,`¡${first}! El perro quiere subirse a la moto 🐕🏍️`,`¡${first}! ¡Delivery de Black Dog en camino! 📦🔥`,`${first}: semáforo en rojo... ¡tiempo de saludar! 🏍️🐾`,`¡${first}! ¿Me traes algo? 👀📦`,`¡El/La motorista más crack: ${first}! 🏍️⚡`,`¡${first}! ¿Cuántas rutas hoy? 🗺️🏍️`,`${first} llegó vivo/a. ¡Éxito del día! 🏍️😅`,`¡${first}! La calle te pertenece 🏍️🔥`];
      return [];
    })();

    const byDept = ((): string[] => {
      if (/groo|peluc|spa/i.test(dep))      return [`¡${first}! ¡Departamento de Grooming necesita su estrella! ✂️`,`¡El spa canino espera a ${first}! 🐕💆`];
      if (/vet|clínic|salud/i.test(dep))    return [`¡${first}! ¡Clínica veterinaria lista! 🏥`,`¡${first}! El departamento médico te espera 🩺`];
      if (/vent|sales|tienda/i.test(dep))   return [`¡${first}! ¡Ventas al 100 hoy! 📈`,`¡Llega ${first} y el equipo de ventas se activa! 💼`];
      if (/adm|admin|rrhh|recurso|human/i.test(dep)) return [`¡${first}! ¡La columna vertebral de Black Dog! 📋`,`¡${first}! ¡Administración en la house! 📋💼`];
      return [];
    })();

    const general = [`¡${first}! ¡Llegaste! 🐕`,`¡Woof ${first}~! 🐾`,`¡Hola ${first}! ❤️`,`¡${first}! ¡Te vi llegar! 👀`,`¡Llegó ${first}! 🎉`,`¡Qué bueno verte, ${first}! 🐾`,`¡${first}! ¡Presente! ✅`,`¡${first} en la casa! 🏠`,`¡Ey ${first}! ¿Qué hay? 🐾`,`¡${first}! ¡Aquí el perro te saluda! 🐾`,`¡Llegó el/la gran ${first}! 👑`,`${first}: ¡puntualidad nivel élite! ⭐`,`¡${first} nunca falla! 💪`,`${first}: siempre aquí cuando cuenta 🕐`,`${first}: presencia confirmada ✅`,`¡${first} suma otro día! 📅`,`¡Marcación aprobada, ${first}! ✅🐾`,`${first} marcó. ¡El equipo está completo! 🤝`,`¡${first} es Black Dog certified! 🖤🐾`,`Dato: ${first} es de los más cumplidos 📋`,`¡Black Dog reconoce a ${first}! 🐾🖤`,`El perro no miente: ${first} es top 🐕‍🦺`,`Confidencial: ${first} = favorito del perro 🤫`,`${first}: MVP de las marcaciones 🏆`,`Black Dog data: ${first} = confiable 📊`,`${first} llegó y el día mejoró 🌟`,`Estadística oficial: ${first} vale oro 🥇`,`¡Vamo ${first}! Hoy va a ser épico 🔥`,`¡${first}, a darle con todo! 💪`,`${first}: que el día sea tan bueno como tú 🌟`,`¡Ánimo ${first}! El perro cree en ti 🐕`,`${first}: hoy conquistas todo 👊`,`${first}: energía cargada, listo/a para el turno ⚡`];

    const posPool = [...byPosition, ...byDept];
    const pool    = posPool.length > 0 && Math.random() < 0.65 ? posPool : general;
    const msg     = rnd(pool);

    clearActions(); freezeMovement();
    updateState('barking'); spawnHearts(4); showMsgDirect(msg);
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('sitting'); scheduleNext(2000); }
    }, 1500);
    timeoutIdsRef.current.push(id);
  }

  // ── Breed ─────────────────────────────────────────────────────────────
  function applyGenderBreed(gender: 'M' | 'F' | '') {
    if (!gender) return;
    const pool = gender === 'M' ? MALE_BREEDS : FEMALE_BREEDS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    loadBreed(pick);
  }

  async function loadBreed(breed: DogBreed) {
    updateBreed(breed);
    const cfg  = BREEDS[breed];
    const urls = ACTIONS.map(a => {
      let f = STATE_TO_FILE[a.name];
      if (a.name === 'idle' && cfg.idleCase === 'Idle') f = 'Idle';
      return `/assets_dog/Pet Dogs Pack/${cfg.folder}/${cfg.prefix}${f}.png`;
    });
    await Promise.all(urls.map(u => new Promise<void>(r => {
      const img = new Image(); img.onload = img.onerror = () => r(); img.src = u;
    })));
  }

  async function initBreedRotation() {
    if (typeof window === 'undefined') return;
    // If the user pinned a specific breed, skip rotation
    if (forcedBreed) {
      await loadBreed(forcedBreed);
      if (!isDestroyedRef.current) { isReadyRef.current = true; setIsReady(true); }
      return;
    }
    const breedKeys = Object.keys(BREEDS) as DogBreed[];
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(ROTATION_KEY);
      let data: { breed: string; date: string } | null = stored ? JSON.parse(stored) : null;
      if (!data || data.date !== today) {
        const dayNum = Math.floor(Date.now() / 86_400_000);
        const idx    = dayNum % breedKeys.length;
        data = { breed: breedKeys[idx], date: today };
        localStorage.setItem(ROTATION_KEY, JSON.stringify(data));
      }
      await loadBreed((data.breed as DogBreed) || breedKeys[0]);
      if (!isDestroyedRef.current) { isReadyRef.current = true; setIsReady(true); }
    } catch {
      await loadBreed('Dog-1-Golden-Retriever');
      if (!isDestroyedRef.current) { isReadyRef.current = true; setIsReady(true); }
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────
  function onDogMouseDown(event: React.MouseEvent) {
    if (event.button !== 0) return;
    dragStartXRef.current = event.clientX;
    didDragRef.current    = false;

    const moveHandler = (e: MouseEvent) => onDragMove(e);
    const upHandler   = () => onDragUp();
    dragMoveHandlerRef.current = moveHandler;
    dragUpHandlerRef.current   = upHandler;
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup',   upHandler);
  }

  function onDragMove(event: MouseEvent) {
    if (Math.abs(event.clientX - dragStartXRef.current) < 8) return;
    if (!didDragRef.current) {
      didDragRef.current = true;
      updateDragging(true); updateBadMood(true); clearActions();
      const st = currentStateRef.current;
      if (st === 'walking' || st === 'running') freezeMovement();
      updateState('barking'); playSound('growl');
      showMsgDirect(rnd(MSGS['drag']));
    }
    const container = dogContainerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const newX  = Math.max(0, Math.min(event.clientX - cRect.left - DOG_SIZE / 2, containerWidthRef.current - DOG_SIZE));
    updateDuration(0); updatePosition(newX);
  }

  function onDragUp() {
    removeDragListeners();
    if (!didDragRef.current) return;
    updateDragging(false); updateState('barking');
    showMsgDirect(rnd(MSGS['drop'])); playSound('growl');
    const calm = setTimeout(() => {
      if (!isDestroyedRef.current) { updateBadMood(false); showMsgDirect('...ok, ya me calmé 😤'); }
    }, 12_000);
    timeoutIdsRef.current.push(calm);
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(1500); }
    }, 1800);
    timeoutIdsRef.current.push(id);
  }

  function removeDragListeners() {
    if (dragMoveHandlerRef.current) { document.removeEventListener('mousemove', dragMoveHandlerRef.current); dragMoveHandlerRef.current = null; }
    if (dragUpHandlerRef.current)   { document.removeEventListener('mouseup',   dragUpHandlerRef.current);   dragUpHandlerRef.current   = null; }
  }

  // ── Click ─────────────────────────────────────────────────────────────
  function onDogClick() {
    if (didDragRef.current) return;
    if (isSleepingRef.current) { wakeUp(); return; }

    if (badMoodRef.current) {
      clearActions();
      const st = currentStateRef.current;
      if (st === 'walking' || st === 'running') freezeMovement();
      updateState('barking'); playSound('growl');
      showMsgDirect(rnd(MSGS['grumpy_pet']));
      const ig = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(800); } }, 1000);
      timeoutIdsRef.current.push(ig);
      return;
    }

    const now = Date.now();
    if (now - lastClickTimeRef.current < 300 && clickCountRef.current === 1) {
      clickCountRef.current = 0; lastClickTimeRef.current = 0;
      doTrick(); return;
    }
    lastClickTimeRef.current = now;
    clickCountRef.current++;
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
    clickResetTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 700);
    if (clickCountRef.current >= 6) { clickCountRef.current = 0; triggerHyper(); return; }
    if (clickCountRef.current >= 3) { clickCountRef.current = 0; triggerZoomies(); return; }

    clearActions(); setShowTip(false); resetSleepTimer();
    const st = currentStateRef.current;
    if (st === 'walking' || st === 'running') freezeMovement();

    const sounds: ('bark'|'howl'|'sneeze'|'pee'|'growl'|'lick'|'eating'|'panting')[] =
      ['bark','bark','bark','howl','sneeze','pee','growl','lick','eating','panting'];
    playSound(sounds[Math.floor(Math.random() * sounds.length)]);
    spawnHearts(isSexyRef.current ? 8 : 5, isSexyRef.current);
    updateState('barking');
    showStateMessage(isSexyRef.current ? 'sexy' : 'pet');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('sitting'); scheduleNext(2500); }
    }, 1300);
    timeoutIdsRef.current.push(id);
  }

  function doTrick() {
    clearActions();
    const st = currentStateRef.current;
    if (st === 'walking' || st === 'running') freezeMovement();
    const tricks = [
      () => doJump(),
      () => doRoll(),
      () => {
        updateState('stretching'); showMsgDirect('¡Miren este truco! 🐕');
        const id = setTimeout(() => { if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(800); } }, 1800);
        timeoutIdsRef.current.push(id);
      },
      () => doChaseTail(),
    ];
    rnd(tricks)();
    showMsgDirect(rnd(['¡Truco! 🎪', '¡Lo vi en YouTube!', '¡Miren esto!', '¡Shazam! ✨', '¡Black Dog tricks!']));
  }

  // ── React to mouse proximity ──────────────────────────────────────────
  function reactToMouse() {
    if (isDestroyedRef.current || isSleepingRef.current) return;
    const st = currentStateRef.current;
    if (st === 'walking' || st === 'running') return;
    clearActions(); updateState('barking'); showStateMessage('barking');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(800); }
    }, 1200);
    timeoutIdsRef.current.push(id);
  }

  function reactToTyping() {
    if (isDestroyedRef.current || isSleepingRef.current) return;
    const st = currentStateRef.current;
    if (st === 'walking' || st === 'running') return;
    clearActions(); updateState('sitting'); showStateMessage('typing');
    const id = setTimeout(() => {
      if (!isDestroyedRef.current) { updateState('idle'); scheduleNext(1000); }
    }, 2200);
    timeoutIdsRef.current.push(id);
  }

  // ── Effects ───────────────────────────────────────────────────────────

  // Inject keyframes once (play-sprite + paw-fade)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('dog-sprite-kf')) return;
    const s = document.createElement('style');
    s.id = 'dog-sprite-kf';
    s.innerHTML = `
      @keyframes play-sprite { from { background-position-x: 0px; } to { background-position-x: var(--sprite-width); } }
      @keyframes paw-fade { 0% { opacity: 0.6; } 40% { opacity: 0.5; } 100% { opacity: 0; transform: translateY(-4px); } }
    `;
    document.head.appendChild(s);
  }, []);

  // Mount: init breed, start loop, set up ResizeObserver
  useEffect(() => {
    updateMetrics();
    initBreedRotation().then(() => {
      if (!isDestroyedRef.current) {
        updatePosition(100);
        scheduleNext();
        resetSleepTimer();
      }
    });

    if (dogContainerRef.current) {
      resizeObserverRef.current = new ResizeObserver(entries => {
        for (const e of entries) { containerWidthRef.current = e.contentRect.width; clamp(); }
      });
      resizeObserverRef.current.observe(dogContainerRef.current);
    }

    return () => {
      isDestroyedRef.current = true;
      timeoutIdsRef.current.forEach(clearTimeout);
      if (sleepTimerRef.current)      clearTimeout(sleepTimerRef.current);
      if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
      if (chaseTimeoutRef.current)    clearTimeout(chaseTimeoutRef.current);
      if (rafIdRef.current)           cancelAnimationFrame(rafIdRef.current);
      resizeObserverRef.current?.disconnect();
      removeDragListeners();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse move: velocity chase + proximity bark
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!dogWrapperRef.current || !isReadyRef.current) return;

        const now = Date.now();
        const dt  = now - lastMouseTimeRef.current;
        const dx  = Math.abs(event.clientX - lastMouseXRef.current);
        const vel = dt > 20 ? dx / dt * 1000 : 0;
        lastMouseXRef.current    = event.clientX;
        lastMouseYRef.current    = event.clientY;
        lastMouseTimeRef.current = now;

        if (vel > 450 && !isSleepingRef.current && !isHyperRef.current && !isZoomiesRef.current
            && !isDraggingRef.current && !isChasingRef.current && currentStateRef.current !== 'running') {
          startMouseChase(event.clientX);
          return;
        }

        const rect       = dogWrapperRef.current.getBoundingClientRect();
        const dogCenterX = rect.left + rect.width / 2;
        const dist       = Math.abs(event.clientX - dogCenterX);

        if (dist > 70 && currentStateRef.current === 'idle') {
          const newDir = event.clientX > dogCenterX ? 'right' : 'left';
          if (currentDirectionRef.current !== newDir) updateDirection(newDir);
        }

        if (dist < 55 && currentStateRef.current === 'idle') {
          if (now - lastMouseBarkAtRef.current > 8000) {
            lastMouseBarkAtRef.current = now;
            reactToMouse();
          }
        }
      });
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: typing + Konami
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === KONAMI[konamiProgressRef.current]) {
        konamiProgressRef.current++;
        if (konamiProgressRef.current === KONAMI.length) {
          konamiProgressRef.current = 0;
          triggerKonami(); return;
        }
      } else {
        konamiProgressRef.current = 0;
        if (event.key === KONAMI[0]) konamiProgressRef.current = 1;
      }

      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key.length !== 1 && !['Enter', 'Backspace'].includes(event.key)) return;
      keyTypeCountRef.current++;
      const now = Date.now();
      if (keyTypeCountRef.current >= 8 && now - lastKeyReactAtRef.current > 20_000
          && currentStateRef.current === 'idle') {
        lastKeyReactAtRef.current = now;
        keyTypeCountRef.current   = 0;
        reactToTyping();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // selectedName effect (equivalent to Angular's effect() on inputs)
  useEffect(() => {
    if (!selectedName) return;
    applyGenderBreed(selectedGender as 'M' | 'F' | '');
    if (isReadyRef.current) {
      greetByName(selectedName, selectedPosition, selectedDept);
    } else {
      const id = setTimeout(() => {
        if (!isDestroyedRef.current && isReadyRef.current)
          greetByName(selectedName, selectedPosition, selectedDept);
      }, 1200);
      timeoutIdsRef.current.push(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedName, selectedPosition, selectedDept, selectedGender]);

  // ── Render ────────────────────────────────────────────────────────────
  const showTransition = isMoving && !isZoomies && !isSuperman && !isDragging;

  const wrapperClassName = [
    'cursor-pointer pointer-events-auto dog-wrapper',
    isReady    ? 'opacity-100' : 'opacity-0',
    isZoomies  ? 'dog-zoomies'  : '',
    isJumping  ? 'dog-jumping'  : '',
    isSuperman ? 'dog-superman' : '',
    isHyper    ? 'dog-hyper'    : '',
    isSexy     ? 'dog-sexy'     : '',
    isDancing  ? 'dog-dancing'  : '',
    showTransition ? 'transition-transform' : '',
  ].filter(Boolean).join(' ');

  const containerStyle: React.CSSProperties = inline
    ? { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }
    : { position: 'fixed', bottom: 0, left: 0, width: '100%', height: 0, pointerEvents: 'none', zIndex };

  return (
    <div
      ref={dogContainerRef}
      className={inline ? undefined : 'dog-animation-root'}
      style={containerStyle}
    >
      <div
        ref={dogWrapperRef}
        className={wrapperClassName}
        style={{
          position: 'absolute',
          bottom: inline ? '0' : '-28px',
          width: `${DOG_SIZE}px`,
          transform: `translateX(${currentPixelPosition}px)`,
          transitionDuration:       showTransition ? `${moveDuration}s`  : undefined,
          transitionTimingFunction: showTransition ? 'ease-in-out'        : undefined,
        }}
        onMouseDown={onDogMouseDown}
        onClick={onDogClick}
      >
        {showTip && (
          <div className={[
            'dog-bubble',
            inline                ? 'dog-bubble--below'  : '',
            isSleepState          ? 'dog-bubble--sleep'   : '',
            isZoomies || isHyper  ? 'dog-bubble--zoomies' : '',
            badMood               ? 'dog-bubble--grumpy'  : '',
            isSexy                ? 'dog-bubble--sexy'    : '',
          ].filter(Boolean).join(' ')}>
            {currentTip}
          </div>
        )}

        <div className="dog-shadow" />

        <div
          key={currentState}
          className="dog-sprite"
          style={{
            ...dogStyle,
            transform: currentDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            filter:    spriteFilter || undefined,
          }}
        />
      </div>
    </div>
  );
}
