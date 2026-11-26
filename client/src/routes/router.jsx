import { createBrowserRouter, redirect } from "react-router-dom";
import ErrorPage from "../pages/error/errorPage";
import { payrollService } from "../services/payrollService.js";

import AuthLayout from "../layout/authLayout";
import LoginPage from "../pages/auth/login";
import { getCurrentUser } from "../services/authService.js";
import { purchasesService } from "../services/purchasesService.js";
import { employeesService } from "../services/employeesService.js";
import { cashService } from "../services/cashService.js";
import { billingService } from "../services/billingService.js";
import { productsService } from "../services/productsService.js";


export const AppRouter = createBrowserRouter([
    {
        path: "/dashboard",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();
                return redirect(employee.role === 'CASHIER' ? '/caja' : '/productos');
            } catch (error) {
                if (error.status === 401) return redirect('/auth/login');
                throw error;
            }
        },
    },
    {
        path: "/ventas",
        loader: async () => {
            try {
                await getCurrentUser();
                return redirect('/facturacion');
            } catch (error) {
                if (error.status === 401) return redirect("/auth/login");
                throw error;
            }
        },
    },
    {
        path: "/productos",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();
                const [catalog, options] = await Promise.all([
                    productsService.list({ active: 'true' }), productsService.options(),
                ]);
                return { employee, products: catalog.products, ...options };
            } catch (error) {
                if (error.status === 401) return redirect('/auth/login');
                throw error;
            }
        },
        lazy: async () => ({ Component: (await import('../pages/ProductsPage.jsx')).default }),
        errorElement: <ErrorPage />,
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

    // Ruta del módulo de Nómina.
    {
        path: "/nomina",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();

                // Solo administradores y gerentes pueden acceder.
                if (!["ADMIN", "MANAGER"].includes(employee.role)) {
                    return redirect("/compras");
                }

                // Cargamos los empleados y las planillas registradas.
                const [{ employees }, { payrolls }] = await Promise.all([
                    payrollService.employees(),
                    payrollService.list()
                ]);

                return { employee, employees, payrolls };

            } catch (error) {
                if (error.status === 401) {
                    return redirect("/auth/login");
                }

                throw error;
            }
        },
        lazy: async () => ({
            Component: (await import("../pages/PayrollPage.jsx")).default
        }),
        errorElement: <ErrorPage />,
    },

      {
        path: "/caja",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();
                if (!['ADMIN', 'MANAGER', 'CASHIER'].includes(employee.role)) return redirect('/compras');
                const [current, history] = await Promise.all([
                    cashService.current(), cashService.sessions(),
                ]);
                return { employee, session: current.session, sessions: history.sessions };
            } catch (error) {
                if (error.status === 401) return redirect('/auth/login');
                throw error;
            }
        },
        lazy: async () => ({ Component: (await import("../pages/CashPage.jsx")).default }),
        errorElement: <ErrorPage />,
    },
    {
        path: "/facturacion",
        loader: async () => {
            try {
                const { employee } = await getCurrentUser();
                if (!['ADMIN', 'MANAGER', 'CASHIER'].includes(employee.role)) return redirect('/compras');
                return { employee, ...(await billingService.data()) };
            } catch (error) {
                if (error.status === 401) return redirect('/auth/login');
                throw error;
            }
        },
        lazy: async () => ({ Component: (await import("../pages/BillingPage.jsx")).default }),
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
