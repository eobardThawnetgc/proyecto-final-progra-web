import { createBrowserRouter } from "react-router-dom";
import ErrorPage from "../pages/error/errorPage";

import AuthLayout from "../layout/authLayout";
import LoginPage from "../pages/auth/login";


export const AppRouter = createBrowserRouter([
    {
        path: "*",
        element: <ErrorPage />
    },
    {
        path: "/",
        element: <></>, //general layout
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <></>
            },
            {
                path: "/",
                element: <></>
            },
        ]
    },
    {
        path: "/auth",
        element: <AuthLayout/>, //general layout
        errorElement: <ErrorPage />,
        children: [
            {
                path: "login",
                element: <LoginPage/>
            }
        ]
    }
]);