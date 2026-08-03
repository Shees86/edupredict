import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * EduPredict Hero3D
 * ===================
 * A lightweight, self-contained 3D visual for the landing page hero —
 * a wireframe icosahedron ("data structure") with a glowing core and
 * a sparse orbiting point field ("data points"), in the app's own
 * brass/ink palette rather than generic rainbow gradients.
 *
 * Safety/perf notes:
 * - Wrapped in try/catch — if WebGL isn't available, this silently
 *   renders nothing instead of crashing the page.
 * - Low geometry complexity (icosahedron detail 1, ~80 points) so it
 *   stays smooth even on modest laptops.
 * - Pixel ratio capped at 1.5 to avoid overtaxing high-DPI displays.
 * - Respects prefers-reduced-motion: renders one static frame instead
 *   of a continuous animation loop.
 * - Fully cleans up (cancels RAF, disposes geometry/materials/renderer,
 *   removes listeners) on unmount so it can't leak or slow down the
 *   rest of the app once you navigate away.
 */
export default function Hero3D({ className, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer, scene, camera, frameId, resizeObserver;
    let icosahedron, core, points;
    let disposed = false;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 7);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Wireframe icosahedron — "data structure"
      const icoGeo = new THREE.IcosahedronGeometry(2.1, 1);
      const icoMat = new THREE.MeshBasicMaterial({ color: 0xb8862e, wireframe: true, transparent: true, opacity: 0.55 });
      icosahedron = new THREE.Mesh(icoGeo, icoMat);
      scene.add(icosahedron);

      // Glowing core
      const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xf4f1e9, transparent: true, opacity: 0.9 });
      core = new THREE.Mesh(coreGeo, coreMat);
      scene.add(core);

      // Sparse orbiting point field — "data points"
      const pointCount = 90;
      const positions = new Float32Array(pointCount * 3);
      for (let i = 0; i < pointCount; i++) {
        const r = 2.8 + Math.random() * 1.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pointsMat = new THREE.PointsMaterial({ color: 0x9aa7c2, size: 0.045, transparent: true, opacity: 0.7 });
      points = new THREE.Points(pointsGeo, pointsMat);
      scene.add(points);

      const clock = new THREE.Clock();

      const renderFrame = () => {
        const t = clock.getElapsedTime();
        icosahedron.rotation.y = t * 0.12;
        icosahedron.rotation.x = t * 0.06;
        core.rotation.y = -t * 0.2;
        points.rotation.y = t * 0.04;
        renderer.render(scene, camera);
      };

      if (reduceMotion) {
        renderFrame();
      } else {
        const animate = () => {
          if (disposed) return;
          renderFrame();
          frameId = requestAnimationFrame(animate);
        };
        animate();
      }

      resizeObserver = new ResizeObserver(() => {
        if (!container || disposed) return;
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (reduceMotion) renderFrame();
      });
      resizeObserver.observe(container);
    } catch {
      // WebGL unavailable or failed — fail silently, no 3D visual shown.
    }

    return () => {
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      [icosahedron, core, points].forEach((obj) => {
        if (!obj) return;
        obj.geometry && obj.geometry.dispose();
        obj.material && obj.material.dispose();
      });
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}
