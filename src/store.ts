import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccessPass, FeedState, Post, PostCaption, Reaction, ReactionType, User, ViewRecord } from './types';
import { uid } from './lib/id';
import { HOUR, isActive, now } from './lib/time';
import { PASS_HOURS, POST_TTL_HOURS, REACTIONS } from './copy';
import { makeFollowPosts, makeMyMemories, makeSeedReactions, makeTopicPosts } from './seed';
import { todaysTopic } from './topics';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface AccountSetupInput {
  displayName: string;
  handle: string;
  avatarEmoji: string;
  avatarColor: string;
  avatarImageUri?: string; // 選んだ写真／プリセット
  people: User[]; // フォロー候補（モックの人）
  followingIds: string[]; // フォローする人のid
}

interface PersistedState {
  onboarded: boolean;
  currentUserId: string | null;
  users: User[];
  following: string[];
  posts: Post[];
  views: ViewRecord[];
  reactions: Reaction[];
  feedStates: FeedState[];
  accessPass: AccessPass | null;
  lastSeenActivityAt: number; // アクティビティ（通知）を最後に見た時刻
  avatarChangedAt: number; // プロフ画像を最後に変更した時刻（24h変更ロック用）
  profileEditAt: number[]; // 名前/ID変更のタイムスタンプ（2週間に2回まで）
}

interface Actions {
  completeAccountSetup: (input: AccountSetupInput) => void;
  updateProfileImage: (uri: string) => void;
  updateProfile: (displayName: string, handle: string) => void;
  toggleFollow: (userId: string) => void;
  addPost: (imageUrl: string, audioUrl?: string, caption?: PostCaption, topicKey?: string) => string;
  markViewed: (postId: string) => void;
  reactToPost: (postId: string, type: ReactionType) => void;
  reactToTopic: (postId: string, type: ReactionType) => void;
  skipPost: (postId: string) => void;
  markActivitySeen: () => void;
  refreshFollowPostsIfStale: () => void;
  refreshTopicPostsIfStale: () => void;
  resetDemo: () => void;
}

export type Store = PersistedState & Actions;

