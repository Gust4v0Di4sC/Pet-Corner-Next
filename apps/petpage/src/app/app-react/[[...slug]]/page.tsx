// This route captures /app-react/* and serves the legacy SPA shell.
export default function ReactApp() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <iframe
        src="/app-react/index.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          margin: 0,
          padding: 0,
        }}
        title="React Application"
      />
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
