import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccessPass, FeedState, Group, Post, Reaction, ReactionType, User, ViewRecord } from './types';
import { uid, inviteCode } from './lib/id';
import { HOUR, isActive, now } from './lib/time';
import { lifeImage } from './lib/images';
import { PASS_HOURS, POST_TTL_HOURS, REACTIONS } from './copy';
import { DEFAULT_GROUP_NAME, makeFriendPosts, makeMockFriends } from './seed';

const AVATAR_EMOJIS = ['🟡', '🌿', '🪟', '🍵', '🛏️', '🥡', '🧦', '🌙'];
const AVATAR_COLORS = ['#DFFF2F', '#7FB3FF', '#FFB37F', '#C79BFF', '#7FE0C0', '#FF9BB3'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface PersistedState {
  onboarded: boolean;
  currentUserId: string | null;
  users: User[];
  group: Group | null;
  posts: Post[];
  views: ViewRecord[];
  reactions: Reaction[];
  feedStates: FeedState[];
  accessPass: AccessPass | null;
}

interface Actions {
  completeOnboarding: (displayName: string) => void;
  createGroup: (name: string) => void;
  joinGroup: (code: string) => void;
  leaveGroup: () => void;
  addPost: (imageUrl: string) => string;
  markViewed: (postId: string) => void;
  reactToPost: (postId: string, type: ReactionType) => void;
  skipPost: (postId: string) => void;
  refreshFriendPostsIfStale: () => void;
  resetDemo: () => void;
}

export type Store = PersistedState & Actions;

const initial: PersistedState = {
  onboarded: false,
  currentUserId: null,
  users: [],
  group: null,
  posts: [],
  views: [],
  reactions: [],
  feedStates: [],
  accessPass: null,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // 自分の投稿に対して、モック友達が少し遅れて足跡＆リアクションを残す。
      // 「12人が見た / 5人が反応した」の体験を実際に再現するための演出。
      function scheduleEngagement(postId: string) {
        const friends = get().users.filter((u) => u.isMock);
        const shuffled = [...friends].sort(() => Math.random() - 0.5);
        shuffled.forEach((f, i) => {
          const delay = 800 + i * 700 + Math.random() * 500;
          setTimeout(() => {
            const s = get();
            if (!s.posts.some((p) => p.id === postId)) return; // 投稿が消えていたら何もしない
            // 足跡（重複しない）
            if (!s.views.some((v) => v.postId === postId && v.viewerId === f.id)) {
              set((st) => ({
                views: [
                  ...st.views,
                  { id: uid('v_'), postId, viewerId: f.id, viewedAt: now() },
                ],
              }));
            }
            // 6割くらいの確率で反応
            if (Math.random() < 0.6) {
              const type = pick(REACTIONS).type;
              set((st) => ({
                reactions: [
                  ...st.reactions.filter((r) => !(r.postId === postId && r.userId === f.id)),
                  { id: uid('r_'), postId, userId: f.id, type, createdAt: now() },
                ],
              }));
            }
          }, delay);
        });
      }

      function seedGroup(name: string, code?: string) {
        const me = get().currentUserId;
        const friends = makeMockFriends();
        const groupId = uid('g_');
        const group: Group = {
          id: groupId,
          name: name.trim() || DEFAULT_GROUP_NAME,
          inviteCode: code?.trim().toUpperCase() || inviteCode(),
          memberIds: [...(me ? [me] : []), ...friends.map((f) => f.id)],
          createdAt: now(),
        };
        const friendPosts = makeFriendPosts(friends, groupId);
        set((st) => ({
          users: [...st.users.filter((u) => !u.isMock), ...friends],
          group,
          posts: [...st.posts.filter((p) => p.groupId !== groupId), ...friendPosts],
        }));
      }

      return {
        ...initial,

        completeOnboarding: (displayName) => {
          const id = uid('u_');
          const user: User = {
            id,
            displayName: displayName.trim() || 'なまえ',
            avatarEmoji: pick(AVATAR_EMOJIS),
            avatarColor: pick(AVATAR_COLORS),
            createdAt: now(),
          };
          set((st) => ({
            onboarded: true,
            currentUserId: id,
            users: [...st.users.filter((u) => u.id !== id), user],
          }));
        },

        createGroup: (name) => seedGroup(name),

        // モック先行のため、参加もデモグループ生成と同じ扱い（コードだけ引き継ぐ）。
        joinGroup: (code) => seedGroup(DEFAULT_GROUP_NAME, code),

        leaveGroup: () => {
          set({
            group: null,
            posts: [],
            views: [],
            reactions: [],
            feedStates: [],
            accessPass: null,
            users: get().users.filter((u) => !u.isMock),
          });
        },

        addPost: (imageUrl) => {
          const { currentUserId, group } = get();
          if (!currentUserId || !group) return '';
          const createdAt = now();
          const post: Post = {
            id: uid('p_'),
            userId: currentUserId,
            groupId: group.id,
            imageUrl,
            createdAt,
            expiresAt: createdAt + POST_TTL_HOURS * HOUR,
          };
          const pass: AccessPass = {
            openedAt: createdAt,
            expiresAt: createdAt + PASS_HOURS * HOUR,
          };
          set((st) => ({ posts: [...st.posts, post], accessPass: pass }));
          scheduleEngagement(post.id);
          return post.id;
        },

        markViewed: (postId) => {
          const { currentUserId, views } = get();
          if (!currentUserId) return;
          if (views.some((v) => v.postId === postId && v.viewerId === currentUserId)) return;
          set((st) => ({
            views: [
              ...st.views,
              { id: uid('v_'), postId, viewerId: currentUserId, viewedAt: now() },
            ],
          }));
        },

        reactToPost: (postId, type) => {
          const { currentUserId } = get();
          if (!currentUserId) return;
          set((st) => ({
            reactions: [
              ...st.reactions.filter((r) => !(r.postId === postId && r.userId === currentUserId)),
              { id: uid('r_'), postId, userId: currentUserId, type, createdAt: now() },
            ],
            feedStates: [
              ...st.feedStates.filter((f) => f.postId !== postId),
              { postId, status: 'reacted', updatedAt: now() },
            ],
          }));
        },

        skipPost: (postId) => {
          set((st) => ({
            feedStates: [
              ...st.feedStates.filter((f) => f.postId !== postId),
              { postId, status: 'skipped', updatedAt: now() },
            ],
          }));
        },

        // デモが古くなって友達の投稿が全部期限切れなら、新しい時刻で再生成する。
        refreshFriendPostsIfStale: () => {
          const { group, posts, currentUserId } = get();
          if (!group) return;
          const activeFriendPosts = posts.filter(
            (p) => p.userId !== currentUserId && isActive(p.expiresAt)
          );
          if (activeFriendPosts.length > 0) return;
          const friends = get().users.filter((u) => u.isMock);
          if (friends.length === 0) return;
          const fresh = makeFriendPosts(friends, group.id);
          const freshIds = new Set(fresh.map((p) => p.id));
          set((st) => ({
            posts: [...st.posts.filter((p) => p.userId === currentUserId), ...fresh],
            // 再生成した投稿は未閲覧に戻す
            feedStates: st.feedStates.filter((f) => !freshIds.has(f.postId)),
          }));
        },

        resetDemo: () => {
          set({ ...initial });
        },
      };
    },
    {
      name: 'napsnap-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        onboarded: s.onboarded,
        currentUserId: s.currentUserId,
        users: s.users,
        group: s.group,
        posts: s.posts,
        views: s.views,
        reactions: s.reactions,
        feedStates: s.feedStates,
        accessPass: s.accessPass,
      }),
    }
  )
);
