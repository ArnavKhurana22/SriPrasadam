import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="page" style={{ textAlign: 'center', paddingBlock: '40px' }}>
        <p className="eyebrow">Page not found</p>
        <h1>This page does not exist</h1>
        <p className="lede" style={{ marginInline: 'auto' }}>
          The page you were looking for may have moved. Let us take you back to the offerings.
        </p>
        <p style={{ marginTop: '26px' }}>
          <Link to="/" className="btn btn--primary">
            Go to the home page
          </Link>
        </p>
      </div>
    </section>
  )
}
