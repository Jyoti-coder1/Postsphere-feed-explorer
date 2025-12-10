import React from "react";
import Feed from "./components/Feed";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PostSphere — JSONPlaceholder Feed Explorer</h1>
        <p className="sub">React + fetch + HOF transformers + smart search + pagination</p>
      </header>

      <main>
        <Feed />
      </main>

      <footer className="app-footer">Built for assignment • JSONPlaceholder demo</footer>
    </div>
  );
}