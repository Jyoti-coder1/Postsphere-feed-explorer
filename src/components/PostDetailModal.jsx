import React, { useEffect, useState } from "react";
import { fetchPostDetail } from "../api";

export default function PostDetailModal({ postId, onClose }) {
    const [state, setState] = useState({ loading: true, err: null, post: null, comments: [], user: null });

    useEffect(() => {
        if (!postId) return;
        setState({ loading: true, err: null, post: null, comments: [], user: null });

        fetchPostDetail(postId)
            .then(({ post, comments, user }) => setState({ loading: false, err: null, post, comments, user }))
            .catch(err => setState({ loading: false, err: err.message || String(err), post: null, comments: [], user: null }));
    }, [postId]);

    if (!postId) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <button className="close" onClick={onClose}>✕</button>
                {state.loading ? <div className="loader">Loading...</div> : state.err ? <div className="err">{state.err}</div> : (
                    <div>
                        <h2>{state.post.title}</h2>
                        <div className="detail-meta">
                            <strong>Author:</strong> {state.user?.name} • <em>{state.user?.email}</em>
                        </div>
                        <p className="full-body">{state.post.body}</p>
                        <h4>Comments ({state.comments.length})</h4>
                        <ul className="comments">
                            {state.comments.map(c => (
                                <li key={c.id}><strong>{c.name}</strong> <small className="small-muted">({c.email})</small><p>{c.body}</p></li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}