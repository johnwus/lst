import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { useThreadContext } from '../context/ThreadContext';

/**
 * useThreadPanelState — owns ThreadContext read/write for desktop expand/collapse.
 *
 * Used ONLY by ThreadPanel (save on expand) and ThreadRoom (restore on mount, collapse).
 * Never used by TopicRoom.
 */
export function useThreadPanelState() {
  const { panelState, setPanelState, clearPanelState } = useThreadContext();
  const [, setLocation] = useLocation();

  /**
   * Called by ThreadPanel before navigating to /thread/:id.
   */
  const saveForExpand = useCallback(
    ({ threadId, replyTo, parentMessage, scrollTop }) => {
      setPanelState({
        threadId,
        replyTo: replyTo ?? null,
        parentMessage: parentMessage ?? null,
        scrollTop: scrollTop ?? 0,
      });
    },
    [setPanelState]
  );

  /**
   * Called by ThreadRoom on mount (desktop).
   * Returns the restored state if context matches, then clears.
   * Returns null if no matching context.
   */
  const restoreFromContext = useCallback(
    (threadId) => {
      if (!panelState.threadId || panelState.threadId !== threadId) return null;
      return { ...panelState };
    },
    [panelState]
  );

  /**
   * Called by ThreadRoom's collapse button (desktop).
   * Saves current scroll + replyTo, then navigates back.
   * TopicRoom's `thread` state is still set → ThreadPanel re-mounts automatically.
   */
  const collapseToPanel = useCallback(
    ({ threadId, replyTo, parentMessage, scrollTop, topicId }) => {
      setPanelState({
        threadId,
        replyTo: replyTo ?? null,
        parentMessage: parentMessage ?? null,
        scrollTop: scrollTop ?? 0,
      });
      if (topicId) {
        // Use replace to avoid pushing a new history state when collapsing on desktop/tablet
        setLocation(`/topic/${topicId}`, { replace: true });
      } else {
        setLocation('/explore', { replace: true });
      }
    },
    [setPanelState, setLocation]
  );

  return { saveForExpand, restoreFromContext, collapseToPanel, panelState, clearPanelState };
}
