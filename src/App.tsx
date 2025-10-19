import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

// Import your page and protected route components
import LoginPage from "./pages/loginPage";
import ChatPage from "./pages/chatpage";
import SignUpPage from "./pages/signUpPage";
import Home from "./pages/home";
import ProtectedRoute from "./components/auth/ProtectedRoute"; // 1. Import ProtectedRoute

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors />
    </>
  );
}

export default App;