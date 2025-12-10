import React, { useEffect, useMemo, useState, useCallback } from "react";
import { fetchPostsPage, fetchUsers, fetchCommentsForPosts } from "../api";
import SearchBar from "./SearchBar";
import TransformersPanel from "./TransformersPanel";
import Pagination from "./Pagination";
import PostItem from "./PostItem";
import PostDetailModal from "./PostDetailModal";

const PAGE_LIMIT = 10;

// fuzzy subsequence checker: returns a score 0..1
function fuzzyScore(text = "", q = "") {
    text = (text || "").toLowerCase();
    q = (q || "").toLowerCase();
    if (!q) return 1;
    let i = 0, j = 0;
    while (i < text.length && j < q.length) {
        if (text[i] === q[j]) j++;
        i++;
    }
    return j === q.length ? q.length / text.length : 0;
}

export default function Feed() {
    const [page, setPage] = useState(1);
    const [postsData, setPostsData] = useState({ posts: [], total: 0, loading: false, err: null });
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState({ q: "", mode: "full" });
    const [transformerPipeline, setTransformerPipeline] = useState([]); // array from panel (ordered)
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [commentCounts, setCommentCounts] = useState(new Map());

    useEffect(() => {
        fetchUsers().then(setUsers).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        let mounted = true;
        setPostsData(s => ({ ...s, loading: true, err: null }));
        fetchPostsPage(page, PAGE_LIMIT)
            .then(({ posts, total }) => {
                if (!mounted) return;
                setPostsData({ posts, total, loading: false, err: null });
            })
            .catch(err => {
                if (!mounted) return;
                setPostsData({ posts: [], total: 0, loading: false, err: err.message || String(err) });
            });
        return () => { mounted = false; };
    }, [page]);

    // when sortByComments appears enabled anywhere in pipeline, fetch comment counts for visible posts
    useEffect(() => {
        async function loadCommentCounts() {
            const needsSort = transformerPipeline.some(t => t.id === "sortByComments" && t.enabled);
            if (!needsSort) {
                // clear counts for safety (keeps previous but we can keep existing)
                return;
            }
            const ids = postsData.posts.map(p => p.id);
            try {
                const map = await fetchCommentsForPosts(ids);
                const m = new Map();
                for (const id of ids) m.set(id, (map.get(id) || []).length);
                setCommentCounts(m);
            } catch (err) {
                console.error("Failed to fetch comment counts", err);
            }
        }
        loadCommentCounts();
    }, [transformerPipeline, postsData.posts]);

    const authorsById = useMemo(() => {
        const m = new Map();
        (users || []).forEach(u => m.set(u.id, u));
        return m;
    }, [users]);

    // Apply search on current page posts
    const searched = useMemo(() => {
        const q = (search.q || "").trim().toLowerCase();
        if (!q) {
            return postsData.posts.map(p => ({
                post: p,
                author: authorsById.get(p.userId),
                commentCount: commentCounts.get(p.id) ?? 0,
                score: 1
            }));
        }
        const mode = search.mode;
        const arr = postsData.posts.map(p => {
            const author = authorsById.get(p.userId);
            const title = p.title || "";
            const body = p.body || "";
            const authorName = author?.name || "";
            let score = 0;
            if (mode === "title") {
                score = title.toLowerCase().includes(q) ? 1 : 0;
            } else if (mode === "full") {
                score = (title + " " + body + " " + authorName).toLowerCase().includes(q) ? 1 : 0;
            } else if (mode === "fuzzy") {
                score = Math.max(fuzzyScore(title, q), fuzzyScore(body, q), fuzzyScore(authorName, q));
            }
            return { post: p, author, commentCount: commentCounts.get(p.id) ?? 0, score };
        }).filter(x => x.score > 0);
        arr.sort((a, b) => (b.score || 0) - (a.score || 0));
        return arr;
    }, [postsData.posts, search, authorsById, commentCounts]);

    // Convert transformerPipeline (ordered array) into a composed HOF pipeline.
    // Each transformer returns a function that takes an array and returns a new array.
    function getTransformerFunctions(orderedPipeline) {
        const funcs = [];

        orderedPipeline.forEach(t => {
            if (!t.enabled) return;
            if (t.id === "hideUsers") {
                const hidden = new Set(t.settings.hiddenUserIds || []);
                funcs.push(list => list.filter(item => !hidden.has(item.post.userId)));
            } else if (t.id === "highlightLong") {
                const minLen = Number(t.settings.minLength || 200);
                funcs.push(list => list.map(item => ({ ...item, highlight: (item.post.body?.length || 0) >= minLen })));
            } else if (t.id === "sortByComments") {
                funcs.push(list => {
                    // stable sort by commentCount desc
                    return [...list].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
                });
            } else if (t.id === "groupByUser") {
                funcs.push(list => {
                    const grouped = [];
                    let lastUser = null;
                    list.forEach(item => {
                        if (item.post.userId !== lastUser) {
                            grouped.push({ type: "separator", userId: item.post.userId, user: item.author });
                            lastUser = item.post.userId;
                        }
                        grouped.push({ type: "post", ...item });
                    });
                    return grouped;
                });
            }
        });

        return funcs;
    }

    // Apply pipeline
    const transformed = useMemo(() => {
        // initial items: convert searched to items of shape { post, author, commentCount, highlight?, score? }
        let items = searched.map(item => ({ ...item, highlight: item.highlight || false }));
        const funcs = getTransformerFunctions(transformerPipeline);

        // If no groupByUser is used in pipeline, we need final result as post items only:
        let groupedMode = transformerPipeline.some(t => t.enabled && t.id === "groupByUser");

        // apply each transformer sequentially
        for (const fn of funcs) {
            items = fn(items);
        }

        // if groupByUser hasn't been applied (so items are posts), wrap into { type: 'post', ... } for uniform rendering
        if (!groupedMode) {
            return items.map(it => ({ type: "post", ...it }));
        } else {
            // items may already include separators (some entries have type 'separator' or 'post')
            // ensure everything has a type
            return items.map(it => it.type ? it : ({ type: "post", ...it }));
        }
    }, [searched, transformerPipeline]);

    const totalPages = Math.max(1, Math.ceil((postsData.total || 100) / PAGE_LIMIT));

    const handleSearch = useCallback((q, mode) => {
        setSearch({ q, mode });
        // We keep page as-is so user can search within current page; you may reset to page 1 if desired.
    }, []);

    return (
        <div className="feed-area">
            <div className="controls" style={{ gridColumn: "1 / -1" }}>
                <SearchBar onSearch={handleSearch} />
            </div>

            <div className="left-col">
                <TransformersPanel users={users} onChange={(pipeline) => setTransformerPipeline(pipeline)} />
            </div>

            <div className="right-col">
                <div className="feed">
                    {postsData.loading ? <div className="loader">Loading posts…</div> : postsData.err ? <div className="err">{postsData.err}</div> : (
                        <>
                            <div className="feed-list">
                                {transformed.length === 0 ? <div className="empty">No posts found.</div> : transformed.map((item, idx) => {
                                    if (item.type === "separator") {
                                        return <div key={"sep_" + item.userId} className="group-sep">User: {item.user?.name ?? `#${item.userId}`}</div>;
                                    }
                                    const { post, author, commentCount, highlight } = item;
                                    return (
                                        <PostItem
                                            key={post.id}
                                            post={post}
                                            author={author}
                                            commentCount={commentCount}
                                            highlight={highlight}
                                            onClick={(id) => setSelectedPostId(id)}
                                        />
                                    );
                                })}
                            </div>

                            <Pagination page={page} totalPages={totalPages} onPage={(p) => setPage(Math.max(1, Math.min(totalPages, p)))} />
                        </>
                    )}
                </div>
            </div>

            <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
        </div>
    );
}