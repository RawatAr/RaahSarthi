# RaahSarthi — Smart stops. Smarter journeys.

![RaahSarthi SaaS Preview](client/public/favicon.ico)

RaahSarthi is a modern, premium SaaS routing application designed to help users plan intelligent journeys with multi-modal transport options, dynamic waypoint highlighting, and smart stop discovery.

## 🌟 Key Features

*   **Multi-Modal Routing:** Seamlessly switch between Driving, Walking, and Cycling modes. The application dynamically re-routes and visually updates the map paths (orange solid, green dashed, purple dotted).
*   **Intelligent Stop Discovery:** Find restaurants, gas stations, cafes, and hotels along your route within a specified corridor.
*   **Interactive Waypoints:** Add stops directly from suggestions or right-click the map to add custom waypoints. Waypoints are visually highlighted with distinct amber/orange numbered pins.
*   **User Accounts:** Secure registration and login using JWT authentication and MongoDB.
*   **SaaS Aesthetics:** Features a premium, glassmorphic UI with a coherent orange and black brand palette.
*   **Turn-by-turn Navigation & Elevation:** View detailed step-by-step directions and elevation profiles for your entire journey.
*   **Responsive Design:** Fully usable on both desktop and mobile devices via an interactive bottom-sheet sidebar.

## 🛠️ Technology Stack

*   **Frontend:** React (Vite), React Leaflet, Lucide Icons, Pure CSS (CSS Variables)
*   **Backend:** Node.js, Express, Mongoose (MongoDB)
*   **Mapping Engine:** Leaflet, OpenStreetMap
*   **Routing & APIs:** OSRM (Project OSRM) for routing, Nominatim for Geocoding, Google Places API (via proxy) for stops

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or newer)
*   MongoDB running locally on port `27017`

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/RawatAr/RaahSarthi.git
    cd RaahSarthi
    ```

2.  **Setup Backend (Server):**
    ```bash
    cd server
    npm install
    # Create a .env file based on .env configuration
    node index.js
    ```

3.  **Setup Frontend (Client):**
    ```bash
    cd ../client
    npm install
    npm run dev
    ```

4.  **Open the App!**
    Navigate your browser to `http://localhost:5173`.

## 🎨 Theme & Brand
RaahSarthi uses a bespoke Design System that focuses on dark charcoal backgrounds (`#111111`) complemented by a vibrant brand orange (`#F7941D`) and deep gradients.

---
*Built for smarter journeys.*
