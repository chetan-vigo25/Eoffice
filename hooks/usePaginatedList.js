import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PAGE_SIZE = 20;

/**
 * Reusable hook for client-side infinite scroll.
 * Fetches ALL data from API once, then slices it for smooth FlatList display.
 *
 * @param {Object} options
 * @param {string} options.url          - Full API endpoint URL
 * @param {Function} options.buildBody  - () => request body object
 * @param {Function} options.extractDocs - (result) => array of items from response
 * @param {Function} [options.onUnauthorized] - Called on 401 response
 * @param {number} [options.pageSize]   - Items to show per "page" (default 20)
 */
export default function usePaginatedList({
  url,
  buildBody,
  extractDocs,
  onUnauthorized,
  pageSize = PAGE_SIZE,
}) {
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Store the full dataset from API
  const allDataRef = useRef([]);
  const displayCountRef = useRef(0);
  const loadingRef = useRef(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(!isRefresh);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        onUnauthorized?.();
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append('Authorization', 'Bearer ' + token);
      myHeaders.append('Content-Type', 'application/json');

      const body = buildBody();

      const response = await fetch(url, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(body),
        redirect: 'follow',
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        const docs = extractDocs(result) || [];
        allDataRef.current = docs;

        // Show first page
        const firstSlice = docs.slice(0, pageSize);
        displayCountRef.current = firstSlice.length;
        setDisplayData(firstSlice);
        setHasMore(docs.length > pageSize);
      } else if (result.statusCode === 401) {
        onUnauthorized?.();
      } else {
        setError(result.message || 'Something went wrong');
        allDataRef.current = [];
        setDisplayData([]);
        setHasMore(false);
      }
    } catch (err) {
      setError(err.message || 'Network error');
      allDataRef.current = [];
      setDisplayData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [url, buildBody, extractDocs, onUnauthorized, pageSize]);

  /** Call on initial load / filter apply */
  const loadFirst = useCallback(() => {
    fetchAll(false);
  }, [fetchAll]);

  /** Call from FlatList onEndReached — slices more from allDataRef */
  const loadMore = useCallback(() => {
    const allData = allDataRef.current;
    const currentCount = displayCountRef.current;

    if (currentCount >= allData.length) return;

    const nextSlice = allData.slice(0, currentCount + pageSize);
    displayCountRef.current = nextSlice.length;
    setDisplayData(nextSlice);
    setHasMore(nextSlice.length < allData.length);
  }, [pageSize]);

  /** Call from RefreshControl onRefresh */
  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchAll(true);
  }, [fetchAll]);

  /** Get full data (for client-side search) */
  const getAllData = useCallback(() => allDataRef.current, []);

  return {
    data: displayData,
    allData: getAllData,
    loading,
    refreshing,
    error,
    hasMore,
    loadFirst,
    loadMore,
    refresh,
  };
}
