# PassOP
## Dockerized setup

This project includes a Dockerized setup for local or simple deployments.

Services:
- MongoDB (mongo:7)
- Backend (Node.js Express)
- Web (React build served by Nginx, proxies /api to backend)

### Quick start

1. Create a `.env` file at repo root based on `.env.example` and set `AUTH_SECRET` and `AUTH_PASSWORD_HASH`.
2. Start the stack:

```sh
docker compose up --build
```

3. Open the app: http://localhost:5173

API will be available at http://localhost:3000 and proxied via Nginx at http://localhost:5173/api

### Notes
- Web container builds with `VITE_API_BASE=/` so it uses relative `/api` which is routed by Nginx to backend.
- Backend connects to `mongo` service; data volume persists in `mongo_data` volume.
- To stop: `docker compose down`

# 🛡️ PaasOP - Password Manager

A simple and secure password manager built with **React (Vite)**, **Node.js**, **Express**, and **MongoDB**.

This app allows users to save, edit, view, and delete website login credentials. Designed for learning and local use.

---

## 🚀 Features

- 💾 Save passwords (site, username, password)
- 👁️ Toggle password visibility (eye/eyecross icons)
- 📋 Copy to clipboard
- ✏️ Edit and update passwords
- 🗑️ Confirm before delete
- 🔃 Synced with MongoDB
- ✅ Toast notifications for actions
- 🎯 Clean, responsive UI with Navbar & Footer

---

## 🛠️ Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | React + Vite, Tailwind CSS, Toastify |
| Backend    | Node.js, Express    |
| Database   | MongoDB (local)     |

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Tarun-Gautam-915/PassOP-Mongo-Version.git
cd paasop-password-manager
```

### 2. Start the Backend

```bash
cd backend
npm install
node server.js
```

> Backend runs at: `http://localhost:3000`

Make sure MongoDB is running locally on `mongodb://localhost:27017`.

### 3. Start the Frontend

```bash
cd ..
npm install
npm run dev
```

> Vite will start your React app (usually on `http://localhost:5173`)

---

## 📁 Project Structure

```
PASSOP-MANAGER/
│
├── backend/
│   ├── server.js               # Express server
│   ├── .env                    # Environment variables
│   └── package.json            # Backend dependencies
│
├── public/
│   └── icons/                  # PNG icons used in the app
│       ├── eye.png
│       ├── eyecross.png
│       ├── github.png
│       ├── heart.png
│       └── favicon.png
│
├── src/
│   ├── assets/
│   │   └── react.svg
│   │
│   ├── components/
│   │   ├── Manager.jsx         # Main password manager UI
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   └── Footer.jsx          # Bottom footer
│   │
│   ├── App.jsx                 # App layout and routing
│   ├── App.css
│   ├── index.css
│   └── main.jsx                # React entry point
│
├── index.html                  # Vite entry HTML
├── vite.config.js              # Vite config
├── package.json                # Frontend dependencies
└── README.md                   # You're here!
```


## 🧩 Recent Fixes

- ✅ Fixed new password overwrite issue by improving save logic
- ✅ Prevented toast from showing when delete was cancelled

---


## 👨‍💻 Author

Built by Tarun (https://github.com/Tarun-Gautam-915)  
Feel free to fork, contribute, or give a ⭐!

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
