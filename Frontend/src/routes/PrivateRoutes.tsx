import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  element: React.ReactElement;
  allowedRoles: string[]; // role ที่อนุญาต
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, allowedRoles }) => {
  const role = localStorage.getItem("role") || "";

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/productList" replace />;
  }

  return element;
};

export default PrivateRoute;
