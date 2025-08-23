import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Import your page components
import LoginPage from "./pages/loginPage";
import ChatPage from "./pages/chatpage";
import SignUpPage from "./pages/signUpPage"; 

// Define the routes for your application
const router = createBrowserRouter([
  {
    path: "/",
    element: <ChatPage />, 
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
  return <RouterProvider router={router} />;
}

export default App;