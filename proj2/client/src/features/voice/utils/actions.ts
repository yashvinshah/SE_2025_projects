export type VoiceActionId = 'logout' | 'openProfile' | 'goHome' | 'openCart';

export interface VoiceAction {
  id: VoiceActionId;
  description: string;
}

export const ACTIONS: VoiceAction[] = [
  { id: 'logout', description: 'Log the user out' },
  { id: 'openProfile', description: 'Open the profile page' },
  { id: 'goHome', description: 'Go to the home screen' },
  { id: 'openCart', description: 'Open the cart page' },
  // calculate the total price of items in the cart
];

export const ACTION_LIST_STRING = ACTIONS.map((action) => action.id).join(', ');

export function getActionById(actionId: string): VoiceAction | undefined {
  return ACTIONS.find((action) => action.id === actionId);
}
