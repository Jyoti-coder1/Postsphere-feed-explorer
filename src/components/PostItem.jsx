import React from "react";

export default function PostItem({ post, author, commentCount, onClick, highlight }) {
    return (
        <article className={`post-item ${highlight ? "highlight" : ""}`} onClick={() => onClick(post.id)} role="button" tabIndex={0}>
            <div className="post-head">
                <h4>{post.title}</h4>
                <div className="meta">
                    <span className="author">{author?.name ?? "Unknown"}</span>
                    <span className="comments">{commentCount ?? 0} comments</span>
                </div>
            </div>
            <p className="post-body">{post.body.slice(0, 220)}{post.body.length > 220 ? "…" : ""}</p>
        </article>
    );
}