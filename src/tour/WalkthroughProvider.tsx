import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type DriveStep, type Driver } from 'driver.js';
import { useAuth } from '../contexts/AuthContext';
import { isProfileSetupComplete } from '../utils/profileSetup';
import { getWalkthroughSteps, type WalkthroughStep } from './walkthrough';

type WalkthroughContextValue = {
  start: () => void;
  reset: () => void;
};

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

function storageKey(userId: string, role: string) {
  return `maia:walkthrough:v1:${userId}:${role}`;
}

async function waitForElement(selector: string, timeoutMs = 8000): Promise<Element | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

function toDriveSteps(steps: WalkthroughStep[]): DriveStep[] {
  return steps.map((s) => ({
    element: s.selector,
    popover: {
      title: s.title,
      description: typeof s.description === 'string' ? s.description : String(s.description),
      side: s.side ?? 'right',
      align: 'start' as const,
    },
  }));
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const drvRef = useRef<Driver | null>(null);
  const stepsRef = useRef<WalkthroughStep[]>([]);
  const navigateRef = useRef(navigate);

  navigateRef.current = navigate;

  const destroy = useCallback(() => {
    drvRef.current?.destroy();
    drvRef.current = null;
    stepsRef.current = [];
  }, []);

  const markDone = useCallback(() => {
    if (!user?.id || !user.role) return;
    localStorage.setItem(storageKey(user.id, user.role), 'done');
  }, [user?.id, user?.role]);

  const prepareStepRoute = useCallback(async (index: number, timeoutMs = 5000) => {
    const step = stepsRef.current[index];
    if (!step) return false;
    if (window.location.pathname !== step.route) {
      navigateRef.current(step.route);
      let waited = 0;
      while (window.location.pathname !== step.route && waited < 4000) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
        waited += 50;
      }
    }
    const el = await waitForElement(step.selector, timeoutMs);
    return el !== null;
  }, []);

  const goToNextAvailable = useCallback(
    async (d: Driver, startIndex: number) => {
      for (let i = startIndex; i < stepsRef.current.length; i += 1) {
        const timeoutMs = i === startIndex ? 5000 : 2500;
        // eslint-disable-next-line no-await-in-loop
        const ok = await prepareStepRoute(i, timeoutMs);
        if (ok) {
          d.moveTo(i);
          return;
        }
      }
      markDone();
      d.destroy();
    },
    [prepareStepRoute, markDone],
  );

  const start = useCallback(async () => {
    if (!user?.id || !user.role) return;

    destroy();

    const walkSteps = getWalkthroughSteps(
      user.role,
      (user as { isAdministrator?: boolean }).isAdministrator,
    );
    stepsRef.current = walkSteps;

    const ready = await prepareStepRoute(0);
    if (!ready) {
      return;
    }

    const drv = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      allowClose: true,
      overlayOpacity: 0.55,
      overlayClickBehavior: 'nextStep',
      stagePadding: 8,
      stageRadius: 12,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      steps: toDriveSteps(walkSteps),
      onNextClick: (_element, _step, { driver: d }) => {
        const current = d.getActiveIndex() ?? 0;
        if (d.isLastStep()) {
          markDone();
          d.destroy();
          return;
        }
        const nextIndex = current + 1;
        void goToNextAvailable(d, nextIndex);
      },
      onPrevClick: (_element, _step, { driver: d }) => {
        const current = d.getActiveIndex() ?? 0;
        const prevIndex = current - 1;
        if (prevIndex < 0) return;
        void prepareStepRoute(prevIndex).then((ok) => {
          if (ok) d.movePrevious();
        });
      },
      onCloseClick: () => {
        destroy();
      },
      onDestroyed: () => {
        drvRef.current = null;
        stepsRef.current = [];
      },
    });

    drvRef.current = drv;
    drv.drive(0);
  }, [user, destroy, markDone, prepareStepRoute, goToNextAvailable]);

  const reset = useCallback(() => {
    if (!user?.id || !user.role) return;
    localStorage.removeItem(storageKey(user.id, user.role));
  }, [user?.id, user?.role]);

  const value = useMemo<WalkthroughContextValue>(
    () => ({ start: () => void start(), reset }),
    [start, reset],
  );

  return <WalkthroughContext.Provider value={value}>{children}</WalkthroughContext.Provider>;
}

export function useWalkthrough(): WalkthroughContextValue {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) throw new Error('useWalkthrough must be used within WalkthroughProvider');
  return ctx;
}

export function useWalkthroughOptional(): WalkthroughContextValue | null {
  return useContext(WalkthroughContext);
}

export function useShouldAutoStartWalkthrough(): boolean {
  const { user } = useAuth();
  if (!user?.id || !user.role) return false;
  if (!isProfileSetupComplete(user)) return false;
  return localStorage.getItem(storageKey(user.id, user.role)) !== 'done';
}
