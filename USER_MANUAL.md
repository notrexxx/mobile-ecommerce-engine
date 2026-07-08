# 📖 Tech Store - User Manual

Welcome to the Tech Store platform! This application operates with dual environments: a public-facing storefront for customers, and a secured backend interface for administrators.

## 🛒 Customer Guide

### 1. Browsing & Authentication
* **Storefront:** Upon opening the app, users can freely browse the inventory. Items that are out of stock are automatically hidden or marked unavailable.
* **Accounts:** To add items to the cart, users must create an account. Passwords are encrypted instantly.
* **Offline Mode:** If you lose network connection (e.g., entering a subway), the app will display a global offline banner, but you can continue browsing cached products.

### 2. Checkout & Orders
* **Cart Management:** Adjust quantities directly in the cart. The app will prevent you from adding more items than currently exist in the warehouse.
* **Checkout:** Completing a purchase instantly deducts the stock from the live database to prevent double-selling.
* **Notifications:** Ensure you allow Push Notifications upon login. You will receive an instant alert on your device the moment an administrator ships your order.

---

## 🛠️ Administrator Guide

Admin accounts have a unique layout and access to the **CMS Dashboard**. 

*To test this locally, change your user role to `admin` in your Postgres database.*

### 1. Inventory Management
* **Adding Products:** Navigate to the Admin Dashboard to add new inventory. You must provide a Name, Description, Price, Stock count, Category, and Image URL.
* **Stock Adjustments:** You can click on any existing product to update its available stock or tweak pricing.

### 2. Order Fulfillment
* **Viewing Orders:** The Admin panel displays a real-time feed of all customer orders.
* **Shipping:** Clicking "Mark as Shipped" on an order will update the database and instantly fire an Expo Push Notification to the customer's physical phone.