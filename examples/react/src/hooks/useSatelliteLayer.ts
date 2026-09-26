import {
  type LabelMode,
  type OrbitRegime,
  type PropagationStatus,
  type Satellite,
  SatelliteLayer,
} from '@dsanchez31/cesium-sgp4-viewer';
import type { Viewer } from 'cesium';
import { useEffect, useRef, useState } from 'react';

import { searchPredicate } from '../../../shared/format';

export interface LayerSettings {
  orbits: boolean;
  labels: LabelMode;
  regimes: OrbitRegime[] | null;
  query: string;
}

// The layer is an external, mutable object: these write to it outside of the
// components, which treat what they hold as immutable.
const applyOrbits = (layer: SatelliteLayer, orbits: boolean) => {
  layer.orbits = orbits;
};
const applyLabels = (layer: SatelliteLayer, labels: LabelMode) => {
  layer.labels = labels;
};

/**
 * A `SatelliteLayer` for the catalog, kept in step with `settings`. Recreated
 * when the viewer or the catalog changes; settings are applied in place.
 */
export const useSatelliteLayer = (
  viewer: Viewer | null,
  satellites: readonly Satellite[] | null,
  settings: LayerSettings,
) => {
  const layerRef = useRef<SatelliteLayer | null>(null);
  const settingsRef = useRef(settings);
  const [selected, setSelected] = useState<Satellite | null>(null);
  const [status, setStatus] = useState<PropagationStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Declared first: the creation effect below reads the latest settings.
  useEffect(() => {
    settingsRef.current = settings;
  });

  useEffect(() => {
    if (!viewer || !satellites) return;
    const { orbits, labels, regimes, query } = settingsRef.current;
    const layer = new SatelliteLayer(viewer, { satellites, orbits, labels });
    layer.setRegimes(regimes);
    layer.setFilter(searchPredicate(query));
    layerRef.current = layer;

    const unsubscribe = [
      layer.on('select', setSelected),
      layer.on('update', (next) => {
        setStatus(next);
        setError(null);
      }),
      layer.on('error', setError),
    ];
    return () => {
      for (const off of unsubscribe) off();
      layer.destroy();
      layerRef.current = null;
    };
  }, [viewer, satellites]);

  useEffect(() => {
    if (layerRef.current) applyOrbits(layerRef.current, settings.orbits);
  }, [settings.orbits]);

  useEffect(() => {
    if (layerRef.current) applyLabels(layerRef.current, settings.labels);
  }, [settings.labels]);

  useEffect(() => {
    layerRef.current?.setRegimes(settings.regimes);
  }, [settings.regimes]);

  useEffect(() => {
    layerRef.current?.setFilter(searchPredicate(settings.query));
  }, [settings.query]);

  // A selection made on a previous catalog no longer means anything.
  const current = selected && satellites?.includes(selected) ? selected : null;
  return { layerRef, selected: current, status, error };
};
