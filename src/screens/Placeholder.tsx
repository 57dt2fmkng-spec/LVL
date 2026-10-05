export function Placeholder({ title, headline, text }: { title: string; headline: string; text: string }) {
  return (
    <>
      <h1>{title}</h1>
      <div className="empty">
        <b>{headline}</b>
        {text}
      </div>
    </>
  );
}
