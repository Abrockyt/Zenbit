export default function HomeIndicator() {
  return (
    <span
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 138,
        height: 5,
        borderRadius: 3,
        background: "rgba(255,255,255,.85)",
        zIndex: 30,
        pointerEvents: "none",
      }}
    />
  );
}
