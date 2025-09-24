import { lazy } from "react";
import type { RouteObject } from "react-router-dom";


import Loadable from "../third-party/Loadable";
import FullLayout from "../components/FullLayout/FullLayout";

const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));


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
    ],
  };
};

export default MainRoutes;