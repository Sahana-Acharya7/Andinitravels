# Andini Travels - Integrated Admin & Driver Portal

A high-performance, unified management ecosystem designed for Andini Travels. This platform bridges the gap between administrative operations and field drivers, providing real-time synchronization, automated logistics, and comprehensive business intelligence.

## 🌟 Core Portals

### 🏢 Admin Dashboard
The nerve center for operations, designed for efficiency and data integrity.
- **Dynamic Booking Engine**: Support for Round Trip, One Way, Drop, and Pick-up with complex fare logic.
- **Outsourced (Vendor) Fleet Management**: Dedicated workflow for third-party driver integration with dual-rate pricing (`Customer Fare` vs `Driver Payout`).
- **Financial Intelligence**: Built-in fare calculators accounting for tolls, state taxes, driver allowances, and automatic **Company Margin** calculation for outsourced trips.
- **Business Reporting**: Detailed analytics on revenue, expenses, net profit, and individual driver performance metrics.
- **Premium UI/UX**: State-of-the-art interface with a built-in **Dark Mode** toggle and persistent theme state.
- **WhatsApp Automation**: One-click itinerary generation for seamless customer communication.

### 🚗 Driver Portal
A mobile-first experience for drivers to manage their schedules and documentation.
- **Intelligent Dashboard**: Real-time view of assigned, active, and completed trips with active trip tracking.
- **Financial Guidance**: Clear instruction on amounts to **Collect from Customer** (especially for vendor trips).
- **Secure Document Vault**: Integrated upload system for Aadhaar, DL, and vehicle documentation.
- **Trip Execution**: Detailed route and customer information with one-touch navigation and automated pre-filled WhatsApp messaging.
- **Expense Submission**: Post-trip reconciliation form allowing drivers to submit tolls, parking, and additional kilometers.

## 💻 Tech Stack

- **Frontend**: React 19 (Vite)
- **Real-time Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (Multi-role support)
- **Cloud Storage**: Supabase Storage (Optimized for secure document handling)
- **Data Visualization**: Recharts (Customized business metrics)
- **Theme Engine**: Custom CSS variable-based design system with full Dark Theme support.

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- Firebase Project with Firestore and Auth enabled
- Supabase Project with a Storage bucket named `driver-documents`

### Installation

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/your-repo/andini-admin.git
    cd andini-admin
    npm install
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    # Firebase Configuration
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
    VITE_FIREBASE_APP_ID=your_id

    # Supabase Configuration
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_SUPABASE_DRIVER_BUCKET=driver-documents
    ```

3.  **Development Workflow**:
    ```bash
    npm run dev
    ```

## 📁 Project Architecture

```text
src/
├── components/       # Reusable UI components, Layouts, and Protected Routes
├── context/          # Global state management (Auth, Theme)
├── pages/
│   ├── admin/        # Admin-exclusive interfaces (Bookings, Drivers, Reports)
│   └── driver/       # Driver-exclusive interfaces (Trips, Profile, Earnings)
├── utils/            # Helper functions for calculations and uploads
└── firebase.js       # Firebase client initialization
```

## 🔐 Security & Integration

This project implements a unique **Hybrid Cloud Strategy**:
- **Authentication**: Centralized via Firebase.
- **Data**: Firestore handles all transactional and relational data.
- **Assets**: Supabase Storage manages high-resolution driver documents.
- **Role-Based Access Control (RBAC)**: Enforced via `ProtectedRoute.jsx` and custom Firebase claims.
- **Driver Classification**: Support for both `COMPANY_DRIVER` and `ATTACHED_DRIVER` (Third-party vendors) with filtered assignment logic.

---
*Developed for Andini Travels.*
