// The public site is all caps (see `body` in app/globals.css). Admin opts out:
// slugs, URLs, emails and long descriptions are far easier to check and edit
// in normal case.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="normal-case">{children}</div>
}
