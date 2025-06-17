import { LoadingOutlined } from "@ant-design/icons";

const Loader: React.FC = () => (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      zIndex: 2000,
      width: "100%",
      height: "100%",
    }}
  >
    <LoadingOutlined
      style={{
        fontSize: 100,
        color: "#180731",
      }}
      spin
    />
  </div>
);

export default Loader;