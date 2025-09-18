  //Frontend\src\utils\groupOrdersBySupplier.tsx
  // รวมรายการสั่งซื้อตาม supplier
  const groupOrdersBySupplier = (orders: any[]) => {
    return orders.reduce((acc: any, item) => {
      if (!acc[item.supply_name]) acc[item.supply_name] = [];
      acc[item.supply_name].push(item);
      return acc;
    }, {});
  };
export default groupOrdersBySupplier;