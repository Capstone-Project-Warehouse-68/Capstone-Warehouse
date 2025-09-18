import { lazy } from "react";
import type { RouteObject } from "react-router-dom";


import Loadable from "../third-party/Loadable";
import FullLayout from "../components/FullLayout/FullLayout";
//User
const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));
const NotificationProduct = Loadable(lazy(() => import("../pages/NotificationProduct/notificationproduct")));
const ProductList = Loadable(lazy(() => import("../pages/ShowProduct/index")));
const OrderCreate = Loadable(lazy(() => import("../pages/CreateListProductPDF/index")));
const HistoryPdf = Loadable(lazy(() => import("../pages/CreateListProductPDF/History/HistoryPdf")));
const Dashboard = Loadable(lazy(() => import("../pages/Dashboard/index")));
//Course

const MainRoutes = (): RouteObject => {

  return {
    path: "/",
    element: <FullLayout />,
    children: [
      {
        path: "/",
        element: <MainPages />,
      },
      {
        path: "*",
        element: <MainPages />,
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
      {
        path: "/dashboard",
        element: < Dashboard/>,
      },
    ],
  };
};

export default MainRoutes;