import { BellOutlined } from "@ant-design/icons";
import { Badge, Dropdown, Menu, Spin } from "antd";
import { useEffect, useState } from "react";
import type { Notification } from "../../interfaces/NotificationProduct";
import { GetNotificationProducts } from "../../services/https/NotificaltionProduct/index";
import { listenEvent } from "../../utils/eventBus";

type NotificationBellProps = {
  size?: number; // สำหรับ icon
  badgeSize?: "small" | "default"; // ต้องตรง type
};
export default function NotificationBell({ size = 20, badgeSize = "small" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

const fetchNotifications = async () => {
  try {
    setLoading(true); // กันเผื่อ fetch ซ้ำ
    const res = await GetNotificationProducts();

    if (res && !res.error) {
      setNotifications(res);
    } else {
      setNotifications([]); // กันไว้เวลา error
      console.error(res?.error);
    }
  } catch (err) {
    console.error(err);
    setNotifications([]);
  } finally {
    setLoading(false); // สำคัญ! จะได้ปิด spin เสมอ
  }
};


  useEffect(() => {
    fetchNotifications();
     // ฟัง event refreshNotifications
    const unsubscribe = listenEvent("refreshNotifications", () => {
      fetchNotifications();
    });

    return () => unsubscribe();
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
        <Badge count={notifications.length} size={badgeSize}>
          {loading ? (<Spin />) : (<BellOutlined style={{ fontSize: size }} />)}
        </Badge>
      </span>
    </Dropdown>
  );
}
