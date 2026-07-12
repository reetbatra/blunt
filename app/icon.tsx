import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 25%, #3d1d12 0%, #0a0a0a 55%)",
          color: "#f4f1ea",
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: -2,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 2,
            border: "1px solid rgba(255,77,0,0.28)",
            borderRadius: 8,
          }}
        />
        <span
          style={{
            transform: "translateX(-1px)",
            fontFamily: "sans-serif",
          }}
        >
          B
        </span>
        <span
          style={{
            position: "absolute",
            right: 7,
            bottom: 5,
            width: 5,
            height: 5,
            borderRadius: 9999,
            background: "#ff4d00",
            boxShadow: "0 0 10px rgba(255,77,0,0.85)",
          }}
        />
      </div>
    ),
    size,
  );
}
