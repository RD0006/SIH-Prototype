/**
 * Frame geometry helpers.
 *
 * Everything here works in normalised coordinates (0..1 from the frame's
 * top-left) so the same fence polygon applies to a 720p and a 1080p camera
 * without rescaling.
 */

/** Centre point of a detection box, biased to the feet for people. */
export function anchorOf(box, { footAnchor = false } = {}) {
  return {
    x: (box.xmin + box.xmax) / 2,
    y: footAnchor ? box.ymax : (box.ymin + box.ymax) / 2,
  };
}

/** Ray-casting point-in-polygon. Polygon is [[x, y], ...]. */
export function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const straddles = yi > point.y !== yj > point.y;

    if (straddles) {
      const crossesAtX = ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (point.x < crossesAtX) {
        inside = !inside;
      }
    }
  }

  return inside;
}

/** Intersection over union — the association metric for the tracker. */
export function iou(a, b) {
  const x1 = Math.max(a.xmin, b.xmin);
  const y1 = Math.max(a.ymin, b.ymin);
  const x2 = Math.min(a.xmax, b.xmax);
  const y2 = Math.min(a.ymax, b.ymax);

  const overlap = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);

  if (overlap === 0) {
    return 0;
  }

  const areaA = (a.xmax - a.xmin) * (a.ymax - a.ymin);
  const areaB = (b.xmax - b.xmin) * (b.ymax - b.ymin);

  return overlap / (areaA + areaB - overlap);
}

export function boxArea(box) {
  return Math.max(0, box.xmax - box.xmin) * Math.max(0, box.ymax - box.ymin);
}

/** Normalise a pixel-space box from the detector into 0..1 frame space. */
export function normaliseBox(box, width, height) {
  return {
    xmin: box.xmin / width,
    ymin: box.ymin / height,
    xmax: box.xmax / width,
    ymax: box.ymax / height,
  };
}

/** Centroid of a polygon — used to place zone labels. */
export function polygonCentroid(polygon) {
  const sum = polygon.reduce(
    (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / polygon.length,
    y: sum.y / polygon.length,
  };
}

/** Convert a normalised polygon to an SVG points attribute in percent. */
export function polygonToPoints(polygon) {
  return polygon.map(([x, y]) => `${x * 100},${y * 100}`).join(" ");
}

/** Distance travelled between two anchors, in frame widths. */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
