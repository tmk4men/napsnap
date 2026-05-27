import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccessPass, FeedState, NotifyKind, NotifyPrefs, Post, PostCaption, Reaction, ReactionType, TopicVisibility, User, ViewRecord } from './types';
import { uid } from './lib/id';
import { HOUR, isActive, nextMidnight, now } from './lib/time';
import { PASS_HOURS, POST_TTL_HOURS, REACTION_TTL_HOURS, REACTIONS } from './copy';
import { makeFollowPosts, makeMyMemories, makeOfficialPosts, makeOfficialUser, makeSeedReactions, makeTopicPosts, OFFICIAL_ID } from './seed';
import { dayIndex, todaysTopic } from './topics';
import { hasSupabase } from './config';
import * as be from './lib/backend';
import { liveBootstrap, liveCompleteSetup, LiveSnapshot } from './lib/live';

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
  followers: { followerId: string; followedAt: number }[]; // 自分をフォローしている人＋時刻（直近50人・通知用）
  followersTotal: number; // フォロワー総数（プロフィール数字用）
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
  topicVisibility: TopicVisibility; // 自分のお題投稿の公開範囲。'public'=全実在ユーザー / 'followers'=自分とフォロワーのみ。
  notifyPrefs: NotifyPrefs; // アクティビティ通知の種類ごとのオンオフ。
}

interface Actions {
  completeAccountSetup: (input: AccountSetupInput) => void | Promise<void>;
  updateProfileImage: (uri: string) => void;
  updateProfile: (displayName: string, handle: string) => void;
  toggleFollow: (userId: string) => void;
  addPost: (imageUrl: string, audioUrl?: string, caption?: PostCaption, topicKey?: string) => Promise<string>;
  liveHydrate: () => Promise<void>;
  markViewed: (postId: string) => void;
  reactToPost: (postId: string, type: ReactionType) => void;
  reactToTopic: (postId: string, type: ReactionType) => void;
  skipPost: (postId: string) => void;
  markActivitySeen: () => void;
  markTopicSeen: () => void;
  addSearchHistory: (handle: string) => void;
  removeSearchHistory: (handle: string) => void;
  setTopicVisibility: (v: TopicVisibility) => void;
  setNotifyPref: (kind: NotifyKind, on: boolean) => void;
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
  followers: [],
  followersTotal: 0,
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
  topicVisibility: 'public',
  notifyPrefs: { follow: true, react: true, post: true, view: true, topic: true },
};

