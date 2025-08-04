import { BellOutlined } from "@ant-design/icons";
import { Badge, Dropdown, Menu, Spin } from "antd";
import { useEffect, useState } from "react";
import type { Notification } from "../../interfaces/NotificationProduct";
import { GetNotificationProducts } from "../../services/https/NotificaltionProduct/index";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const res = await GetNotificationProducts();
    if (res && !res.error) {
      setNotifications(res);
    } else {
      console.error(res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const notificationMenu = (
    <Menu>
      {notifications.length === 0 ? (
        <Menu.Item key="none" disabled>
          ไม่มีรายการแจ้งเตือน
        </Menu.Item>
      ) : (
        notifications.map((item) => (
          <Menu.Item key={item.product_id}>
            🧾 {item.product_name} (เหลือ {item.quantity})
          </Menu.Item>
        ))
      )}
    </Menu>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      placement="bottomRight"
      trigger={["click"]}
    >
      <span style={{ cursor: "pointer", marginRight: 24 }}>
        <Badge count={notifications.length} size="small">
          {loading ? <Spin /> : <BellOutlined style={{ fontSize: "20px" }} />}
        </Badge>
      </span>
    </Dropdown>
  );
}
