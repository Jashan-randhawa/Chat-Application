# Deployment Guide — Render (Backend) + Vercel (Frontend)

---

## 1. Deploy Backend to Render

### Steps
1. Push `chatapp-server-master/` to a GitHub repo (can be a separate repo or a monorepo).
2. Go to [https://dashboard.render.com](https://dashboard.render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Root Directory:** `chatapp-server-master` (if monorepo)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`

### Environment Variables (set in Render dashboard)
| Key | Value |
|-----|-------|
| `NODE_ENV` | `PRODUCTION` |
| `PORT` | `10000` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random string |
| `ADMIN_SECRET_KEY` | Any secret for admin panel |
| `CLIENT_URL` | Your Vercel frontend URL (e.g. `https://my-chat.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

5. Click **Create Web Service**. Render will give you a URL like:
   `https://chatapp-server-xxxx.onrender.com`

> ⚠️ **Free tier note:** Render free services spin down after 15 min of inactivity. The first request after sleep takes ~30s. Upgrade to a paid plan for production.

---

## 2. Deploy Frontend to Vercel

### Steps
1. Push `chatapp-frontend-master/` to GitHub.
2. Go to [https://vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `chatapp-frontend-master` (if monorepo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Environment Variables (set in Vercel dashboard → Settings → Environment Variables)
| Key | Value |
|-----|-------|
| `VITE_SERVER` | Your Render backend URL (e.g. `https://chatapp-server-xxxx.onrender.com`) |

4. Click **Deploy**. Vercel gives you a URL like:
   `https://my-chat.vercel.app`

5. **Go back to Render** and set `CLIENT_URL` to your Vercel URL.

---

## 3. After Both Are Deployed

- Open your Vercel URL in **two different browsers** (or devices).
- Log in as two different users.
- Open a 1-on-1 chat → click the 📞 phone icon to test voice calls.

---

## 4. Checklist

- [ ] Backend deployed on Render with all env vars set
- [ ] Frontend deployed on Vercel with `VITE_SERVER` pointing to Render
- [ ] `CLIENT_URL` on Render set to your Vercel domain
- [ ] MongoDB Atlas IP whitelist set to `0.0.0.0/0` (allow all) or Render's IPs
- [ ] Cloudinary credentials added
- [ ] Voice call tested across two devices/networks

---

## 5. Socket.IO on Render

Render supports WebSockets natively on all plans — no extra config needed. Socket.IO will work out of the box.
