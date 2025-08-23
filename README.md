# PixelChat: Real-Time Chat Application

![PixelChat Chat Interface](https://i.imgur.com/your-screenshot-url.png)
*(Replace the URL above with a screenshot of your application)*

PixelChat is a modern, full-stack, real-time chat application built with React, TypeScript, and Node.js. It features a clean, responsive UI inspired by platforms like Discord and WhatsApp, and provides a complete, feature-rich communication experience.

---
## ✨ Features

* **Secure User Authentication:** Full user registration and login functionality using JWT (JSON Web Tokens) for secure, session-based authentication.
* **Real-Time One-on-One & Group Chats:** Instant messaging in both private and group chat rooms, powered by a robust WebSocket implementation with Socket.IO.
* **User Presence Indicators:** See which users are currently "online" or "offline" and get real-time "is typing..." feedback during conversations.
* **File & Image Sharing:** Seamlessly upload and share images and documents within any chat, with files stored securely in the cloud.
* **End-to-End Encryption (E2EE):** A robust security model ensuring that only the sender and intended recipients can read message contents.
* **User Profiles & Settings:** A dedicated page for users to view and update their profile information, including their username and avatar.
* **Modern UI:** A sleek and responsive user interface built with **Vite**, **React**, **TypeScript**, and styled with **Shadcn UI** & **Tailwind CSS**.
* **Scalable Backend:** A powerful backend built with **Node.js**, **Express**, and **TypeScript** for type safety and maintainability.

---
## 💻 Tech Stack

This project is built with a modern, full-stack technology set.

### Frontend
| Technology | Description |
| :--- | :--- |
| **Vite** | Next-generation frontend tooling for a fast development experience. |
| **React** | A JavaScript library for building user interfaces. |
| **TypeScript**| A typed superset of JavaScript that compiles to plain JavaScript. |
| **Shadcn UI** | A collection of beautifully designed, accessible UI components. |
| **Tailwind CSS** | A utility-first CSS framework for rapid UI development. |
| **Socket.IO Client**| Real-time, bidirectional event-based communication. |
| **Axios** | A promise-based HTTP client for making API requests. |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js** | A JavaScript runtime built on Chrome's V8 JavaScript engine. |
| **Express.js** | A minimal and flexible Node.js web application framework. |
| **TypeScript**| Adds static typing to enhance code quality and maintainability. |
| **MongoDB** | A NoSQL database for storing user and message data. |
| **Mongoose** | An elegant MongoDB object modeling tool for Node.js. |
| **Socket.IO** | Enables real-time, bidirectional communication between clients and server.|
| **JWT** | JSON Web Tokens for secure user authentication. |
| **Bcrypt.js** | A library for hashing passwords securely. |

---
## 🏛️ Architectural Design: Object-Oriented Principles

The backend is architected using key Object-Oriented Programming (OOP) principles to ensure the system is scalable, modular, and maintainable.

* **Encapsulation:** Core entities like `User`, `Message`, and `ChatRoom` are modeled as classes, encapsulating their data (properties) and behavior (methods) to protect their internal state and maintain a clear API.
* **Inheritance:** A base `Message` class is extended by specialized classes like `TextMessage` and `FileMessage`, promoting code reuse and a logical class hierarchy.
* **Polymorphism:** The application can process various message types through a common interface, allowing for flexible and extensible handling of different kinds of chat content.

---
## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
* Node.js (LTS version) installed
* npm (comes with Node.js)
* A MongoDB Atlas account or a local MongoDB instance

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/pixelchat.git](https://github.com/your-username/pixelchat.git)
    cd pixelchat
    ```

2.  **Set up the Backend:**
    ```sh
    # Navigate to the server directory
    cd server

    # Install backend dependencies
    npm install

    # Create a .env file in the /server directory and add your variables
    # MONGO_URI=your_mongodb_connection_string
    # JWT_SECRET=your_jwt_secret

    # Start the backend server
    npm run dev
    ```

3.  **Set up the Frontend:**
    ```sh
    # Open a new terminal and navigate to the project's root directory
    cd ..

    # Install frontend dependencies
    npm install

    # Start the frontend development server
    npm run dev
    ```

Your application should now be running, with the frontend available at `http://localhost:5173` and the backend at `http://localhost:5000`.