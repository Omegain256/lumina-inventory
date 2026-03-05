# Lumina Inventory - Implementation Guide

A premium, all-in-one inventory management and POS system with Role-Based Access Control (RBAC) and thermal receipt printing.

## 🚀 Quick Setup & Deployment

For a full step-by-step deployment guide (Firebase, Vercel, and Production rules), please refer to the [Deployment Workflow](.agents/workflows/deploy.md).

### 1. Firebase Configuration
Ensure your `src/config/firebase.js` is populated with your project credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Firestore Collections
The system uses the following collections:
- `products`: Product inventory data.
- `sales`: Transaction records.
- `customers`: Customer details.
- `users`: User profiles and roles (admin, manager, staff).
- `workshifts`: Employee session tracking.
- `repairs`: Service and repair jobs.

---

## 🔐 User Levels & Permissions

The system implements Role-Based Access Control (RBAC) to ensure data security.

| Feature | Staff | Manager | Admin |
| :--- | :---: | :---: | :---: |
| POS & Sales | ✅ | ✅ | ✅ |
| Repair Jobs | ✅ | ✅ | ✅ |
| Inventory Audit | ❌ | ✅ | ✅ |
| Financial Reports | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |

### How to Assign Roles
1. Log in with the **Admin** account (`demo@lumina.com`).
2. Navigate to **Settings > User Management**.
3. Use the dropdown to assign roles to registered users.

---

## 🖨️ Receipt Printing
The system generates receipts optimized for **80mm thermal printers**.

- **POS Receipts**: Appear automatically after a successful sale.
- **Repair Receipts**: Accessible via the 🖨️ icon on any repair job card.
- **Preview**: The layout uses browser print APIs with CSS `@media print` rules for a clean, professional finish.

---

## 📊 Core Modules

### Dashboard Overview
Real-time tracking of:
- **Total Revenue**: Sum of all sales.
- **Low Stock Alerts**: Automatically highlights products with < 10 units.
- **Recent Activity**: Live feed of the latest sales transactions.

### Workshift Tracking
- Employees can **Start Shift** to begin tracking their daily performance.
- When a shift is **Ended**, the system automatically calculates total sales and quantity sold during that specific period.

---

## 🛠️ Performance & Tech Stack
- **Frontend**: React + Vite
- **Styling**: Vanilla CSS + Tailwind CSS (Glassmorphism design)
- **Database**: Firebase Firestore (Real-time updates)
- **Auth**: Firebase Authentication
- **Icons**: Lucide React
