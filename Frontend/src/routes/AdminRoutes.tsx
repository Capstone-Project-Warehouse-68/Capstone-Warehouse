import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import Loadable from "../third-party/Loadable";

import FullLayout from "../components/FullLayout/FullLayout";

const SignInPages = Loadable(lazy(() => import("../pages/authentication/Login/index.tsx")));
const NotificationProduct = Loadable(lazy(() => import("../pages/NotificationProduct/notificationproduct")));
const ProductList = Loadable(lazy(() => import("../pages/ShowProduct/index")));
const OrderCreate = Loadable(lazy(() => import("../pages/CreateListProductPDF/index")));
const HistoryPdf = Loadable(lazy(() => import("../pages/CreateListProductPDF/History/HistoryPdf")));
const Dashboard = Loadable(lazy(() => import("../pages/Dashboard/index")));

const AdminRoutes = (isLoggedIn: boolean): RouteObject => {

    return {
        path: "/",
        element: isLoggedIn ? <FullLayout /> : <SignInPages />,
        children: [
            {
                path: "/dashbord",
                element: <Dashboard />,
            },
            {
                path: "/notificationproduct",
                element: <NotificationProduct />,
            },
            {
                path: "/productList",
                element: <ProductList />,
            },
            {
                path: "/createlistproduct",
                element: <OrderCreate />,
            },
            {
                path: "/historylistproduct",
                element: <HistoryPdf />,
            },
        ],
    };
};

export default AdminRoutes;