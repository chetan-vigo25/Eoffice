import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../Redux/Reducer/Auth/Auth.reducers';
import BASE_URL from '../Urls/DomainUrl';
import { resetTo } from '../Utils/navigationRef';

const SOCKET_URL = 'https://api.vieasyoffice.com';
// How often the session is re-validated while the app is in the foreground.
const SESSION_CHECK_MS = 60 * 1000;

// Two independent ways of noticing that this account signed in somewhere else:
//
// 1. The server pushes "force_logout" on a socket keyed by userId. Instant, but
//    it only works if the backend actually emits it.
// 2. A polled /client/auth/profile call. Slower, but it catches the case where
//    the backend just invalidates the old token and pushes nothing.
//
// The listener used to live inside Splash, which meant it only existed for a
// session that had just typed its credentials — after an app restart Autologin
// resets straight to ClientDash and Splash never mounts, so nothing was ever
// listening. Both checks are mounted app-wide instead.
const readClientId = async () => {
  try {
    const [token, userJson] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('user'),
    ]);
    if (!token || !userJson) return null;
    const stored = JSON.parse(userJson);
    return stored?._id || stored?.id || null;
  } catch (error) {
    console.log('[session] could not read stored session:', error?.message);
    return null;
  }
};

export default function ForceLogoutProvider({ children }) {
  const dispatch = useDispatch();
  // Login/logout both move this, which is the cue to re-read storage.
  const authUser = useSelector((state) => state.authentication?.user);
  const [clientId, setClientId] = useState(null);
  const clientIdRef = useRef(null);
  const endingRef = useRef(false);

  const endSession = useCallback(async (reason) => {
    if (endingRef.current) return;
    endingRef.current = true;
    console.log('[session] ending session:', reason);

    clientIdRef.current = null;
    setClientId(null);
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (error) {
      console.log('[session] could not clear session:', error?.message);
    }
    dispatch(logout());
    resetTo('Splash');
    // Let the reset settle before another check is allowed to fire.
    setTimeout(() => { endingRef.current = false; }, 1500);
  }, [dispatch]);

  // ── Keep clientId in sync with whatever session is actually stored ──────────
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const id = await readClientId();
      if (cancelled || id === clientIdRef.current) return;
      clientIdRef.current = id;
      setClientId(id);
    };

    sync();
    // Storage can change while the app is backgrounded (a logout elsewhere in
    // the app, a killed-and-relaunched session), so re-check on every foreground.
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') sync();
    });

    return () => {
      cancelled = true;
      appStateSub.remove();
    };
  }, [authUser]);

  // ── 1. Instant path: server push ───────────────────────────────────────────
  useEffect(() => {
    if (!clientId) return undefined;

    const socket = io(`${SOCKET_URL}?userId=${clientId}`, {
      // Must NOT be locked to ['websocket']: the API sits behind Cloudflare and
      // the raw wss upgrade fails on iOS ("websocket error" on every attempt),
      // which left iOS with no listener at all. Starting on HTTP long-polling
      // always connects; engine.io then upgrades to websocket where it can
      // (Android does), and simply stays on polling where it can't.
      transports: ['polling', 'websocket'],
      reconnection: true,
      // The old listener gave up after 5 attempts, so one flaky patch of network
      // silently disabled force-logout for the rest of the session.
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socket.on('connect', () => {
      console.log(
        '[session] socket connected, userId =', clientId,
        'sid =', socket.id,
        'transport =', socket.io?.engine?.transport?.name,
      );
      socket.io?.engine?.on('upgrade', (t) => {
        console.log('[session] socket upgraded to', t?.name);
      });
    });
    socket.on('connect_error', (error) => {
      console.log('[session] socket connect error:', error?.message);
    });
    socket.on('disconnect', (reason) => {
      console.log('[session] socket disconnected:', reason);
    });

    // Temporary diagnostic: shows every event the backend sends on this socket,
    // so a renamed or missing force_logout is visible in the Metro logs.
    if (__DEV__ && typeof socket.onAny === 'function') {
      socket.onAny((event, ...args) => {
        console.log('[session] socket event:', event, JSON.stringify(args)?.slice(0, 300));
      });
    }

    socket.on('force_logout', (data) => {
      console.log('[session] received force_logout', data);
      socket.io.opts.reconnection = false;
      socket.disconnect();
      endSession('force_logout from server');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [clientId, endSession]);

  // ── 2. Fallback path: is this token still accepted? ────────────────────────
  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    const checkSession = async () => {
      if (cancelled || endingRef.current) return;
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${BASE_URL}/client/auth/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (cancelled) return;
        if (res.status === 401) {
          endSession('profile check returned 401');
        }
      } catch (error) {
        // Offline or server hiccup — never sign the user out over that.
        console.log('[session] session check skipped:', error?.message);
      }
    };

    const interval = setInterval(checkSession, SESSION_CHECK_MS);
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') checkSession();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [clientId, endSession]);

  return <>{children}</>;
}
