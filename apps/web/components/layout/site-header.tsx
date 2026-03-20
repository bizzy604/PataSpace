export function SiteHeader() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #ddd4c3',
        background: '#fffaf1',
      }}
    >
      <strong>PataSpace</strong>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <a href="/">Home</a>
        <a href="/listings">Listings</a>
      </nav>
    </header>
  );
}
