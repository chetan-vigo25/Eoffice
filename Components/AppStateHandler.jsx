import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useContacts } from '../Context/Contact'; // Adjust the import path as necessary

const AppStateHandler = () => {
  const { checkPermissionAndFetch } = useContacts();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[App Resumed] Checking contact permissions...');
        checkPermissionAndFetch();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null; // No UI
};

export default AppStateHandler;
