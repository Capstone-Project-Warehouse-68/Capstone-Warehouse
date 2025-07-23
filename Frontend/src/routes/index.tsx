import type { RouteObject } from "react-router-dom";
import { useRoutes } from "react-router-dom";
// import AdminRoutes from "./AdminRoutes";
import MainRoutes from "./MainRoutes";


function ConfigRoutes() {
    //const isLoggedIn = localStorage.getItem("isLogin") === "true";
    let routes: RouteObject[] = [];
    routes = [MainRoutes()];

    // if (isLoggedIn) {
    //     routes = [AdminRoutes(isLoggedIn), MainRoutes()];
    // } else {
    //     routes = [MainRoutes()];
    // }

    return useRoutes(routes);
}

export default ConfigRoutes;