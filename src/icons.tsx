const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const IconToday = () => <I d="M12 3 4 8v8l8 5 8-5V8zM9 13l3-4 3 4" />;
export const IconQuests = () => <I d="M6 4h12v16l-6-3-6 3zM9.5 9h5M9.5 12.5h5" />;
export const IconAreas = () => <I d="M12 4v5M12 9 6 14M12 9l6 5M6 14v5M18 14v5M12 9v10" />;
export const IconChronicle = () => <I d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" />;
export const IconPlus = () => <I d="M12 5v14M5 12h14" />;
export const IconSettings = () => <I d="M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4" />;
export const IconBack = () => <I d="M15 5l-7 7 7 7" />;
