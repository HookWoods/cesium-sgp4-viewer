import {
  Cartesian3,
  JulianDate,
  Matrix3,
  Matrix4,
  type Scene,
  SceneMode,
  TimeInterval,
  Transforms,
} from 'cesium';

/** How much Earth-orientation data to request around the current time. */
const PRELOAD_MARGIN_DAYS = 2;

/**
 * Holds the camera still in the inertial frame (ICRF), so the Earth turns under
 * it as the clock runs, the way it does seen from space. Orbits then keep their
 * shape on screen instead of sweeping round with the ground.
 *
 * Works in 3D only; in 2D and during a morph the camera is left alone. The
 * rotation needs Cesium's Earth-orientation tables, which are fetched on demand
 * from the Cesium assets (`Assets/IAU2006_XYS`): until they arrive the globe
 * simply does not turn.
 *
 * Returns a function that releases the camera.
 *
 * @example
 * const release = enableInertialCamera(viewer.scene);
 * // later
 * release();
 */
export const enableInertialCamera = (scene: Scene): (() => void) => {
  const icrfToFixed = new Matrix3();
  const fixedToIcrf = new Matrix3();
  const transform = new Matrix4();
  const offset = new Cartesian3();
  /** Whether the camera is already expressed in the inertial frame. */
  let pinned = false;
  let loading = false;
  let loadedUntil: JulianDate | undefined;
  let loadedFrom: JulianDate | undefined;

  const preload = (time: JulianDate) => {
    if (loading) return;
    loading = true;
    const start = JulianDate.addDays(time, -PRELOAD_MARGIN_DAYS, new JulianDate());
    const stop = JulianDate.addDays(time, PRELOAD_MARGIN_DAYS, new JulianDate());
    Transforms.preloadIcrfFixed(new TimeInterval({ start, stop })).then(
      () => {
        loading = false;
        loadedFrom = start;
        loadedUntil = stop;
        scene.requestRender();
      },
      (error: unknown) => {
        loading = false;
        console.warn('[cesium-sgp4-viewer] could not load Earth orientation data', error);
      },
    );
  };

  const onPostUpdate = (_: Scene, time: JulianDate) => {
    if (scene.mode !== SceneMode.SCENE3D) {
      pinned = false;
      return;
    }
    if (
      !loadedFrom ||
      !loadedUntil ||
      JulianDate.lessThan(time, loadedFrom) ||
      JulianDate.greaterThan(time, loadedUntil)
    ) {
      preload(time);
    }

    const rotation = Transforms.computeIcrfToFixedMatrix(time, icrfToFixed);
    if (!rotation) return;

    const { camera } = scene;
    if (pinned) {
      // Already in the inertial frame: the offset carries over, drags included.
      Cartesian3.clone(camera.position, offset);
    } else {
      // First frame: express the world position in the inertial frame, so the
      // camera does not jump by the Earth's rotation angle.
      Matrix3.multiplyByVector(Matrix3.transpose(rotation, fixedToIcrf), camera.positionWC, offset);
    }
    camera.lookAtTransform(
      Matrix4.fromRotationTranslation(rotation, Cartesian3.ZERO, transform),
      offset,
    );
    pinned = true;
  };

  // `lookAtTransform` sets a reference frame that outlives this listener: every
  // way out must put the camera back in the fixed frame.
  const release = () => {
    scene.camera.lookAtTransform(Matrix4.IDENTITY);
    pinned = false;
  };

  const removePostUpdate = scene.postUpdate.addEventListener(onPostUpdate);
  const removeMorphStart = scene.morphStart.addEventListener(release);

  return () => {
    removePostUpdate();
    removeMorphStart();
    release();
  };
};
