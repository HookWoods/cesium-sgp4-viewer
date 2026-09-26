import {
  DEFAULT_REGIME_COLORS,
  ORBIT_REGIMES,
  type OrbitRegime,
} from '@dsanchez31/cesium-sgp4-viewer';

interface RegimeFilterProps {
  /** `null` means every regime. */
  value: OrbitRegime[] | null;
  onChange: (regimes: OrbitRegime[] | null) => void;
}

/** One checkbox per regime, doubling as the colour legend. */
export const RegimeFilter = ({ value, onChange }: RegimeFilterProps) => {
  const checked = value ?? [...ORBIT_REGIMES];
  const toggle = (regime: OrbitRegime) => {
    const next = ORBIT_REGIMES.filter((r) => (r === regime) !== checked.includes(r));
    onChange(next.length === ORBIT_REGIMES.length ? null : next);
  };

  return (
    <fieldset className="regimes" aria-label="Orbit regimes">
      {ORBIT_REGIMES.map((regime) => (
        <label key={regime}>
          <input
            type="checkbox"
            checked={checked.includes(regime)}
            onChange={() => toggle(regime)}
          />
          <span className="swatch" style={{ background: DEFAULT_REGIME_COLORS[regime] }} />
          {regime}
        </label>
      ))}
    </fieldset>
  );
};
