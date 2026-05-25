export const FormError = ({ message }: { message: string }) => {
  if (!message) return null;
  return (
    <div
      style={{
        background: "#fdf2f8",
        border: "1px solid #e74c3c",
        color: "#9d174d",
        padding: "0.6rem 1rem",
        borderRadius: "6px",
        fontSize: "0.82rem",
        fontWeight: 600,
        marginBottom: "1rem",
      }}
    >
      ⚠ {message}
    </div>
  );
};
