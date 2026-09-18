import { createNavigationContainerRef } from '@react-navigation/native';

// Lets code that lives outside a screen (providers, sockets, API layers) drive
// navigation — e.g. the force-logout listener, which is mounted app-wide.
export const navigationRef = createNavigationContainerRef();

export function resetTo(routeName, params) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: routeName, params }] });
  }
}