const initial: PersistedState = {
  onboarded: false,
  currentUserId: null,
  users: [],
  following: [],
  posts: [],
  views: [],
  reactions: [],
  feedStates: [],
  accessPass: null,
  lastSeenActivityAt: 0,
  avatarChangedAt: 0,
  profileEditAt: [],
};

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // 自分の投稿に、フォロワー（デモのモックの人）が少し遅れて足跡＆反応を残す演出。
      function scheduleEngagement(postId: string) {
        const followers = get().users.filter((u) => u.isMock && get().following.includes(u.id));
        const shuffled = [...followers].sort(() => Math.random() - 0.5);
        shuffled.forEach((f, i) => {
          const delay = 800 + i * 700 + Math.random() * 500;
          setTimeout(() => {
            const s = get();
            if (!s.posts.some((p) => p.id === postId)) return;
            if (!s.views.some((v) => v.postId === postId && v.viewerId === f.id)) {
              set((st) => ({
                views: [...st.views, { id: uid('v_'), postId, viewerId: f.id, viewedAt: now() }],
              }));
            }
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

      return {
        ...initial,

        completeAccountSetup: ({ displayName, handle, avatarEmoji, avatarColor, avatarImageUri, people, followingIds }) => {
          const id = uid('u_');
          const me: User = {
            id,
            handle: handle.trim().replace(/^@/, '') || 'me',
            displayName: displayName.trim() || 'なまえ',
            avatarEmoji,
            avatarColor,
            avatarImageUri,
            createdAt: now(),
          };
          const followed = people.filter((p) => followingIds.includes(p.id));
          const followPosts = makeFollowPosts(followed);
          // お題：今日のお題への、仲間の投稿を仕込む（モザイクなしの別世界）。
          const topicSeed = makeTopicPosts(todaysTopic(), followed);
          // 相互アンロック：最初はパスを閉じておき、1枚出すと6時間だけ開く。
          set({
            onboarded: true,
            currentUserId: id,
            users: [me, ...people],
            following: followingIds,
            posts: [...followPosts, ...topicSeed, ...makeMyMemories(id)],
            views: [],
            reactions: [...makeSeedReactions(followPosts, people, id), ...makeSeedReactions(topicSeed, people, id)],
            feedStates: [],
            accessPass: null,
            lastSeenActivityAt: now(),
            avatarChangedAt: 0,
            profileEditAt: [],
          });
        },

        updateProfileImage: (uri) => {
          const { currentUserId } = get();
          if (!currentUserId) return;
          set((st) => ({
            users: st.users.map((u) => (u.id === currentUserId ? { ...u, avatarImageUri: uri } : u)),
            avatarChangedAt: now(),
          }));
        },

        updateProfile: (displayName, handle) => {
          const { currentUserId } = get();
          if (!currentUserId) return;
          const name = displayName.trim();
          const h = handle.trim().replace(/^@/, '');
          set((st) => ({
            users: st.users.map((u) =>
              u.id === currentUserId ? { ...u, displayName: name || u.displayName, handle: h || u.handle } : u
            ),
            profileEditAt: [...st.profileEditAt, now()].slice(-10),
          }));
        },

        toggleFollow: (userId) => {
          const { following, users, posts } = get();
          if (following.includes(userId)) {
            set({ following: following.filter((f) => f !== userId) });
            return;
          }
          const next = [...following, userId];
          const person = users.find((u) => u.id === userId);
          let nextPosts = posts;
          if (person && !posts.some((p) => p.userId === userId && isActive(p.expiresAt))) {
            nextPosts = [...posts, ...makeFollowPosts([person])];
          }
          set({ following: next, posts: nextPosts });
        },

        addPost: (imageUrl, audioUrl, caption, topicKey) => {
          const { currentUserId } = get();
          if (!currentUserId) return '';
          const createdAt = now();
          const post: Post = {
            id: uid('p_'),
            userId: currentUserId,
            topicKey,
            imageUrl,
            caption,
            audioUrl,
            createdAt,
            expiresAt: createdAt + POST_TTL_HOURS * HOUR,
          };
          if (topicKey) {
            // お題は独立：ホームの相互アンロック（6h）は開かない。
            set((st) => ({ posts: [...st.posts, post] }));
          } else {
            const pass: AccessPass = { openedAt: createdAt, expiresAt: createdAt + PASS_HOURS * HOUR };
            set((st) => ({ posts: [...st.posts, post], accessPass: pass }));
          }
          scheduleEngagement(post.id);
          return post.id;
        },

        markViewed: (postId) => {
          const { currentUserId, views } = get();
          if (!currentUserId) return;
          if (views.some((v) => v.postId === postId && v.viewerId === currentUserId)) return;
          set((st) => ({
            views: [...st.views, { id: uid('v_'), postId, viewerId: currentUserId, viewedAt: now() }],
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

        // お題でのリアクション：反応は記録するが「残す」には入れない（feedStateも触らない）。
        reactToTopic: (postId, type) => {
          const { currentUserId } = get();
          if (!currentUserId) return;
          set((st) => ({
            reactions: [
              ...st.reactions.filter((r) => !(r.postId === postId && r.userId === currentUserId)),
              { id: uid('r_'), postId, userId: currentUserId, type, createdAt: now() },
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

        markActivitySeen: () => set({ lastSeenActivityAt: now() }),

        // デモが古くなってフォロー中の投稿が全部期限切れなら、新しい時刻で作り直す。
        refreshFollowPostsIfStale: () => {
          const { following, posts, currentUserId, users } = get();
          const activeFollowed = posts.filter(
            (p) => p.userId !== currentUserId && following.includes(p.userId) && isActive(p.expiresAt)
          );
          if (activeFollowed.length > 0) return;
          const followedPeople = users.filter((u) => u.isMock && following.includes(u.id));
          if (followedPeople.length === 0) return;
          const fresh = makeFollowPosts(followedPeople);
          const freshIds = new Set(fresh.map((p) => p.id));
          set((st) => ({
            posts: [...st.posts.filter((p) => p.userId === currentUserId), ...fresh],
            feedStates: st.feedStates.filter((f) => !freshIds.has(f.postId)),
          }));
        },

        // 復帰時、今日のお題に仲間の投稿が無ければ（日付がかわった等）作り直す。
        refreshTopicPostsIfStale: () => {
          const { posts, following, users, currentUserId } = get();
          const topic = todaysTopic();
          const active = posts.filter(
            (p) => p.topicKey === topic.key && p.userId !== currentUserId && isActive(p.expiresAt)
          );
          if (active.length > 0) return;
          const followedPeople = users.filter((u) => u.isMock && following.includes(u.id));
          if (followedPeople.length === 0) return;
          const fresh = makeTopicPosts(topic, followedPeople);
          set((st) => ({
            posts: [...st.posts, ...fresh],
            reactions: [...st.reactions, ...makeSeedReactions(fresh, users, currentUserId ?? '')],
          }));
        },

        resetDemo: () => set({ ...initial }),
      };
    },
    {
      name: 'napsnap-store-v10',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        onboarded: s.onboarded,
        currentUserId: s.currentUserId,
        users: s.users,
        following: s.following,
        posts: s.posts,
        views: s.views,
        reactions: s.reactions,
        feedStates: s.feedStates,
        accessPass: s.accessPass,
        lastSeenActivityAt: s.lastSeenActivityAt,
        avatarChangedAt: s.avatarChangedAt,
        profileEditAt: s.profileEditAt,
      }),
    }
  )
);