// ライブのスナップショットをローカル state に反映。
// 方針：サーバを真実とみなし、snap をそのまま採用する（楽観マージは入れない）。
// その代わり、書き込み系（addPost / react）は呼び出し側で await してから set するので、
// hydrate 競合で「押したのに消える／投稿が消える」は構造的に起きない。
// パス（6h解錠）は「自分の有効な通常投稿」から導出する＝過去のローカル accessPass の残留で
// 「今日はここまで＋謎の残り時間」が出るのを防ぐ。投稿が無ければパス無し＝ロック表示。
function applySnapshot(set: (p: Partial<Store>) => void, get: () => Store, snap: LiveSnapshot) {
  const st = get();
  const me = snap.currentUserId;
  const myActive = snap.posts
    .filter((p) => p.userId === me && !p.topicKey && isActive(p.expiresAt))
    .sort((a, b) => b.createdAt - a.createdAt);
  const latest = myActive[0];
  const accessPass: AccessPass | null = latest
    ? { openedAt: latest.createdAt, expiresAt: latest.createdAt + PASS_HOURS * HOUR }
    : null;
  // 自分の閲覧記録（viewerId === me）はサーバから引かない（listViews は自分の投稿への足あとだけ取得）。
  // セッション内の重複 upsert を避けるため、ローカルに溜まった自分のviewsをマージで残す。
  const myLocalViews = st.views.filter((v) => v.viewerId === me);
  set({
    onboarded: snap.onboarded,
    currentUserId: snap.currentUserId,
    users: snap.users,
    following: snap.following,
    followers: snap.followers,
    followersTotal: snap.followersTotal,
    posts: snap.posts,
    reactions: snap.reactions,
    views: [...snap.views, ...myLocalViews],
    accessPass,
  });
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // 自分の投稿に、フォロワー（デモのモックの人）が少し遅れて足跡＆反応を残す演出。
      // ライブ（実データ）では本物の反応が来るので動かさない。
      function scheduleEngagement(postId: string) {
        if (hasSupabase) return;
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

        completeAccountSetup: async ({ displayName, handle, avatarEmoji, avatarColor, avatarImageUri, people, followingIds }) => {
          // ライブ：プロフィール作成＋フォローを Supabase に書き、スナップショットで反映。
          if (hasSupabase) {
            const snap = await liveCompleteSetup({
              displayName: displayName.trim() || 'なまえ',
              handle: handle.trim().replace(/^@/, '') || 'me',
              avatarImageUri,
              followingIds,
            });
            if (snap) applySnapshot(set, get, snap);
            return;
          }
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
          if (hasSupabase) {
            (async () => {
              try {
                const url = await be.uploadMedia(uri, 'photo');
                await be.updateMyProfile({ avatarUrl: url });
                set((st) => ({ users: st.users.map((u) => (u.id === currentUserId ? { ...u, avatarImageUri: url } : u)) }));
              } catch (e) {
                console.warn('avatar update failed', e);
              }
            })();
          }
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
          if (hasSupabase) {
            be.updateMyProfile({ displayName: name || undefined, handle: h || undefined }).catch((e) => console.warn('profile update failed', e));
          }
        },

        toggleFollow: (userId) => {
          const { following, users, posts } = get();
          const isFollowing = following.includes(userId);
          // ライブ：楽観的にローカル更新 → Supabase へ書き → 再取得（相手の投稿の可視範囲が変わるため）。
          if (hasSupabase) {
            set({ following: isFollowing ? following.filter((f) => f !== userId) : [...following, userId] });
            const op = isFollowing ? be.unfollow(userId) : be.follow(userId);
            op.then(() => get().liveHydrate()).catch((e) => console.warn('follow toggle failed', e));
            return;
          }
          if (isFollowing) {
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

        addPost: async (imageUrl, audioUrl, caption, topicKey) => {
          const { currentUserId } = get();
          if (!currentUserId) throw new Error('未ログイン');
          const createdAt = now();
          // お題は日付がかわる0時で総入れ替え＝期限は今日の終わり。通常投稿は24時間。
          const expiresAt = topicKey ? nextMidnight(createdAt) : createdAt + POST_TTL_HOURS * HOUR;
          // ライブ：画像/音声を Supabase Storage に上げ、posts に挿入。
          // 失敗時は呼び出し側で扱えるよう例外を投げる（サイレントに画面遷移しないため）。
          if (hasSupabase) {
            const post = await be.addPost({
              imageUri: imageUrl,
              audioUri: audioUrl,
              caption,
              topicKey,
              topicVisibility: topicKey ? get().topicVisibility : undefined,
              expiresAt,
            });
            if (topicKey) {
              set((st) => ({ posts: [...st.posts, post] }));
            } else {
              set((st) => ({ posts: [...st.posts, post], accessPass: { openedAt: createdAt, expiresAt: createdAt + PASS_HOURS * HOUR } }));
            }
            return post.id;
          }
          const post: Post = {
            id: uid('p_'),
            userId: currentUserId,
            topicKey,
            imageUrl,
            caption,
            audioUrl,
            createdAt,
            expiresAt,
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

        liveHydrate: async () => {
          if (!hasSupabase) return;
          try {
            const snap = await liveBootstrap();
            if (snap) applySnapshot(set, get, snap);
          } catch (e) {
            console.warn('liveHydrate failed', e);
          }
        },

        markViewed: (postId) => {
          const { currentUserId, views } = get();
          if (!currentUserId) return;
          if (views.some((v) => v.postId === postId && v.viewerId === currentUserId)) return;
          set((st) => ({
            views: [...st.views, { id: uid('v_'), postId, viewerId: currentUserId, viewedAt: now() }],
            // 集計済みカウントを楽観的に+1（サーバ側はトリガで増える。次回 hydrate で正の値で上書き）。
            posts: st.posts.map((p) => (p.id === postId ? { ...p, viewCount: (p.viewCount ?? 0) + 1 } : p)),
          }));
          if (hasSupabase) be.markViewed(postId).catch((e) => console.warn('markViewed failed', e));
        },

        reactToPost: async (postId, type) => {
          const { currentUserId } = get();
          if (!currentUserId) return;
          // ライブ：DBに書き込んでからローカル更新。hydrate 競合で消えるのを防ぐ。
          if (hasSupabase) {
            try {
              await be.react(postId, type);
            } catch (e) {
              console.warn('react failed', e);
              return;
            }
          }
          set((st) => {
            const hadReaction = st.reactions.some((r) => r.postId === postId && r.userId === currentUserId);
            return {
              reactions: [
                ...st.reactions.filter((r) => !(r.postId === postId && r.userId === currentUserId)),
                { id: uid('r_'), postId, userId: currentUserId, type, createdAt: now() },
              ],
              // 「リアクション＝次へ自動遷移」は廃止。feedStates は触らず、
              // スワイプ(skipPost)で初めて次の投稿に進むようにする。
              // 反応が初めての時だけ集計カウントを+1（タイプ変更時はカウント据え置き）。
              posts: hadReaction
                ? st.posts
                : st.posts.map((p) => (p.id === postId ? { ...p, reactionCount: (p.reactionCount ?? 0) + 1 } : p)),
            };
          });
        },

        // お題でのリアクション：反応は記録するが「残す」には入れない（feedStateも触らない）。
        reactToTopic: async (postId, type) => {
          const { currentUserId } = get();
          if (!currentUserId) return;
          if (hasSupabase) {
            try {
              await be.react(postId, type);
            } catch (e) {
              console.warn('react failed', e);
              return;
            }
          }
          set((st) => {
            const hadReaction = st.reactions.some((r) => r.postId === postId && r.userId === currentUserId);
            return {
              reactions: [
                ...st.reactions.filter((r) => !(r.postId === postId && r.userId === currentUserId)),
                { id: uid('r_'), postId, userId: currentUserId, type, createdAt: now() },
              ],
              posts: hadReaction
                ? st.posts
                : st.posts.map((p) => (p.id === postId ? { ...p, reactionCount: (p.reactionCount ?? 0) + 1 } : p)),
            };
          });
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

        setTopicVisibility: (v) => set({ topicVisibility: v }),

        setNotifyPref: (kind, on) =>
          set((st) => ({ notifyPrefs: { ...st.notifyPrefs, [kind]: on } })),

        // デモが古くなってフォロー中（モック仲間）の投稿が全部期限切れなら、新しい時刻で作り直す。
        // 公式・お題・自分の投稿は触らない（それぞれ別ロジックで管理）。
        refreshFollowPostsIfStale: () => {
          if (hasSupabase) return; // ライブは実データ。モックの自動生成はしない。
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
          if (hasSupabase) return;
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
          if (hasSupabase) return; // ライブには公式モックを足さない。
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
          if (hasSupabase) return;
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

        resetDemo: () => {
          if (hasSupabase) be.signOut().catch(() => {}); // ライブ：サインアウト＝次回は新しい匿名ユーザー
          set({ ...initial });
        },
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
        followers: s.followers,
        followersTotal: s.followersTotal,
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
        topicVisibility: s.topicVisibility,
        notifyPrefs: s.notifyPrefs,
      }),
      // 既存の保存データを消さずに移行する。新フィールドは初期値で補う（公式アカウントの
      // 後付けは復帰時の ensureOfficialFollowed で行う＝確実・冪等）。
      // notifyPrefs は新キーが増えても既存ユーザーが「未設定＝オフ」にならないよう浅マージで補う。
      migrate: (persisted): PersistedState => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...initial,
          ...p,
          notifyPrefs: { ...initial.notifyPrefs, ...(p.notifyPrefs ?? {}) },
        };
      },
    }
  )
);
