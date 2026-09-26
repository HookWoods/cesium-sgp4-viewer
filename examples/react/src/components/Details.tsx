import type { Satellite } from '@dsanchez31/cesium-sgp4-viewer';
import type { Viewer } from 'cesium';
import { useEffect, useState } from 'react';

import { onClockTick } from '../../../shared/clock';
import { describe, formatKm } from '../../../shared/format';

interface DetailsProps {
  viewer: Viewer;
  satellite: Satellite;
  /** Current altitude in metres, if the satellite is drawn. */
  altitudeOf: (satellite: Satellite) => number | undefined;
  onClose: () => void;
}

/** The selected satellite's elements, and its altitude now. */
export const Details = ({ viewer, satellite, altitudeOf, onClose }: DetailsProps) => {
  const [altitude, setAltitude] = useState<number | undefined>(undefined);

  useEffect(
    () => onClockTick(viewer, () => setAltitude(altitudeOf(satellite)), 250),
    [viewer, satellite, altitudeOf],
  );

  return (
    <aside className="panel details">
      <button type="button" className="close" aria-label="Close" onClick={onClose}>
        ×
      </button>
      <h2>{satellite.name}</h2>
      <dl>
        {describe(satellite).map(([term, value]) => (
          <div key={term} style={{ display: 'contents' }}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <dt>Altitude</dt>
        <dd>{altitude === undefined ? '…' : formatKm(altitude)}</dd>
      </dl>
    </aside>
  );
};
