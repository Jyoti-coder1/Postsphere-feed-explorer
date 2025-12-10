const BASE = "https://jsonplaceholder.typicode.com";

const cache = {
  posts: new Map(),
  users: null,
  commentsByPost: new Map()
};

export async function fetchPostsPage(page = 1, limit = 10) {
  const key = `${page}_${limit}`;
  if (cache.posts.has(key)) return cache.posts.get(key);
  const url = `${BASE}/posts?_page=${page}&_limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch posts");
  const posts = await res.json();
  const total = parseInt(res.headers.get("x-total-count") || "100", 10);
  const payload = { posts, total };
  cache.posts.set(key, payload);
  return payload;
}

export async function fetchUsers() {
  if (cache.users) return cache.users;
  const res = await fetch(`${BASE}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const users = await res.json();
  cache.users = users;
  return users;
}

export async function fetchCommentsForPost(postId) {
  if (cache.commentsByPost.has(postId)) return cache.commentsByPost.get(postId);
  const res = await fetch(`${BASE}/posts/${postId}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  const comments = await res.json();
  cache.commentsByPost.set(postId, comments);
  return comments;
}

export async function fetchCommentsForPosts(postIds = []) {
  const toFetch = postIds.filter(id => !cache.commentsByPost.has(id));
  const promises = toFetch.map(id =>
    fetch(`${BASE}/posts/${id}/comments`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch comments");
      return r.json().then(comments => ({ id, comments }));
    })
  );
  const results = await Promise.all(promises);
  results.forEach(({ id, comments }) => cache.commentsByPost.set(id, comments));
  const map = new Map();
  postIds.forEach(id => map.set(id, cache.commentsByPost.get(id) || []));
  return map;
}

export async function fetchPostDetail(postId) {
  const pPost = fetch(`${BASE}/posts/${postId}`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch post");
    return r.json();
  });
  const pComments = fetchCommentsForPost(postId);
  const post = await pPost;
  const pUser = fetch(`${BASE}/users/${post.userId}`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch user");
    return r.json();
  });
  const [comments, user] = await Promise.all([pComments, pUser]);
  return { post, comments, user };
}