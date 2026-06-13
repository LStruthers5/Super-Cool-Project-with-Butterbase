export function generateStaticParams() {
  const ids = [
    // seed colleges
    "ucla", "usc", "skidmore", "hamilton",
    // catalog
    "stanford", "brown", "northwestern", "vanderbilt", "pomona",
    "umich", "tufts", "bu", "wisconsin", "davidson",
    "macalester", "occidental", "kenyon", "fordham", "syracuse",
    "psu", "clark", "asu", "uvm",
  ];
  return ids.map((id) => ({ id }));
}

export default function CollegeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
