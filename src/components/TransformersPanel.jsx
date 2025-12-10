import React, { useEffect, useState } from "react";

/**
 Transformer model:
 {
   id: 'highlightLong'|'hideUsers'|'groupByUser'|'sortByComments',
   name: 'Highlight long posts',
   enabled: bool,
   settings: { ... }   // transformer-specific settings
 }
*/

const DEFAULTS = [
    { id: "highlightLong", name: "Highlight long posts", enabled: false, settings: { minLength: 200 } },
    { id: "hideUsers", name: "Hide posts by selected users", enabled: false, settings: { hiddenUserIds: [] } },
    { id: "groupByUser", name: "Group posts by user (insert separators)", enabled: false, settings: {} },
    { id: "sortByComments", name: "Sort by comment count (desc)", enabled: false, settings: {} },
];

export default function TransformersPanel({ users = [], onChange }) {
    const [transformers, setTransformers] = useState(DEFAULTS);

    useEffect(() => {
        // notify parent with ordered pipeline
        onChange(transformers);
    }, [transformers, onChange]);

    function toggle(id) {
        setTransformers(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    }

    function moveUp(idx) {
        if (idx <= 0) return;
        setTransformers(prev => {
            const copy = [...prev];
            const tmp = copy[idx - 1];
            copy[idx - 1] = copy[idx];
            copy[idx] = tmp;
            return copy;
        });
    }

    function moveDown(idx) {
        setTransformers(prev => {
            if (idx >= prev.length - 1) return prev;
            const copy = [...prev];
            const tmp = copy[idx + 1];
            copy[idx + 1] = copy[idx];
            copy[idx] = tmp;
            return copy;
        });
    }

    function setMinLen(val) {
        setTransformers(prev => prev.map(t => t.id === "highlightLong" ? { ...t, settings: { ...t.settings, minLength: Number(val || 0) } } : t));
    }

    function toggleUserHidden(userId) {
        setTransformers(prev => prev.map(t => {
            if (t.id !== "hideUsers") return t;
            const set = new Set(t.settings.hiddenUserIds || []);
            if (set.has(userId)) set.delete(userId); else set.add(userId);
            return { ...t, settings: { ...t.settings, hiddenUserIds: Array.from(set) } };
        }));
    }

    return (
        <div className="transformers">
            <h3>Feed Transformers</h3>
            <p className="small-muted">Enable multiple transformers and re-order them — they are applied top→bottom.</p>

            {transformers.map((t, idx) => (
                <div key={t.id} className="transformer-row">
                    <div className="label">
                        <label>
                            <input type="checkbox" checked={t.enabled} onChange={() => toggle(t.id)} /> <strong>{t.name}</strong>
                        </label>
                        {t.id === "highlightLong" && (
                            <div style={{ marginTop: 6 }}>
                                <small className="small-muted">Min chars:</small>
                                <input type="number" value={t.settings.minLength} onChange={(e) => setMinLen(e.target.value)} style={{ width: 80, marginLeft: 8 }} />
                            </div>
                        )}
                        {t.id === "hideUsers" && t.enabled && (
                            <div style={{ marginTop: 6, maxHeight: 120, overflow: "auto" }}>
                                {users.map(u => (
                                    <label key={u.id} style={{ display: "block" }}>
                                        <input
                                            type="checkbox"
                                            checked={(t.settings.hiddenUserIds || []).includes(u.id)}
                                            onChange={() => toggleUserHidden(u.id)}
                                        /> {u.name}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                        <button className="order-btn" onClick={() => moveUp(idx)} aria-label="Move up">↑</button>
                        <button className="order-btn" onClick={() => moveDown(idx)} aria-label="Move down">↓</button>
                    </div>
                </div>
            ))}

            <div style={{ marginTop: 8 }}>
                <small className="small-muted">Tip: change order to control pipeline sequence.</small>
            </div>
        </div>
    );
}