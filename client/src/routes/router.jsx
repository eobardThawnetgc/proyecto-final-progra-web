import { createBrowserRouter, redirect } from "react-router-dom";
import ErrorPage from "../pages/error/errorPage";

import AuthLayout from "../layout/authLayout";
import LoginPage from "../pages/auth/login";
import { getCurrentUser } from "../services/authService.js";
import { purchasesService } from "../services/purchasesService.js";
import { employeesService } from "../services/employeesService.js";


export const AppRouter = createBrowserRouter([
    {
        path: "/dashboard",
        loader: () => redirect("/compras"),
    },
    {
        path: "/compras",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();
                if (!['ADMIN', 'MANAGER'].includes(employee.role)) return { employee };

                const [{ purchases }, { suppliers }, { branches }] = await Promise.all([
                    purchasesService.list(), purchasesService.suppliers(), purchasesService.branches(),
                ]);
                return { employee, purchases, suppliers, branches };
            } catch (error) {
                if (error.status === 401) return redirect("/auth/login");
                throw error;
            }
        },
        lazy: async () => ({ Component: (await import("../pages/PurchasesPage.jsx")).default }),
        errorElement: <ErrorPage />,
    },
    {
        path: "/recursos-humanos",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();
                if (!['ADMIN', 'MANAGER'].includes(employee.role)) return redirect("/compras");
                const [{ employees: initialEmployees }, { branches }] = await Promise.all([
                    employeesService.list(), employeesService.branches(),
                ]);
                return { employee, initialEmployees, branches };
            } catch (error) {
                if (error.status === 401) return redirect("/auth/login");
                throw error;
            }
        },
        lazy: async () => ({ Component: (await import("../pages/EmployeesPage.jsx")).default }),
        errorElement: <ErrorPage />,
    },
    {
        path: "*",
        element: <ErrorPage />
    },
    {
        path: "/",
        loader: () => redirect("/dashboard"),
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
