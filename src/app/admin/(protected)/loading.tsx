export default function AdminLoading() {
  return (
    <div aria-label="Loading administration workspace" className="admin-page">
      <div className="admin-skeleton admin-skeleton-title" />
      <div className="admin-skeleton-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="admin-skeleton admin-skeleton-card" key={index} />
        ))}
      </div>
      <div className="admin-skeleton admin-skeleton-table" />
    </div>
  );
}
