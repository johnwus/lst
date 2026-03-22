import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, endpoints } from '../lib/api';

// Query Keys
export const queryKeys = {
  // Auth
  me: ['me'],
  
  // Topics
  topics: (params) => ['topics', params],
  topic: (id) => ['topic', id],
  trendingTopics: ['trendingTopics'],
  topicParticipants: (id) => ['topicParticipants', id],
  
  // Messages
  globalMessages: ['globalMessages'],
  globalStats: ['globalStats'],
  topicMessages: (topicId) => ['topicMessages', topicId],
  threadMessages: (messageId) => ['threadMessages', messageId],
  miniRoomMessages: (messageId) => ['miniRoomMessages', messageId],
  miniRoomStats: (messageId) => ['miniRoomStats', messageId],
  userThreads: (userId) => ['userThreads', userId],
  searchMessages: (topicId, query) => ['searchMessages', topicId, query],
  
  // Notifications
  notifications: ['notifications'],
  unreadCount: ['notifications', 'unreadCount'],
  
  // Users
  userSearch: (query) => ['userSearch', query],
};

// Auth Queries
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get('/auth/me'),
    staleTime: Infinity, // User data doesn't change often
    retry: false,
  });
}

// Topic Queries
export function useTopics(params = {}) {
  return useQuery({
    queryKey: queryKeys.topics(params),
    queryFn: () => api.get(`/topics?${new URLSearchParams(params).toString()}`),
    staleTime: 2 * 60 * 1000,      // 2 min — serve cache on re-navigate
    gcTime: 10 * 60 * 1000,        // keep in memory for 10 min
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // show previous category instantly while new one loads
  });
}

export function useTopic(topicId) {
  return useQuery({
    queryKey: queryKeys.topic(topicId),
    queryFn: () => api.get(`/topics/${topicId}`),
    enabled: !!topicId,
    staleTime: 60 * 1000,          // 1 min
    gcTime: 10 * 60 * 1000,
  });
}

export function useTrendingTopics() {
  return useQuery({
    queryKey: queryKeys.trendingTopics,
    queryFn: () => api.get('/topics/trending'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGlobalTopic() {
  return useQuery({
    queryKey: ['globalTopic'],
    queryFn: () => api.get('/topics/global'),
    staleTime: 30000, // 30 seconds
  });
}

export function useTopicParticipants(topicId) {
  return useQuery({
    queryKey: queryKeys.topicParticipants(topicId),
    queryFn: () => api.get(`/topics/${topicId}/participants`),
    enabled: !!topicId,
  });
}

// Message Queries
export function useGlobalMessages() {
  return useQuery({
    queryKey: queryKeys.globalMessages,
    queryFn: () => api.get('/messages/global'),
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });
}

export function useGlobalStats() {
  return useQuery({
    queryKey: queryKeys.globalStats,
    queryFn: () => api.get('/messages/global/stats'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTopicMessages(topicId) {
  return useInfiniteQuery({
    queryKey: queryKeys.topicMessages(topicId),
    queryFn: ({ pageParam }) => {
      const url = pageParam ? `/messages/topic/${topicId}?before=${pageParam}` : `/messages/topic/${topicId}`;
      return api.get(url);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 50) return undefined;
      return lastPage[0].createdAt;
    },
    initialPageParam: null,
    enabled: !!topicId,
    staleTime: 15 * 1000,          // 15s — socket keeps it fresh anyway
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useThreadMessages(messageId) {
  return useQuery({
    queryKey: queryKeys.threadMessages(messageId),
    queryFn: () => api.get(`/messages/thread/${messageId}`),
    enabled: !!messageId,
  });
}

export function useThreadParticipants(messageId) {
  return useQuery({
    queryKey: ['threadParticipants', messageId],
    queryFn: () => api.get(`/messages/thread/${messageId}/participants`),
    enabled: !!messageId,
  });
}

export function useMiniRoomMessages(messageId) {
  return useInfiniteQuery({
    queryKey: queryKeys.miniRoomMessages(messageId),
    queryFn: ({ pageParam }) => {
      const url = pageParam ? `/messages/mini-room/${messageId}?before=${pageParam}` : `/messages/mini-room/${messageId}`;
      return api.get(url);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.messages || lastPage.messages.length < 50) return undefined;
      return lastPage.messages[0].createdAt;
    },
    initialPageParam: null,
    enabled: !!messageId,
  });
}

export function useMiniRoomStats(messageId) {
  return useQuery({
    queryKey: queryKeys.miniRoomStats(messageId),
    queryFn: () => api.get(`/messages/mini-room/${messageId}/stats`),
    enabled: !!messageId,
    refetchInterval: 30000,
  });
}

export function useMiniRoomParticipants(messageId) {
  return useQuery({
    queryKey: ['miniRoomParticipants', messageId],
    queryFn: () => api.get(`/messages/mini-room/${messageId}/participants`),
    enabled: !!messageId,
  });
}

export function useUserThreads(userId) {
  return useQuery({
    queryKey: queryKeys.userThreads(userId),
    queryFn: () => api.get(`/messages/user-threads/${userId}`),
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useMessage(messageId, options = {}) {
  return useQuery({
    queryKey: ['message', messageId],
    queryFn: () => api.get(`/messages/${messageId}`),
    enabled: !!messageId && options.enabled !== false,
    ...options,
  });
}

export function useSearchMessages(topicId, query) {
  return useQuery({
    queryKey: queryKeys.searchMessages(topicId, query),
    queryFn: () => api.get(`/messages/topic/${topicId}/search?q=${encodeURIComponent(query)}`),
    enabled: !!topicId && !!query && query.trim().length > 0,
    staleTime: 5000, // 5 seconds
  });
}

// Notification Queries
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.get('/notifications'),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 60000, // Check every minute
  });
}

// User Queries
export function useUserSearch(query) {
  return useQuery({
    queryKey: queryKeys.userSearch(query),
    queryFn: () => api.get(`/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => api.get(`/users/${userId}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,     // 5 min — profile data rarely changes
    gcTime: 15 * 60 * 1000,
  });
}

export function useFollowingStatus(userId, options = {}) {
  return useQuery({
    queryKey: ['followingStatus', userId],
    queryFn: () => api.get(`/users/${userId}/following-status`),
    enabled: !!userId && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.post(`/users/${userId}/follow`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followingStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// Mutations
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/messages', data),
    // No optimistic update; rely solely on socket event for UI update
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, content }) => api.patch(`/messages/${id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalMessages'] });
      queryClient.invalidateQueries({ queryKey: ['topicMessages'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalMessages'] });
      queryClient.invalidateQueries({ queryKey: ['topicMessages'] });
    },
  });
}

export function useReactMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, type }) => api.post(`/messages/${id}/react`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalMessages'] });
      queryClient.invalidateQueries({ queryKey: ['topicMessages'] });
    },
  });
}

export function useReportMessage() {
  return useMutation({
    mutationFn: ({ id, reason }) => api.post(`/messages/${id}/report`, { reason }),
  });
}

export function useSendThreadMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threadMessages });
      queryClient.invalidateQueries({ queryKey: queryKeys.miniRoomMessages });
    },
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/topics', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.trendingTopics });
    },
  });
}

export function useJoinTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (topicId) => api.post(`/topics/${topicId}/join`, {}),
    onSuccess: (_, topicId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topic(topicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.topicParticipants(topicId) });
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.delete('/notifications'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.put('/auth/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useSearchUsers() {
  return useMutation({
    mutationFn: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  });
}
