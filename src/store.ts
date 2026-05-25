import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccessPass, FeedState, Post, PostCaption, Reaction, ReactionType, User, ViewRecord } from './types';
import { uid } from './lib/id';
import { HOUR, isActive, nextMidnight, now } from './lib/time';
import { PASS_HOURS, POST_TTL_HOURS, REACTION_TTL_HOURS, REACTIONS } from './copy';
import { makeFollowPosts, makeMyMemories, makeOfficialPosts, makeOfficialUser, makeSeedReactions, makeTopicPosts, OFFICIAL_ID } from './seed';
import { dayIndex, todaysTopic } from './topics';

const SEARCH_HISTORY_MAX = 4;

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
  topicSeenDay: number; // 「今日のお題」通知を見た日（dayIndex）。違えば未読として出す
  searchHistory: string[]; // さがすタブの検索履歴（@IDのみ・新しい順・最大4件）
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
  markTopicSeen: () => void;
  addSearchHistory: (handle: string) => void;
  removeSearchHistory: (handle: string) => void;
  refreshFollowPostsIfStale: () => void;
  refreshTopicPostsIfStale: () => void;
  refreshOfficialPostsIfStale: () => void;
  ensureOfficialFollowed: () => void;
  pruneExpired: () => void;
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
  topicSeenDay: -1,
  searchHistory: [],
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
          // 公式アカウント：最初からフォロー＆初期フィードを供給（本番でも空にしない）。
          const official = makeOfficialUser();
          const officialPosts = makeOfficialPosts(official.id);
          // 相互アンロック：最初はパスを閉じておき、1枚出すと6時間だけ開く。
          set({
            onboarded: true,
            currentUserId: id,
            users: [me, official, ...people],
            following: [official.id, ...followingIds],
            posts: [...officialPosts, ...followPosts, ...topicSeed, ...makeMyMemories(id)],
            views: [],
            reactions: [
              ...makeSeedReactions(followPosts, people, id),
              ...makeSeedReactions(topicSeed, people, id),
              ...makeSeedReactions(officialPosts, people, id),
            ],
            feedStates: [],
            accessPass: null,
            lastSeenActivityAt: now(),
            avatarChangedAt: 0,
            profileEditAt: [],
            topicSeenDay: -1, // 初回から「今日のお題」通知を出す
            searchHistory: [],
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
            // お題は日付がかわる0時で総入れ替え＝期限は今日の終わり。通常投稿は24時間。
            expiresAt: topicKey ? nextMidnight(createdAt) : createdAt + POST_TTL_HOURS * HOUR,
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

        // 「今日のお題」通知を見た（今日ぶんを既読に）。
        markTopicSeen: () => set({ topicSeenDay: dayIndex() }),

        addSearchHistory: (handle) => {
          const h = handle.trim().replace(/^@/, '').toLowerCase();
          if (!h) return;
          set((st) => ({
            searchHistory: [h, ...st.searchHistory.filter((x) => x !== h)].slice(0, SEARCH_HISTORY_MAX),
          }));
        },
        removeSearchHistory: (handle) => {
          const h = handle.trim().replace(/^@/, '').toLowerCase();
          set((st) => ({ searchHistory: st.searchHistory.filter((x) => x !== h) }));
        },

        // デモが古くなってフォロー中（モック仲間）の投稿が全部期限切れなら、新しい時刻で作り直す。
        // 公式・お題・自分の投稿は触らない（それぞれ別ロジックで管理）。
        refreshFollowPostsIfStale: () => {
          const { following, posts, users } = get();
          const followedMockIds = new Set(
            users.filter((u) => u.isMock && following.includes(u.id)).map((u) => u.id)
          );
          const activeMock = posts.filter(
            (p) => !p.topicKey && followedMockIds.has(p.userId) && isActive(p.expiresAt)
          );
          if (activeMock.length > 0) return;
          const followedPeople = users.filter((u) => u.isMock && following.includes(u.id));
          if (followedPeople.length === 0) return;
          const fresh = makeFollowPosts(followedPeople);
          const freshIds = new Set(fresh.map((p) => p.id));
          set((st) => ({
            // モック仲間の通常投稿だけ入れ替え（お題・公式・自分はそのまま残す）。
            posts: [...st.posts.filter((p) => p.topicKey || !followedMockIds.has(p.userId)), ...fresh],
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

        // 既存ユーザー（公式導入より前にアカウント作成した人）にも、公式アカウントを
        // 後付けでフォローさせる。冪等＝何度呼んでも重複しない。
        ensureOfficialFollowed: () => {
          const s = get();
          if (!s.onboarded) return;
          const existing = s.users.find((u) => u.isOfficial || u.id === OFFICIAL_ID);
          const official = existing ?? makeOfficialUser();
          const needUser = !existing;
          const needFollow = !s.following.includes(official.id);
          if (!needUser && !needFollow) return;
          set((st) => ({
            users: needUser ? [...st.users, official] : st.users,
            following: needFollow ? [official.id, ...st.following] : st.following,
          }));
        },

        // 復帰時、公式アカウントの投稿が無ければ（期限切れ・初期フィード補充）作り直す。
        // 本番でも「はじめてのフィードが空」を避けるため。
        refreshOfficialPostsIfStale: () => {
          const { posts, following, users } = get();
          const official = users.find((u) => u.isOfficial) ?? users.find((u) => u.id === OFFICIAL_ID);
          if (!official || !following.includes(official.id)) return;
          const active = posts.some((p) => p.userId === official.id && !p.topicKey && isActive(p.expiresAt));
          if (active) return;
          const fresh = makeOfficialPosts(official.id);
          const mock = users.filter((u) => u.isMock);
          set((st) => ({
            posts: [...st.posts, ...fresh],
            reactions: [...st.reactions, ...makeSeedReactions(fresh, mock, st.currentUserId ?? '')],
          }));
        },

        // 期限切れの投稿を捨ててストレージを増やさない（#4）。
        // ただし「自分の投稿(=思い出)」と「まだ残す枠にあるもの(反応24h以内)」は残す。
        pruneExpired: () => {
          const { currentUserId } = get();
          const reactionCutoff = Date.now() - REACTION_TTL_HOURS * HOUR;
          set((st) => {
            const keepReacted = new Set(
              st.reactions
                .filter((r) => r.userId === currentUserId && r.createdAt > reactionCutoff)
                .map((r) => r.postId)
            );
            const posts = st.posts.filter(
              // 自分の通常投稿（=思い出）は残す。お題は0時に消えるので自分のでも残さない。
              (p) => (p.userId === currentUserId && !p.topicKey) || isActive(p.expiresAt) || keepReacted.has(p.id)
            );
            if (posts.length === st.posts.length) return {} as any; // 変化なし
            const ids = new Set(posts.map((p) => p.id));
            return {
              posts,
              reactions: st.reactions.filter((r) => ids.has(r.postId)),
              views: st.views.filter((v) => ids.has(v.postId)),
              feedStates: st.feedStates.filter((f) => ids.has(f.postId)),
            };
          });
        },

        resetDemo: () => set({ ...initial }),
      };
    },
    {
      // ⚠ この name は固定。デプロイのたびにデータが消えないよう、もう絶対に変えない。
      // スキーマ/シードを変えたら name を変える代わりに、下の version を上げて migrate で移行する
      // （保存データを捨てずに不足分だけ補う）。
      name: 'napsnap-store-v10',
      version: 1,
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
        topicSeenDay: s.topicSeenDay,
        searchHistory: s.searchHistory,
      }),
      // 既存の保存データを消さずに移行する。新フィールドは初期値で補う（公式アカウントの
      // 後付けは復帰時の ensureOfficialFollowed で行う＝確実・冪等）。
      migrate: (persisted): PersistedState => ({ ...initial, ...(persisted as object) } as PersistedState),
    }
  )
);
