# ⚡️ Premium Mobile E-Commerce Engine

![Live on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

<div align="center">
  <img src="./assets/hero-image.png" alt="Mobile E-Commerce Engine Main Dashboard" width="800" />
</div>
<br />

A high-performance, full-stack, cross-platform e-commerce application. It allows users to browse premium hardware, manage a persistent shopping cart, securely authenticate, and complete transactions. It features a dedicated Admin Dashboard for real-time order fulfillment, complete inventory management, and automated push notifications, backed by a custom enterprise-grade NestJS backend.

📖 **[Read the Full User Manual Here](./USER_MANUAL.md)**

## 🚀 Live Deployments

- 📱 **Mobile/Frontend (Vercel):** [https://mobile-ecommerce-engine-nygp.vercel.app](https://mobile-ecommerce-engine-nygp.vercel.app)
- ⚙️ **Backend API (Render/Vercel):** Custom NestJS API handling Authentication, TypeORM Transactions, and Push Notification dispatching.
- 🗄️ **Database (Supabase):** PostgreSQL hosting.

### 🔑 Live Demo Admin Access
To test the admin dashboard, inventory controls, and order management features on the live deployment, please log in with the following credentials:
- **Email:** `admin@admin.com`
- **Password:** `admin`

---

## ✨ Features & Architecture Breakdown

This application is divided into three core pillars: The Consumer Front-End, The Admin CMS, and the Node.js Backend Engine. 

### 🛍️ The Consumer Experience
* **Offline Resilience:** Global network listeners detect connection drops in real-time. If a user loses internet, the app renders a graceful fallback UI, allowing them to continue browsing cached products without crashing.
* **Smart Inventory Masking:** Products are deeply tied to the backend database. If an item's stock reaches zero, it dynamically hides from the public storefront to prevent dead-end browsing.
* **Premium UX & Haptics:** The interface utilizes frosted glass navigation bars (`expo-blur`), respects System Dark/Light Mode automatically, and triggers a custom tactile engine (`expo-haptics`) during cart additions and checkouts for a native, premium feel.
* **Persistent Cart State:** Built with React Context, the shopping cart maintains state across screens, instantly calculating totals and enforcing strict quantity limits based on actual warehouse stock.

### 🛡️ The Admin Control Center (CMS)
* **Role-Based Access:** Users flagged with `is_admin` privileges bypass the standard UI and are routed to a dedicated management dashboard.
* **Real-Time Order Fulfillment:** Admins can view a feed of all live orders. Marking an order as "Shipped" triggers the backend server to dispatch a physical Expo Push Notification directly to the customer's phone.
* **Optimistic UI Inventory Management:** Admins can adjust live stock numbers and edit product details using interactive steppers. The UI updates instantly (optimistically) while the backend silently synchronizes the data in the background, resulting in zero perceived loading times.

### ⚙️ The Backend Engine (NestJS)
* **ACID-Compliant Transactions:** Checkout processing is handled via TypeORM `QueryRunners`. If a user buys 3 laptops, the system deducts the stock and creates the order atomically. If any part of the process fails, the database rolls back, guaranteeing the warehouse never oversells.
* **Strict Security:** Custom NestJS migration away from BaaS logic. Authentication is secured using Passport, JSON Web Tokens (JWT), and BcryptJS password hashing.
* **Native Push Architecture:** Integrates `expo-notifications` and `expo-server-sdk`. The backend securely captures unique physical device tokens into the Postgres database, allowing for targeted alerting systems without third-party email providers.

---

## ⚙️ Tech Stack & Dependencies

### Runtimes
- **Node.js:** `v24.14.0`
- **npm:** `11.16.0`

### Frontend (Mobile/Web)
- **Framework:** React (`v19.2.3`), React Native (`v0.85.3`), Expo (`v56.0.9`)
- **Navigation:** Expo Router (File-based cross-platform routing)
- **State/API:** Axios, React Context, AsyncStorage
- **Builds:** Pre-configured `eas.json` profiles for native `.apk` and `.ipa` compilation.

### Backend & Database
- **Framework:** NestJS
- **ORM:** TypeORM
- **Security:** Passport, JWT, BcryptJS
- **Database:** PostgreSQL

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone [https://github.com/notrexxx/mobile-ecommerce-engine.git](https://github.com/notrexxx/mobile-ecommerce-engine.git)
cd mobile-ecommerce-engine
```

### 2. Start the NestJS Backend
```bash
cd backend
npm install
# Ensure you have your .env configured with DB and JWT secrets
npm run start:dev
```

### 3. Start the Mobile Frontend
Open a second terminal window:
```bash
cd mobile
npm install
# Ensure your .env points EXPO_PUBLIC_API_URL to your local NestJS server
npx expo start -c
```
*(Press 'w' to open in the web browser, 'i' for iOS simulator, or 'a' for Android emulator).*

## Author

👤 **Andres Leon**

- GitHub: [@notrexxx](https://github.com/notrexxx)
- LinkedIn: [Emigdio Leon](https://linkedin.com/emigdio-leon-689109195)