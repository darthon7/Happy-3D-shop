import { useEffect, useRef, useCallback, useState } from "react";
import useAuthStore from "../stores/authStore";
import { forceLogout } from "../utils/sessionManager";
import { getInactivityTimeout, WARNING_TIME, isTokenExpired } from "../lib/utils";

const ACTIVITY_THROTTLE = 500;
const CHANNEL_NAME = "inactivity-timeout-channel";

const MIN_TIMEOUT = 60 * 1000;
const CHANNEL_NAME_REFRESH = "token-refresh-channel";

const useInactivityTimeout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const isAuthRef = useRef(isAuthenticated);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const channelRef = useRef(null);
  const lastActivityRef = useRef(null);
  const currentTimeoutRef = useRef(null);
  const currentWarningTimeRef = useRef(null);

  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const clearAllTimers = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningTimeoutRef.current);
    clearInterval(countdownRef.current);
    timeoutRef.current = null;
    warningTimeoutRef.current = null;
    countdownRef.current = null;
  }, []);

  const getDynamicTimeout = useCallback(() => {
    const timeout = getInactivityTimeout();
    if (!timeout || timeout < MIN_TIMEOUT) {
      return timeout;
    }
    return timeout;
  }, []);

  const getDynamicWarningTime = useCallback(() => {
    const timeout = getDynamicTimeout();
    if (!timeout) return WARNING_TIME;
    return Math.min(WARNING_TIME, timeout / 4);
  }, [getDynamicTimeout]);

  const resetTimersInternal = useCallback(() => {
    if (!isAuthRef.current) return;

    const dynamicTimeout = getDynamicTimeout();
    const dynamicWarningTime = getDynamicWarningTime();

    if (!dynamicTimeout) {
      if (isTokenExpired(localStorage.getItem("accessToken"))) {
        forceLogout();
        return;
      }
      return;
    }

    currentTimeoutRef.current = dynamicTimeout;
    currentWarningTimeRef.current = dynamicWarningTime;

    clearAllTimers();
    setShowWarning(false);
    setRemainingTime(dynamicTimeout);

    warningTimeoutRef.current = setTimeout(() => {
      if (!isAuthRef.current) return;
      setShowWarning(true);
      let secondsLeft = Math.floor(dynamicWarningTime / 1000);
      setRemainingTime(dynamicWarningTime);

      countdownRef.current = setInterval(() => {
        secondsLeft -= 1;
        setRemainingTime(secondsLeft * 1000);
        if (secondsLeft <= 0) clearInterval(countdownRef.current);
      }, 1000);
    }, dynamicTimeout - dynamicWarningTime);

    timeoutRef.current = setTimeout(() => {
      if (!isAuthRef.current) return;
      channelRef.current?.postMessage({ type: "logout" });
      forceLogout();
    }, dynamicTimeout);
  }, [clearAllTimers, getDynamicTimeout, getDynamicWarningTime]);

  const handleActivity = useCallback(() => {
    if (!isAuthRef.current) return;
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE) return;
    lastActivityRef.current = now;

    resetTimersInternal();
    channelRef.current?.postMessage({ type: "activity" });
  }, [resetTimersInternal]);

  const extendSession = useCallback(() => {
    resetTimersInternal();
    channelRef.current?.postMessage({ type: "activity" });
  }, [resetTimersInternal]);

  const logout = useCallback(() => {
    clearAllTimers();
    channelRef.current?.postMessage({ type: "logout" });
    forceLogout();
  }, [clearAllTimers]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setShowWarning(false);
      channelRef.current?.close();
      channelRef.current = null;
      return;
    }

    lastActivityRef.current = Date.now();
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current.onmessage = (event) => {
      if (event.data.type === "activity") {
        resetTimersInternal();
      } else if (event.data.type === "logout") {
        clearAllTimers();
        forceLogout();
      }
    };

    const tokenRefreshChannel = new BroadcastChannel(CHANNEL_NAME_REFRESH);
    tokenRefreshChannel.onmessage = (event) => {
      if (event.data.type === "tokenRefreshed") {
        resetTimersInternal();
      }
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    activityEvents.forEach((ev) =>
      window.addEventListener(ev, handleActivity, { passive: true }),
    );

    resetTimersInternal();

    return () => {
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, handleActivity),
      );
      clearAllTimers();
      channelRef.current?.close();
      tokenRefreshChannel.close();
      channelRef.current = null;
    };
  }, [isAuthenticated, clearAllTimers, resetTimersInternal, handleActivity]);

  return { showWarning, remainingTime, extendSession, logout, isAuthenticated };
};

export default useInactivityTimeout;
