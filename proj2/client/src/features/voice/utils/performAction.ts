import { VoiceActionId } from './actions';

interface PerformActionDeps {
  logout: () => void;
  openProfile: () => void;
  goHome: () => void;
  openCart: () => void;
}

export function performAction(actionId: VoiceActionId, deps: PerformActionDeps) {
  switch (actionId) {
    case 'logout':
      deps.logout();
      break;
    case 'openProfile':
      deps.openProfile();
      break;
    case 'goHome':
      deps.goHome();
      break;
    case 'openCart':
      deps.openCart();
      break;
    default: {
      const exhaustiveCheck: never = actionId;
      throw new Error(`Unsupported action: ${exhaustiveCheck}`);
    }
  }
}
