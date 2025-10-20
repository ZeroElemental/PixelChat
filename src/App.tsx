import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

// Import your page and protected route components
import LoginPage from "./pages/loginPage";
import ChatPage from "./pages/chatpage";
import SignUpPage from "./pages/signUpPage";
import Home from "./pages/home";
import NotFound from "./pages/notFound";
import ProtectedRoute from "./components/auth/ProtectedRoute"; // 1. Import ProtectedRoute
import NavBar from "./components/NavBar";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <NavBar />
        <Home />
      </>
    ),
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute>
        <NavBar />
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
  {
    path: "*",
    element: <NotFound />,
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