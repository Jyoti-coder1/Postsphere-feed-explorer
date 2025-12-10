# PostSphere — JSONPlaceholder Feed Explorer

A modern, polished, React-based feed explorer that fetches and displays posts from the JSONPlaceholder API.
Includes smart search, debouncing, pagination, transformer pipeline (HOFs), and a full post-detail view with comments & author info.


---

## Features

1. Live Feed from JSONPlaceholder

Uses the following endpoints:

/posts

/users

/comments


Data is fetched via fetch() and async/await.

2. Real Pagination (Server-Side Slice Fetching)

Uses API parameters:

?_page=1&_limit=10

Includes:

Page numbers

Next / Previous buttons

Error + Empty states

Loading indicators


3. Smart Search (Debounced)

The search bar supports multiple modes:

Title-Only Mode

Full-Text Mode (title + body + author)

Fuzzy Mode (basic fuzzy logic)


Debounced at 400ms to avoid excessive API calls.


4. Feed Transformers (Higher-Order Functions Pipeline)

A unique feature of this app.

You can enable/disable multiple transformers, and they apply in order using:

map()

filter()

reduce()


Available transformers:

Highlight long posts

Hide posts by selected users

Group posts by user (with visible separators)

Sort posts by comment count


5. Post Detail View

Clicking a post opens a detail page showing:

Full post body

Author information

Comments

Fetched in parallel using Promise.all()

6. Clean + Polished UI

Scrollable feed

Componentized UI

Responsive layout

States for loading, error, empty lists

## Folder Structure

PostSphere/
│
├── src/
│   ├── components/
│   │   ├── Feed.js
│   │   ├── SearchBar.js
│   │   ├── Pagination.js
│   │   ├── TransformersPanel.js
│   │   ├── PostCard.js
│   │   └── PostDetail.js
│   │
│   ├── hooks/
│   │   └── useDebounce.js
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── transformers/
│   │   └── index.js
│   │
│   ├── App.js
│   ├── index.js
│   ├── App.css
│   └── index.css
│
├── package.json
└── README.md


## Installation & Setup

1. Clone the repository

git clone https://github.com/Jyoti-coder1/PostSphere.git
cd PostSphere

2. Install dependencies

npm install

3. Start development server

npm run dev

Your app runs at:

http://localhost:5173/


## How Features Work

### Pagination

Uses:

https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${limit}

This ensures only the required slice is fetched.


### Debounced Search

useDebounce() delays the search request by 400ms.

Modes include:

title

full

fuzzy


### Transformers Pipeline

Transformers are functions like:

(posts) => posts.filter(p => p.body.length > 150)

When multiple transformers are enabled:

pipeline = transformers.reduce((acc, fn) => fn(acc), posts)

This creates a clean, functional pipeline.

### Post Detail View
Uses:

Promise.all([
  fetch(/posts/${id}),
  fetch(/users/${userId}),
  fetch(/comments?postId=${id})
])

Loads all necessary data in parallel.


## Testing the App

You can test:

Pagination by switching pages

Search by typing slowly and rapidly

Transformers by toggling different options

Detail view by clicking each post card