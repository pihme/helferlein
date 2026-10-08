import { COLOR_ROLES, defaultLook } from "./roll.js";
import { catalogNames, setBuilder } from "./catalog.js";
import { SOCKETS } from "./motion.js";

// The android keeps the prototype socket numbers. Other bodies measure their own surface.

function createDraw(THREE, env = {}) {
  const createCanvas = env.createCanvas || function (w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  };

  function stageCamera() {
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(1.55, 1.72, 3.95);
    camera.lookAt(0, 1.2, 0);
    return camera;
  }

  const sample = new THREE.Vector3();
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const edgeC = new THREE.Vector3();
  function toLocal(mesh, group, index, target) {
    const pos = mesh.geometry.attributes.position;
    target.set(pos.getX(index), pos.getY(index), pos.getZ(index));
    mesh.localToWorld(target);
    group.worldToLocal(target);
    return target;
  }
  // A cone keeps vertices only at the tip and the base. The radius at a height is read off the edges.
  function radiusAt(group, y, band) {
    let best = 0;
    const span = band || 0.05;
    group.updateMatrixWorld(true);
    const take = (x, z) => {
      const radius = Math.hypot(x, z);
      if (radius > best) best = radius;
    };
    const cross = (a, b) => {
      if (Math.abs(a.y - y) <= span) take(a.x, a.z);
      if ((a.y - y) * (b.y - y) > 0) return;
      const dy = b.y - a.y;
      if (Math.abs(dy) < 1e-8) return;
      const t = (y - a.y) / dy;
      if (t < 0 || t > 1) return;
      take(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    };
    group.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return;
      const index = mesh.geometry.index;
      const pos = mesh.geometry.attributes.position;
      if (!index) {
        for (let i = 0; i < pos.count; i++) {
          toLocal(mesh, group, i, edgeA);
          if (Math.abs(edgeA.y - y) <= span) take(edgeA.x, edgeA.z);
        }
        return;
      }
      for (let i = 0; i < index.count; i += 3) {
        toLocal(mesh, group, index.getX(i), edgeA);
        toLocal(mesh, group, index.getX(i + 1), edgeB);
        toLocal(mesh, group, index.getX(i + 2), edgeC);
        cross(edgeA, edgeB);
        cross(edgeB, edgeC);
        cross(edgeC, edgeA);
      }
    });
    return best;
  }
  function meshTop(group) {
    let best = -Infinity;
    group.updateMatrixWorld(true);
    group.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return;
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        sample.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        mesh.localToWorld(sample);
        group.worldToLocal(sample);
        if (sample.y > best) best = sample.y;
      }
    });
    return best;
  }
  function hatSeat(group, place) {
    if (radiusAt(group, place.headTop - 0.08, 0.05) >= 0.2) return place.headTop;
    for (let y = place.headTop - 0.02; y > place.faceY - 0.12; y -= 0.02) {
      if (radiusAt(group, y, 0.03) >= 0.10) return y;
    }
    return place.faceY;
  }
  function bodySockets(place, group) {
    const classic = place.headTop === 2.32 && place.shoulderY === 1.16;
    const hatScaleOf = (seat) => Math.max(0.65, place.faceR / 0.42);
    if (classic || !group) {
      const x = place.bodyR * 0.92 + 0.02;
      const ear = 0.16 * hatScaleOf(place.headTop);
      const sockets = {
        headTop: [0, place.headTop, 0],
        earLeft: [-ear, place.headTop, 0],
        earRight: [ear, place.headTop, 0],
        back: [0, place.shoulderY, -0.06],
        shoulderLeft: [-x, place.shoulderY, 0.04],
        shoulderRight: [x, place.shoulderY, 0.04],
        handLeft: [-x, place.shoulderY - 0.4, 0.04],
        handRight: [x, place.shoulderY - 0.4, 0.04],
        classic: true,
        hatTop: place.headTop,
        hatScale: hatScaleOf(place.headTop)
      };
      for (const key of SOCKETS) {
        if (!sockets[key]) throw new Error("missing socket " + key);
      }
      return sockets;
    }
    const shoulderR = radiusAt(group, place.shoulderY) || place.bodyR;
    const earY = place.faceY + Math.min(0.12, (place.headTop - place.faceY) * 0.2);
    const earR = radiusAt(group, earY, 0.08) || place.faceR;
    const seat = hatSeat(group, place);
    const section = radiusAt(group, seat, 0.04) || place.faceR;
    const tip = meshTop(group);
    const antlerY = Math.max(place.faceY, Math.min(tip - 0.06, place.faceY + (tip - place.faceY) * 0.62));
    const antlerR = radiusAt(group, antlerY, 0.06) || place.faceR;
    const x = Math.max(0.12, shoulderR * 0.98);
    const ear = Math.max(0.08, earR * 0.86);
    const sockets = {
      headTop: [0, place.headTop, 0],
      earLeft: [-ear, earY, place.faceZ * 0.25],
      earRight: [ear, earY, place.faceZ * 0.25],
      back: [0, place.shoulderY, -Math.max(0.08, shoulderR * 0.9)],
      shoulderLeft: [-x, place.shoulderY, 0.04],
      shoulderRight: [x, place.shoulderY, 0.04],
      handLeft: [-x, place.shoulderY - 0.4, 0.04],
      handRight: [x, place.shoulderY - 0.4, 0.04],
      classic: false,
      hatTop: seat,
      hatScale: Math.min(1.15, Math.max(0.45, section / 0.28)),
      meshTop: tip,
      antlerR,
      antlerY
    };
    for (const key of SOCKETS) {
      if (!sockets[key]) throw new Error("missing socket " + key);
    }
    return sockets;
  }

      function colorOf(look, role) {
        const fallback = COLOR_ROLES.find(([key]) => key === role);
        const s = look[role + "S"] != null ? look[role + "S"] : fallback[2];
        const l = look[role + "L"] != null ? look[role + "L"] : fallback[3];
        return new THREE.Color().setHSL(((look.hue % 360) + 360) % 360 / 360, s, l);
      }
      function shadeColor(look, role, dl) {
        const hsl = { h: 0, s: 0, l: 0 };
        colorOf(look, role).getHSL(hsl);
        return new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(0.84, Math.max(0.08, hsl.l + dl)));
      }
      function paint(look, role, extra) {
        const body = role === "body";
        const tool = role === "tool";
        return new THREE.MeshPhysicalMaterial(Object.assign({
          color: colorOf(look, role),
          roughness: body ? 0.24 : tool ? 0.42 : 0.5,
          metalness: tool ? 0.32 : 0.02,
          clearcoat: body ? 0.72 : 0.1,
          clearcoatRoughness: 0.26,
          envMapIntensity: body ? 0.8 : 0.28
        }, extra || {}));
      }
      function solid(geo, material) { return new THREE.Mesh(geo, material); }
      function sphere(r, material, seg) {
        return solid(new THREE.SphereGeometry(r, seg || 28, Math.round((seg || 28) * 0.72)), material);
      }
      function lathe(pairs, material) {
        return solid(new THREE.LatheGeometry(pairs.map(([x, y]) => new THREE.Vector2(x, y)), 64), material);
      }
      // The knots are the accepted silhouette. The samples round the corners between them.
      function rounded(points) {
        const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
        const out = [];
        const steps = 5;
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = at(i - 1);
          const p1 = at(i);
          const p2 = at(i + 1);
          const p3 = at(i + 2);
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            const t2 = t * t;
            const t3 = t2 * t;
            const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
            const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
            out.push([Math.max(0.008, x), y]);
          }
        }
        const end = points[points.length - 1];
        out.push([Math.max(0.008, end[0]), end[1]]);
        for (let i = 1; i < out.length; i++) {
          if (out[i][1] <= out[i - 1][1]) out[i][1] = out[i - 1][1] + 0.0005;
        }
        return out;
      }
      function shell(pairs, material) {
        return lathe(rounded(pairs), material);
      }
      function at(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

      function shapeBody(shape, material, look) {
        const g = new THREE.Group();
        g.name = "body";
        const add = (mesh, x, y, z) => { at(mesh, x, y, z); g.add(mesh); return mesh; };
        let place = { faceY: 1.72, faceZ: 0.4, faceR: 0.42, headTop: 2.28, shoulderY: 1.16, bodyR: 0.4 };
        if (shape === "Peanut") {
          g.add(shell([
            [0.01, 0.30], [0.24, 0.40], [0.42, 0.62], [0.46, 0.88], [0.40, 1.10],
            [0.26, 1.26], [0.30, 1.42], [0.44, 1.64], [0.46, 1.84], [0.28, 2.02], [0.01, 2.10]
          ], material));
          place = { faceY: 1.76, faceZ: 0.38, faceR: 0.42, headTop: 2.06, shoulderY: 1.22, bodyR: 0.44 };
        } else if (shape === "Pear") {
          g.add(shell([
            [0.01, 0.32], [0.30, 0.42], [0.50, 0.70], [0.54, 1.00], [0.40, 1.30],
            [0.24, 1.52], [0.30, 1.70], [0.20, 1.86], [0.01, 1.94]
          ], material));
          place = { faceY: 1.68, faceZ: 0.24, faceR: 0.26, headTop: 1.94, shoulderY: 1.12, bodyR: 0.5 };
        } else if (shape === "Egg") {
          const bean = add(sphere(0.55, material, 64), 0, 1.22, 0);
          bean.scale.set(0.82, 1.22, 0.74);
          place = { faceY: 1.42, faceZ: 0.34, faceR: 0.38, headTop: 1.86, shoulderY: 1.12, bodyR: 0.42 };
        } else if (shape === "Teardrop") {
          g.add(shell([
            [0.01, 0.32], [0.26, 0.42], [0.46, 0.66], [0.50, 0.98], [0.38, 1.30],
            [0.24, 1.55], [0.10, 1.82], [0.01, 2.02]
          ], material));
          place = { faceY: 1.42, faceZ: 0.32, faceR: 0.32, headTop: 2.0, shoulderY: 1.1, bodyR: 0.46 };
        } else if (shape === "Snowman") {
          add(sphere(0.50, material, 48), 0, 0.62, 0);
          add(sphere(0.36, material, 48), 0, 1.32, 0);
          add(sphere(0.24, material, 48), 0, 1.82, 0);
          place = { faceY: 1.82, faceZ: 0.28, faceR: 0.22, headTop: 2.06, shoulderY: 1.32, bodyR: 0.36 };
        } else if (shape === "Lightbulb") {
          const hot = paint(look, "features", { emissive: colorOf(look, "features"), emissiveIntensity: 1.6 });
          const glass = paint(look, "body", { transparent: true, opacity: 0.22, roughness: 0.04, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
          // A tube along a helix. Three's curve helpers are not in the figure bundle.
          const helixTube = (radius, tube, y0, y1, turns) => {
            const steps = Math.max(8, Math.round(turns * 18));
            const sides = 6;
            const positions = [];
            const indices = [];
            const dy = (y1 - y0) / (turns * Math.PI * 2);
            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const a = t * turns * Math.PI * 2;
              const p = new THREE.Vector3(Math.cos(a) * radius, y0 + (y1 - y0) * t, Math.sin(a) * radius);
              const tangent = new THREE.Vector3(-Math.sin(a) * radius, dy, Math.cos(a) * radius).normalize();
              const outward = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
              outward.addScaledVector(tangent, -outward.dot(tangent));
              if (outward.lengthSq() < 1e-8) outward.set(1, 0, 0);
              outward.normalize();
              const bin = new THREE.Vector3().crossVectors(tangent, outward).normalize();
              for (let s = 0; s < sides; s++) {
                const u = (s / sides) * Math.PI * 2;
                const v = p.clone().addScaledVector(outward, Math.cos(u) * tube).addScaledVector(bin, Math.sin(u) * tube);
                positions.push(v.x, v.y, v.z);
              }
            }
            for (let i = 0; i < steps; i++) {
              for (let s = 0; s < sides; s++) {
                const a = i * sides + s;
                const b = i * sides + ((s + 1) % sides);
                const c = (i + 1) * sides + s;
                const d = (i + 1) * sides + ((s + 1) % sides);
                indices.push(a, c, b, b, c, d);
              }
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
            geo.setIndex(indices);
            geo.computeVertexNormals();
            return geo;
          };
          const wire = hot.clone();
          wire.side = THREE.DoubleSide;
          // Horizontal coil, left to right, bowed upward, sitting behind the face.
          const archCoil = () => {
            const turns = 4;
            const steps = turns * 20;
            const sides = 6;
            const tube = 0.0025;
            const coilR = 0.07;
            const span = 0.33;
            const positions = [];
            const indices = [];
            const pts = [];
            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const a = t * turns * Math.PI * 2;
              const x = -span / 2 + span * t;
              const arch = Math.sin(t * Math.PI) * 0.03;
              pts.push(new THREE.Vector3(x, 1.62 + arch + Math.sin(a) * coilR, Math.cos(a) * coilR));
            }
            for (let i = 0; i <= steps; i++) {
              const prev = pts[Math.max(0, i - 1)];
              const next = pts[Math.min(steps, i + 1)];
              const tangent = next.clone().sub(prev).normalize();
              const outward = new THREE.Vector3(0, 1, 0);
              outward.addScaledVector(tangent, -outward.dot(tangent));
              if (outward.lengthSq() < 1e-8) outward.set(0, 0, 1);
              outward.normalize();
              const bin = new THREE.Vector3().crossVectors(tangent, outward).normalize();
              for (let s = 0; s < sides; s++) {
                const u = (s / sides) * Math.PI * 2;
                const v = pts[i].clone().addScaledVector(outward, Math.cos(u) * tube).addScaledVector(bin, Math.sin(u) * tube);
                positions.push(v.x, v.y, v.z);
              }
            }
            for (let i = 0; i < steps; i++) {
              for (let s = 0; s < sides; s++) {
                const a = i * sides + s;
                const b = i * sides + ((s + 1) % sides);
                const c = (i + 1) * sides + s;
                const d = (i + 1) * sides + ((s + 1) % sides);
                indices.push(a, c, b, b, c, d);
              }
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
            geo.setIndex(indices);
            geo.computeVertexNormals();
            return geo;
          };
          const filament = add(solid(archCoil(), wire), 0, 0, 0);
          filament.renderOrder = 1;
          const bulb = shell([
            [0.01, 1.02], [0.12, 1.08], [0.20, 1.22], [0.32, 1.44],
            [0.36, 1.66], [0.32, 1.88], [0.18, 2.04], [0.01, 2.14]
          ], glass);
          bulb.renderOrder = 2;
          g.add(bulb);
          const metal = material.clone();
          metal.side = THREE.DoubleSide;
          add(solid(new THREE.CylinderGeometry(0.128, 0.118, 0.2, 28), material), 0, 0.95, 0);
          add(solid(helixTube(0.132, 0.012, 0.88, 1.02, 4), metal), 0, 0, 0);
          const contact = add(sphere(0.04, material, 14), 0, 0.83, 0);
          contact.scale.y = 0.7;
          place = { faceY: 1.64, faceZ: 0.30, faceR: 0.30, headTop: 2.14, shoulderY: 1.40, bodyR: 0.30 };
        } else if (shape === "Rocket") {
          add(solid(new THREE.CylinderGeometry(0.26, 0.30, 0.83, 64), material), 0, 1.285, 0);
          const nose = solid(new THREE.ConeGeometry(0.268, 0.46, 64, 1, true), material);
          nose.position.y = 1.91;
          g.add(nose);
          const finMat = material.clone();
          finMat.side = THREE.DoubleSide;
          const addFin = (a) => {
            const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
            const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
            // Root is longer and sunk into the hull. One fifth of the root hangs below the body.
            const outline = [[0.26, 0.81], [0.48, 0.83], [0.48, 0.95], [0.26, 1.11]];
            const mid = outline.map(([rad, y]) => new THREE.Vector3(radial.x * rad, y, radial.z * rad));
            const front = mid.map(p => p.clone().addScaledVector(tangent, 0.008));
            const back = mid.map(p => p.clone().addScaledVector(tangent, -0.008));
            const positions = [];
            const push = (p, q, r) => positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
            const quad = (w, x, y, z) => { push(w, x, y); push(w, y, z); };
            quad(front[0], front[1], front[2], front[3]);
            quad(back[0], back[3], back[2], back[1]);
            for (let i = 0; i < 4; i++) {
              const j = (i + 1) % 4;
              quad(front[i], back[i], back[j], front[j]);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
            geo.computeVertexNormals();
            g.add(solid(geo, finMat));
          };
          const behind = -Math.PI / 2;
          for (const a of [behind, behind + Math.PI * 2 / 3, behind + Math.PI * 4 / 3]) addFin(a);
          place = { faceY: 1.60, faceZ: 0.26, faceR: 0.26, headTop: 2.14, shoulderY: 1.42, bodyR: 0.32 };
        } else {
          g.add(shell([
            [0.01, 0.42], [0.20, 0.50], [0.34, 0.68], [0.40, 0.92], [0.36, 1.14], [0.34, 1.32],
            [0.40, 1.52], [0.46, 1.74], [0.44, 1.96], [0.32, 2.16], [0.14, 2.30], [0.01, 2.36]
          ], material));
          place = { faceY: 1.74, faceZ: 0.4, faceR: 0.44, headTop: 2.32, shoulderY: 1.16, bodyR: 0.4 };
        }
        return { group: g, place };
      }

      function addFace(g, look, place) {
        const y = place.faceY;
        const z = place.faceZ;
        const r = place.faceR;
        const faceMat = paint(look, "face", { roughness: 0.55, clearcoat: 0.04, envMapIntensity: 0.15 });
        const eyeMat = paint(look, "features", { emissive: colorOf(look, "features"), emissiveIntensity: 0.28, roughness: 0.35 });
        const visor = solid(new THREE.SphereGeometry(1, 32, 24), faceMat);
        visor.scale.set(r * 0.78, r * 0.46, r * 0.24);
        visor.position.set(0, y, z);
        g.add(visor);
        const expr = look.expression;
        const spread = r * 0.34;
        const eyeR = r * (expr === "Surprised" ? 0.15 : 0.11);
        const eyeY = y + (expr === "Curious" ? r * 0.08 : expr === "Focused" ? -r * 0.02 : 0);
        const eyeZ = z + r * 0.26;
        const shut = (mode, x) => {
          if (mode === "pleased") {
            const arc = solid(new THREE.TorusGeometry(eyeR, eyeR * 0.28, 6, 14, Math.PI), eyeMat);
            arc.position.set(x, eyeY, eyeZ);
            g.add(arc);
            return;
          }
          const lid = solid(new THREE.CapsuleGeometry(eyeR * 0.32, eyeR * 1.15, 3, 6), eyeMat);
          lid.rotation.z = Math.PI / 2;
          lid.position.set(x, eyeY, eyeZ);
          g.add(lid);
        };
        const open = (mode, x) => {
          const eyeball = sphere(eyeR, eyeMat, 16);
          if (mode === "focus") eyeball.scale.y = 0.55;
          eyeball.position.set(x, eyeY, eyeZ);
          g.add(eyeball);
          const glint = solid(new THREE.SphereGeometry(eyeR * 0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          glint.position.set(x - eyeR * 0.32, eyeY + eyeR * 0.32, eyeZ + eyeR * 0.72);
          g.add(glint);
        };
        const mode = (side) => {
          if (expr === "Resting") return "shut";
          if (expr === "Pleased") return "pleased";
          if (expr === "Wink" && side < 0) return "shut";
          if (expr === "Focused") return "focus";
          return "open";
        };
        [-1, 1].forEach(side => {
          const x = side * spread + (expr === "Curious" && side > 0 ? r * 0.03 : 0);
          const m = mode(side);
          if (m === "open" || m === "focus") open(m, x); else shut(m, x);
        });
        if (expr === "Determined" || expr === "Curious") {
          [-1, 1].forEach(side => {
            const brow = solid(new THREE.BoxGeometry(r * 0.24, r * 0.04, r * 0.03), eyeMat);
            brow.position.set(side * spread, eyeY + r * 0.22 + (expr === "Curious" && side < 0 ? r * 0.07 : 0), eyeZ);
            brow.rotation.z = side * (expr === "Determined" ? -0.45 : -0.2);
            g.add(brow);
          });
        }
        if (expr === "Pleased" || expr === "Neutral" || expr === "Surprised") {
          const mouth = solid(new THREE.TorusGeometry(r * (expr === "Surprised" ? 0.07 : 0.1), r * 0.028, 6, 14, expr === "Surprised" ? Math.PI * 2 : Math.PI), eyeMat);
          mouth.position.set(0, y - r * 0.24, eyeZ);
          if (expr !== "Surprised") mouth.rotation.z = Math.PI;
          g.add(mouth);
        }
      }

      // One extra per roll. Worn pieces use the accessories role. Grown pieces use the features role.
      // The group is the whole piece. Named parts (ear, wing, antenna, propeller) stay inside it.
      function addExtra(figure, look, place, sockets) {
        const name = look.extra;
        if (!name || name === "None") return;
        const g = new THREE.Group();
        g.name = "extra";
        figure.add(g);
        const wornNames = { "Top hat": 1, "Beret": 1, "Sombrero": 1, "Pointed hat": 1, "Chef's hat": 1, "Crown": 1 };
        const role = wornNames[name] ? "accessories" : "features";
        const cloth = { roughness: 0.82, metalness: 0, clearcoat: 0, envMapIntensity: 0.12, side: THREE.DoubleSide };
        const m = paint(look, role, role === "accessories" ? cloth : null);
        const band = paint(look, role, Object.assign({ color: shadeColor(look, role, -0.16) }, role === "accessories" ? cloth : { side: THREE.DoubleSide }));
        const lite = paint(look, role, Object.assign({ color: shadeColor(look, role, 0.14) }, role === "accessories" ? cloth : { side: THREE.DoubleSide }));
        const faceMat = paint(look, "face");
        const hot = paint(look, "features", { emissive: colorOf(look, "features"), emissiveIntensity: 0.7 });
        const s = sockets.hatScale;
        const put = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };
        const top = sockets.hatTop;
        const crown = sockets.headTop[1];
        const y = place.faceY;
        const r = place.faceR;
        if (name === "Top hat") {
          const side = 0.115 * s;
          const front = 0.155 * s;
          const stretch = front / side;
          const crownH = 0.24 * s;
          const crown = put(solid(new THREE.CylinderGeometry(side, side, crownH, 32), m), 0, top + crownH * 0.5, 0);
          crown.scale.z = stretch;
          const bandH = 0.045 * s;
          const collar = put(solid(new THREE.CylinderGeometry(side * 1.08, side * 1.08, bandH, 32), band), 0, top + bandH * 0.5, 0);
          collar.scale.z = stretch;
          const seg = 56;
          const steps = 5;
          const ix = side * 0.62;
          const iz = front * 0.62;
          const ox = side + 0.15 * s;
          const oz = front + 0.15 * s;
          const curl = 0.04 * s;
          const thick = 0.012 * s;
          const y0 = top + 0.004;
          const cols = seg + 1;
          const rows = steps + 1;
          const brim = new THREE.BufferGeometry();
          const positions = new Float32Array(cols * rows * 2 * 3);
          const center = (i, k) => {
            const a = (i / seg) * Math.PI * 2;
            const t = k / steps;
            return new THREE.Vector3(
              Math.sin(a) * (ix + (ox - ix) * t),
              curl * t * t * Math.sin(a) * Math.sin(a),
              Math.cos(a) * (iz + (oz - iz) * t)
            );
          };
          const vid = (layer, i, k) => layer * cols * rows + i * rows + k;
          for (let i = 0; i < cols; i++) {
            for (let k = 0; k < rows; k++) {
              const p = center(i, k);
              const pa = center(i + 0.35, k);
              const pk = center(i, Math.min(steps, k + 0.35));
              const nrm = new THREE.Vector3().crossVectors(pa.sub(p.clone()), pk.sub(p.clone()));
              if (nrm.lengthSq() < 1e-8) nrm.set(0, 1, 0);
              else nrm.normalize();
              if (nrm.y < 0) nrm.negate();
              [p.clone().addScaledVector(nrm, thick * 0.5), p.clone().addScaledVector(nrm, -thick * 0.5)].forEach((v, layer) => {
                const n = vid(layer, i, k) * 3;
                positions[n] = v.x;
                positions[n + 1] = v.y + y0;
                positions[n + 2] = v.z;
              });
            }
          }
          const indices = [];
          for (let i = 0; i < seg; i++) {
            for (let k = 0; k < steps; k++) {
              const a = vid(0, i, k), b = vid(0, i + 1, k), c = vid(0, i, k + 1), d = vid(0, i + 1, k + 1);
              indices.push(a, c, b, b, c, d);
              const e = vid(1, i, k), f = vid(1, i + 1, k), g = vid(1, i, k + 1), h = vid(1, i + 1, k + 1);
              indices.push(e, f, g, f, h, g);
            }
            indices.push(vid(0, i, steps), vid(0, i + 1, steps), vid(1, i, steps), vid(0, i + 1, steps), vid(1, i + 1, steps), vid(1, i, steps));
            indices.push(vid(0, i, 0), vid(1, i, 0), vid(0, i + 1, 0), vid(0, i + 1, 0), vid(1, i, 0), vid(1, i + 1, 0));
          }
          brim.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          brim.setIndex(indices);
          brim.computeVertexNormals();
          g.add(solid(brim, m));
        } else if (name === "Beret") {
          const beret = put(solid(new THREE.SphereGeometry(0.24 * s, 24, 16, 0, Math.PI * 2, 0, Math.PI * 2 / 3), m), 0.02 * s, top - 0.02 * s, 0);
          beret.scale.set(1.2, 0.42, 1.08);
          beret.rotation.z = -0.28;
          const nub = sphere(0.028 * s, band, 12);
          nub.position.set(0, 0.24 * s, 0);
          beret.add(nub);
        } else if (name === "Sombrero") {
          put(lathe([
            [0.16 * s, 0.03 * s], [0.36 * s, 0.008 * s], [0.50 * s, 0.02 * s], [0.58 * s, 0.06 * s],
            [0.64 * s, 0.11 * s], [0.62 * s, 0.14 * s], [0.52 * s, 0.05 * s], [0.32 * s, 0],
            [0.16 * s, 0.012 * s], [0.16 * s, 0.03 * s]
          ], m), 0, top - 0.10 * s, 0);
          put(solid(new THREE.CylinderGeometry(0.155 * s, 0.17 * s, 0.18 * s, 20), m), 0, top - 0.01 * s, 0);
          const dome = put(sphere(0.155 * s, m, 22), 0, top + 0.08 * s, 0);
          dome.scale.y = 0.72;
          put(solid(new THREE.CylinderGeometry(0.15 * s, 0.17 * s, 0.045 * s, 20), band), 0, top - 0.04 * s, 0);
        } else if (name === "Pointed hat") {
          put(solid(new THREE.CylinderGeometry(0.34 * s, 0.34 * s, 0.03, 24), m), 0, top - 0.01, 0);
          const tipY = 0.48 * s;
          const bend = 0.22 * s;
          const baseR = 0.16 * s;
          const seg = 32;
          const steps = 18;
          const cone = new THREE.BufferGeometry();
          const positions = [];
          const centerAt = (t) => new THREE.Vector3(0, t * tipY, -bend * t * t);
          for (let k = 0; k <= steps; k++) {
            const t = k / steps;
            const c = centerAt(t);
            const tan = centerAt(Math.min(1, t + 0.02)).sub(centerAt(Math.max(0, t - 0.02))).normalize();
            const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tan);
            if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
            side.normalize();
            const bin = new THREE.Vector3().crossVectors(tan, side).normalize();
            const rad = baseR * (1 - t) + 0.012 * s * t;
            for (let i = 0; i < seg; i++) {
              const a = (i / seg) * Math.PI * 2;
              const p = c.clone().addScaledVector(side, Math.cos(a) * rad).addScaledVector(bin, Math.sin(a) * rad);
              positions.push(p.x, p.y + top + 0.005, p.z);
            }
          }
          const indices = [];
          for (let k = 0; k < steps; k++) {
            for (let i = 0; i < seg; i++) {
              const a = k * seg + i;
              const b = k * seg + ((i + 1) % seg);
              const c = (k + 1) * seg + i;
              const d = (k + 1) * seg + ((i + 1) % seg);
              indices.push(a, c, b, b, c, d);
            }
          }
          cone.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          cone.setIndex(indices);
          cone.computeVertexNormals();
          g.add(solid(cone, m));
          const tip = centerAt(1);
          put(sphere(0.018 * s, band, 8), tip.x, tip.y + top + 0.012, tip.z);
          put(solid(new THREE.CylinderGeometry(0.175 * s, 0.175 * s, 0.028 * s, 24), band), 0, top + 0.016, 0);
        } else if (name === "Chef's hat") {
          const bandH = 0.11 * s;
          put(solid(new THREE.CylinderGeometry(0.20 * s, 0.205 * s, bandH, 28), band), 0, top + bandH * 0.15, 0);
          put(lathe([
            [0.195 * s, 0], [0.23 * s, 0.03 * s], [0.26 * s, 0.09 * s], [0.265 * s, 0.16 * s],
            [0.23 * s, 0.23 * s], [0.10 * s, 0.28 * s], [0.01 * s, 0.30 * s]
          ], m), 0, top + bandH * 0.65, 0);
        } else if (name === "Crown") {
          const metal = paint(look, "accessories", { metalness: 0.72, roughness: 0.28 });
          const seat = top - 0.20 * s;
          put(solid(new THREE.CylinderGeometry(0.36 * s, 0.39 * s, 0.07 * s, 24, 1, true), metal), 0, seat, 0);
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const h = (0.16 + 0.14 * Math.max(0, Math.cos(a))) * s;
            const peak = solid(new THREE.CylinderGeometry(0.01 * s, 0.08 * s, h, 3), metal);
            peak.scale.z = 0.38;
            peak.rotation.y = a;
            peak.position.set(Math.sin(a) * 0.36 * s, seat + h * 0.45, Math.cos(a) * 0.36 * s);
            g.add(peak);
          }
        } else if (name === "Bunny ears") {
          [-1, 1].forEach(side => {
            const lean = side * -0.22;
            const H = 0.078 * s * 2.55;
            const rig = new THREE.Group();
            rig.name = "ear";
            rig.position.set(side * 0.18 * s + Math.sin(lean) * H, top + 0.14 * s - Math.cos(lean) * H, 0);
            rig.rotation.z = rig.userData.base = lean;
            rig.userData.amp = side * -0.5;
            rig.userData.side = side;
            if (!sockets.classic) {
              const hinge = side < 0 ? sockets.earLeft : sockets.earRight;
              rig.position.set(hinge[0], hinge[1], hinge[2]);
            }
            g.add(rig);
            const ear = sphere(0.078 * s, m, 16);
            ear.scale.set(0.55, 2.55, 0.42);
            ear.position.y = H;
            rig.add(ear);
            const inner = sphere(0.044 * s, faceMat, 12);
            inner.scale.set(0.36, 1.75, 0.2);
            const px = side * 0.01 * s, py = 0.02 * s, c = Math.cos(lean), sn = Math.sin(lean);
            inner.position.set(px * c + py * sn, H - px * sn + py * c, 0.016 * s);
            rig.add(inner);
          });
        } else if (name === "Cat ears") {
          // Flat triangle on +Z, half-cone bulging toward -Z.
          const earGeo = (radius, height, topW) => {
            const positions = [];
            const seg = 10;
            const baseY = -height / 2;
            const topY = height / 2 - (topW / radius) * height;
            const baseArc = [];
            const topArc = [];
            for (let i = 0; i <= seg; i++) {
              const t = (i / seg) * Math.PI;
              const c = Math.cos(t);
              const sn = Math.sin(t);
              baseArc.push(new THREE.Vector3(c * radius, baseY, -sn * radius));
              topArc.push(new THREE.Vector3(c * topW, topY, -sn * topW));
            }
            const push = (a, b, c) => positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
            push(baseArc[0], topArc[0], topArc[seg]);
            push(baseArc[0], topArc[seg], baseArc[seg]);
            for (let i = 0; i < seg; i++) {
              push(baseArc[i], baseArc[i + 1], topArc[i + 1]);
              push(baseArc[i], topArc[i + 1], topArc[i]);
            }
            const base = new THREE.Vector3(0, baseY, 0);
            for (let i = 0; i < seg; i++) push(base, baseArc[i + 1], baseArc[i]);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
            geo.computeVertexNormals();
            return geo;
          };
          const innerGeo = (radius, height) => {
            const apex = new THREE.Vector3(0, height / 2, 0);
            const right = new THREE.Vector3(radius, -height / 2, 0);
            const left = new THREE.Vector3(-radius, -height / 2, 0);
            const positions = [
              apex.x, apex.y, apex.z, right.x, right.y, right.z, left.x, left.y, left.z,
              apex.x, apex.y, apex.z, left.x, left.y, left.z, right.x, right.y, right.z
            ];
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
            geo.computeVertexNormals();
            return geo;
          };
          const fur = m.clone();
          fur.side = THREE.DoubleSide;
          [-1, 1].forEach(side => {
            const lean = side * -0.2;
            const H = 0.15 * s;
            const rig = new THREE.Group();
            rig.name = "ear";
            rig.position.set(side * 0.16 * s + Math.sin(lean) * H, top + 0.02 * s - Math.cos(lean) * H, 0);
            rig.rotation.y = side * 0.55;
            rig.rotation.z = rig.userData.base = lean;
            rig.userData.amp = side * -0.45;
            rig.userData.side = side;
            if (!sockets.classic) {
              const hinge = side < 0 ? sockets.earLeft : sockets.earRight;
              rig.position.set(hinge[0], hinge[1], hinge[2]);
            }
            g.add(rig);
            const topW = 0.018 * s;
            const ear = solid(earGeo(0.10 * s, 0.30 * s, topW), fur);
            ear.position.y = H;
            rig.add(ear);
            const capY = 0.15 * s - topW / 0.10 * 0.30;
            const cap = solid(new THREE.SphereGeometry(topW, 14, 8, Math.PI, Math.PI, 0, Math.PI / 2), fur);
            cap.position.set(0, capY, 0);
            ear.add(cap);
            const facePts = [];
            for (let i = 0; i < 8; i++) {
              const a0 = (i / 8) * Math.PI;
              const a1 = ((i + 1) / 8) * Math.PI;
              facePts.push(0, 0, 0, Math.cos(a0) * topW, Math.sin(a0) * topW, 0, Math.cos(a1) * topW, Math.sin(a1) * topW, 0);
              facePts.push(0, 0, 0, Math.cos(a1) * topW, Math.sin(a1) * topW, 0, Math.cos(a0) * topW, Math.sin(a0) * topW, 0);
            }
            const capFaceGeo = new THREE.BufferGeometry();
            capFaceGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(facePts), 3));
            capFaceGeo.computeVertexNormals();
            const capFace = solid(capFaceGeo, fur);
            capFace.position.set(0, capY, 0.001 * s);
            ear.add(capFace);
            // Side gap 0.015s. The bottom gap is twice that. The inner tip stops under the round cap.
            const inner = solid(innerGeo(0.075 * s, 0.195 * s), faceMat);
            inner.position.set(0, -0.0225 * s, 0.008 * s);
            ear.add(inner);
          });
        } else if (name === "Dog ears") {
          [-1, 1].forEach(side => {
            const lean = side * 1.15;
            const H = 0.16 * s * 2.15;
            const rig = new THREE.Group();
            rig.name = "ear";
            rig.position.set(side * (r * 1.02) - Math.sin(lean) * H, y + 0.02 * s + Math.cos(lean) * H, 0.07);
            rig.rotation.z = rig.userData.base = lean;
            rig.userData.amp = side * 0.42;
            rig.userData.side = side;
            if (!sockets.classic) {
              const hinge = side < 0 ? sockets.earLeft : sockets.earRight;
              rig.position.set(hinge[0], hinge[1], hinge[2]);
            }
            g.add(rig);
            const ear = sphere(0.16 * s, m, 16);
            ear.scale.set(0.5, 2.15, 0.34);
            ear.position.y = -H;
            rig.add(ear);
            const inner = sphere(0.095 * s, faceMat, 12);
            inner.scale.set(0.34, 1.4, 0.18);
            const px = side * r * 0.14, py = -0.08 * s, c = Math.cos(lean), sn = Math.sin(lean);
            inner.position.set(px * c + py * sn, -H - px * sn + py * c, 0.04);
            rig.add(inner);
          });
        } else if (name === "Antenna") {
          const metal = paint(look, "features", { metalness: 0.78, roughness: 0.34, clearcoat: 0.05, side: THREE.DoubleSide });
          const footH = 0.028 * s;
          const footY = sockets.classic ? crown + 0.006 * s : sockets.meshTop + footH * 0.5 - 0.008;
          put(solid(new THREE.CylinderGeometry(0.055 * s, 0.07 * s, footH, 14), metal), 0, footY, 0);
          const antenna = new THREE.Group();
          antenna.name = "antenna";
          // The bowl sits on the foot. The foot stays put while the named group yaws.
          const bowlOnFoot = footY + footH * 0.5 + 0.004 - 0.045 * s;
          antenna.position.set(0, sockets.classic ? footY + 0.09 * s : bowlOnFoot, 0);
          g.add(antenna);
          const neck = solid(new THREE.CylinderGeometry(0.016 * s, 0.022 * s, 0.09 * s, 8), metal);
          neck.position.y = -0.02 * s;
          antenna.add(neck);
          const head = new THREE.Group();
          head.position.y = 0.035 * s;
          head.rotation.x = 0.62;
          antenna.add(head);
          head.add(lathe([
            [0.02 * s, 0.01 * s], [0.08 * s, 0.03 * s], [0.15 * s, 0.075 * s], [0.21 * s, 0.145 * s],
            [0.225 * s, 0.175 * s], [0.20 * s, 0.15 * s], [0.14 * s, 0.085 * s], [0.07 * s, 0.042 * s], [0.02 * s, 0.022 * s]
          ], metal));
          const arm = new THREE.Group();
          arm.position.set(0, 0.11 * s, 0.15 * s);
          arm.rotation.x = -0.95;
          head.add(arm);
          const rod = solid(new THREE.CylinderGeometry(0.007 * s, 0.007 * s, 0.20 * s, 6), metal);
          rod.position.y = 0.09 * s;
          arm.add(rod);
          const lnb = solid(new THREE.CylinderGeometry(0.026 * s, 0.016 * s, 0.05 * s, 8), metal);
          lnb.position.y = 0.20 * s;
          arm.add(lnb);
        } else if (name === "Halo") {
          const halo = put(solid(new THREE.TorusGeometry(0.34 * s, 0.034 * s, 10, 32), hot), 0, crown + 0.16 * s, 0);
          halo.rotation.x = Math.PI / 2;
        } else if (name === "Small wings") {
          const hingeZ = sockets.back[2];
          const wingHigh = sockets.classic ? sockets.shoulderRight[1] + 0.46 : sockets.back[1] + 0.16;
          const wingLow = sockets.classic ? sockets.shoulderRight[1] - 0.14 : sockets.back[1] - 0.18;
          const addWing = (radius, segs, scale, cx, cy, rz, mat) => {
            const H = radius * scale[1];
            const xAt = yl => cx - yl * Math.sin(rz);
            const rootY = Math.abs(xAt(H)) <= Math.abs(xAt(-H)) ? H : -H;
            const hinge = new THREE.Group();
            hinge.name = "wing";
            hinge.position.set(cx - rootY * Math.sin(rz), cy + rootY * Math.cos(rz), hingeZ);
            const rearward = Math.sign(cx);
            hinge.userData.back = rearward * 0.45;
            hinge.userData.flap = rearward * 0.28;
            hinge.rotation.y = hinge.userData.back;
            g.add(hinge);
            const posed = new THREE.Group();
            posed.rotation.z = rz;
            hinge.add(posed);
            const mesh = sphere(radius, mat, segs);
            mesh.scale.set(scale[0], scale[1], scale[2]);
            mesh.position.y = -rootY;
            posed.add(mesh);
          };
          [-1, 1].forEach(side => {
            const hingeX = sockets.classic ? side * place.bodyR * 0.45 : side * sockets.shoulderRight[0] * 0.55;
            addWing(0.24 * s, 16, [0.62, 1.45, 0.12], hingeX + side * 0.22 * s, wingHigh, side * -0.48, m);
            addWing(0.19 * s, 14, [0.58, 1.2, 0.11], hingeX + side * 0.24 * s, wingLow, side * -2.15, lite);
          });
        } else if (name === "Antlers") {
          [-1, 1].forEach(side => {
            const beam = new THREE.Group();
            if (sockets.classic) beam.position.set(side * 0.14 * s, crown - 0.02 * s, 0);
            else beam.position.set(side * sockets.antlerR * 0.92, sockets.antlerY, 0);
            beam.rotation.z = side * -0.72;
            g.add(beam);
            beam.add(solid(new THREE.CylinderGeometry(0.028 * s, 0.046 * s, 0.36 * s, 7), m));
            const branch = (along, len, rx, rz, radius) => {
              const joint = new THREE.Group();
              joint.position.y = along;
              joint.rotation.x = rx;
              joint.rotation.z = rz;
              const part = solid(new THREE.CylinderGeometry(radius * 0.5, radius, len, 6), m);
              part.position.y = len * 0.5;
              joint.add(part);
              beam.add(joint);
            };
            branch(-0.10 * s, 0.20 * s, 1.2, side * 0.25, 0.028 * s);
            branch(-0.01 * s, 0.18 * s, 0, side * -0.62, 0.024 * s);
            branch(0.03 * s, 0.18 * s, -1.2, side * 0.2, 0.024 * s);
            branch(0.12 * s, 0.16 * s, 0.15, side * 0.38, 0.022 * s);
          });
        } else if (name === "Propeller") {
          const hub = new THREE.Group();
          hub.name = "propeller";
          const hubH = 0.04 * s;
          hub.position.set(0, sockets.classic ? crown + 0.04 * s : sockets.meshTop - hubH * 0.15, 0);
          g.add(hub);
          hub.add(solid(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.04 * s, 14), band));
          hub.add(solid(new THREE.SphereGeometry(0.085 * s, 16, 12), band));
          for (let i = 0; i < 3; i++) {
            const arm = new THREE.Group();
            arm.rotation.y = i * (Math.PI * 2 / 3);
            const blade = solid(new THREE.BoxGeometry(0.34 * s, 0.018 * s, 0.075 * s), m);
            blade.position.x = 0.17 * s;
            blade.rotation.z = -0.28;
            arm.add(blade);
            hub.add(arm);
          }
        }
      }

      // One texture in figure height. u 0.5 is the face (+Z). v is y from 0.05 to 2.45.
      function wearClothes(group, material, look, place) {
        if (!look.clothes || look.clothes === "None") return;
        const map = clothesMap(look, place);
        const bodyColor = colorOf(look, "body");
        group.traverse(mesh => {
          if (!mesh.isMesh || mesh.material !== material) return;
          if (mesh.geometry && mesh.geometry.type === "BoxGeometry") {
            const plain = material.clone();
            plain.color.copy(bodyColor);
            mesh.material = plain;
            return;
          }
          writeClothUVs(mesh);
        });
        material.map = map;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      }
      // The back is atan2's branch cut. A shared vertex cannot carry both sides,
      // so each triangle gets its own copies and a continuous angle.
      function writeClothUVs(mesh) {
        let geom = mesh.geometry;
        if (geom.index) {
          const flat = geom.toNonIndexed();
          mesh.geometry = flat;
          geom.dispose();
          geom = flat;
        }
        const pos = geom.attributes.position;
        const yBase = mesh.position.y;
        const sx = mesh.scale.x || 1;
        const sy = mesh.scale.y || 1;
        const sz = mesh.scale.z || 1;
        const uv = new Float32Array(pos.count * 2);
        const tau = Math.PI * 2;
        for (let i = 0; i < pos.count; i += 3) {
          const ang = [null, null, null];
          const known = [];
          for (let k = 0; k < 3; k++) {
            const vi = i + k;
            const x = pos.getX(vi) * sx;
            const y = yBase + pos.getY(vi) * sy;
            const z = pos.getZ(vi) * sz;
            uv[vi * 2 + 1] = (y - 0.05) / 2.4;
            if (x * x + z * z >= 1e-8) {
              ang[k] = Math.atan2(x, z);
              known.push(k);
            }
          }
          if (known.length) {
            const base = ang[known[0]];
            for (const k of known) {
              let d = ang[k] - base;
              if (d > Math.PI) d -= tau;
              if (d < -Math.PI) d += tau;
              ang[k] = base + d;
            }
            let mid = 0;
            for (const k of known) mid += ang[k];
            mid /= known.length;
            for (let k = 0; k < 3; k++) if (ang[k] == null) ang[k] = mid;
          }
          for (let k = 0; k < 3; k++) {
            uv[(i + k) * 2] = (ang[k] == null ? 0 : ang[k]) / tau + 0.5;
          }
        }
        geom.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      }
      function clothesMap(look, place) {
        const w = 512;
        const h = 512;
        const canvas = createCanvas(w, h);
        const ctx = canvas.getContext("2d");
        const img = ctx.createImageData(w, h);
        const data = img.data;
        const y0 = 0.05;
        const span = 2.4;
        const body = colorOf(look, "body");
        const cloth = colorOf(look, "clothes");
        const shade = (color, dl) => {
          const c = color.clone();
          const hsl = { h: 0, s: 0, l: 0 };
          c.getHSL(hsl);
          c.setHSL(hsl.h, hsl.s, Math.min(0.8, Math.max(0.16, hsl.l + dl)));
          return c;
        };
        const bytes = (color) => {
          const c = color.clone();
          if (c.convertLinearToSRGB) c.convertLinearToSRGB();
          return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255), 255];
        };
        const put = (x, y, rgba) => {
          const i = (y * w + x) * 4;
          data[i] = rgba[0];
          data[i + 1] = rgba[1];
          data[i + 2] = rgba[2];
          data[i + 3] = rgba[3];
        };
        const name = look.clothes;
        let hem = Math.max(0.34, place.shoulderY - 0.78);
        if (name === "Suit") hem = Math.max(0.16, place.shoulderY - 1.05);
        let neck = Math.min(place.faceY - place.faceR * 0.55, place.shoulderY + 0.18);
        if (name === "Turtleneck") neck = Math.min(place.faceY - place.faceR * 0.22, neck + 0.18);
        const jacketHem = Math.min(neck - 0.26, hem + (neck - hem) * 0.46);
        const topAt = (u) => {
          const scoop = Math.pow(Math.max(0, Math.cos((u - 0.5) * Math.PI * 2)), 2);
          if (name === "Blouse") return neck - scoop * 0.2;
          if (name === "T-shirt" || name === "Striped shirt") return neck - scoop * 0.09;
          return neck;
        };
        const bodyPx = bytes(body);
        const clothPx = bytes(cloth);
        const pleatHi = bytes(shade(cloth, 0.12));
        const pleatLo = bytes(shade(cloth, -0.1));
        const ribPx = bytes(shade(cloth, -0.14));
        const edgePx = bytes(shade(cloth, -0.18));
        const shirtPx = bytes(shade(cloth, 0.18));
        const tiePx = bytes(shade(cloth, -0.22));
        const trouserPx = bytes(shade(cloth, -0.08));
        for (let y = 0; y < h; y++) {
          const fig = y0 + (1 - y / (h - 1)) * span;
          for (let x = 0; x < w; x++) {
            const u = x / w;
            const top = topAt(u);
            if (fig < hem || fig > top) {
              put(x, y, bodyPx);
              continue;
            }
            let px = clothPx;
            if (name === "Pleated shirt") {
              px = Math.floor(u * 22) % 2 ? pleatHi : pleatLo;
              if (fig > neck - 0.06) px = ribPx;
            } else if (name === "Striped shirt") {
              px = Math.floor((fig - hem) / 0.075) % 2 ? pleatHi : pleatLo;
              if (top - fig < 0.05) px = clothPx;
            } else if (name === "Turtleneck") {
              const rib = fig > neck - 0.16 && Math.floor((neck - fig) / 0.02) % 2 === 0;
              const hemRib = fig < hem + 0.06 && Math.floor((fig - hem) / 0.02) % 2 === 0;
              px = rib || hemRib ? ribPx : clothPx;
            } else if (name === "Suit") {
              const du = Math.abs(u - 0.5);
              const open = Math.max(0, (fig - (jacketHem + 0.06)) / Math.max(0.2, neck - jacketHem - 0.06));
              const half = 0.016 + open * 0.08;
              const tieT = Math.max(0, Math.min(1, (neck - 0.04 - fig) / 0.28));
              if (fig < jacketHem) px = du < 0.01 ? edgePx : trouserPx;
              else if (du < 0.012 + tieT * 0.014 && fig < neck - 0.03 && fig > jacketHem + 0.08) px = tiePx;
              else if (open > 0 && du < half) px = shirtPx;
              else if (open > 0 && Math.abs(du - half) < 0.012) px = edgePx;
              else if (fig > neck - 0.05) px = ribPx;
              else px = clothPx;
              if (Math.abs(fig - jacketHem) < 0.018) px = edgePx;
            }
            if (Math.abs(fig - hem) < 0.016 || top - fig < 0.014) px = edgePx;
            put(x, y, px);
          }
        }
        ctx.putImageData(img, 0, 0);
        if (name === "Pleated shirt") {
          const placket = bytes(shade(cloth, 0.05));
          ctx.fillStyle = `rgb(${placket[0]},${placket[1]},${placket[2]})`;
          const x0 = Math.floor(0.488 * w);
          const yTop = (1 - (neck - y0) / span) * (h - 1);
          const yHem = (1 - (hem - y0) / span) * (h - 1);
          ctx.fillRect(x0, yTop, Math.ceil(0.024 * w), yHem - yTop);
          ctx.fillStyle = `rgb(${edgePx[0]},${edgePx[1]},${edgePx[2]})`;
          for (let i = 0; i < 5; i++) {
            const fig = hem + 0.1 + i * (neck - hem - 0.16) / 4;
            const cy = (1 - (fig - y0) / span) * (h - 1);
            ctx.beginPath();
            ctx.arc(w / 2, cy, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (name === "Blouse") {
          const petal = bytes(shade(cloth, 0.18));
          const heart = bytes(shade(cloth, -0.22));
          const petalCss = `rgb(${petal[0]},${petal[1]},${petal[2]})`;
          const heartCss = `rgb(${heart[0]},${heart[1]},${heart[2]})`;
          const bloom = (cx, cy, r) => {
            ctx.fillStyle = petalCss;
            for (let i = 0; i < 5; i++) {
              const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
              ctx.beginPath();
              ctx.ellipse(cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52, r * 0.5, r * 0.32, a, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = heartCss;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
            ctx.fill();
          };
          const cols = 6;
          const rows = 4;
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const u = ((col + (row % 2 ? 0.5 : 0)) / cols) % 1;
              const fig = hem + 0.1 + (row + 0.45) * (neck - hem - 0.18) / rows;
              if (fig > topAt(u) - 0.05 || fig < hem + 0.05) continue;
              const cx = u * w;
              const cy = (1 - (fig - y0) / span) * (h - 1);
              bloom(cx, cy, row % 2 ? 13 : 17);
            }
          }
          const bow = shade(cloth, 0.14);
          const b = bytes(bow);
          ctx.fillStyle = `rgb(${b[0]},${b[1]},${b[2]})`;
          const neckY = topAt(0.5);
          const cy = (1 - (neckY - 0.04 - y0) / span) * (h - 1);
          const cx = w / 2;
          ctx.beginPath();
          ctx.ellipse(cx - 16, cy, 16, 11, -0.4, 0, Math.PI * 2);
          ctx.ellipse(cx + 16, cy, 16, 11, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(cx - 5, cy - 5, 10, 10);
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy + 4);
          ctx.lineTo(cx - 22, cy + 36);
          ctx.lineTo(cx - 8, cy + 28);
          ctx.moveTo(cx + 6, cy + 4);
          ctx.lineTo(cx + 24, cy + 34);
          ctx.lineTo(cx + 8, cy + 26);
          ctx.fill();
        } else if (name === "Suit") {
          ctx.fillStyle = `rgb(${edgePx[0]},${edgePx[1]},${edgePx[2]})`;
          for (let i = 0; i < 3; i++) {
            const fig = jacketHem + 0.08 + i * 0.09;
            const cy = (1 - (fig - y0) / span) * (h - 1);
            ctx.beginPath();
            ctx.arc(w * 0.535, cy, 4.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const tex = new THREE.CanvasTexture(canvas);
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.needsUpdate = true;
        return tex;
      }

      function makeTool(look) {
        const m = paint(look, "tool", { metalness: 0.46, roughness: 0.32, clearcoat: 0.2 });
        const shade = (dl, extra) => {
          const c = colorOf(look, "tool");
          const hsl = { h: 0, s: 0, l: 0 };
          c.getHSL(hsl);
          c.setHSL(hsl.h, hsl.s, Math.min(0.74, Math.max(0.1, hsl.l + dl)));
          return paint(look, "tool", Object.assign({ color: c, metalness: 0.46, roughness: 0.32, clearcoat: 0.2 }, extra || {}));
        };
        const dark = shade(-0.14);
        const lite = shade(0.16, { metalness: 0.1, roughness: 0.48 });
        const hot = paint(look, "features", { emissive: colorOf(look, "features"), emissiveIntensity: 0.75 });
        const g = new THREE.Group();
        const add = (mesh, y, x, z) => { mesh.position.set(x || 0, y || 0, z || 0); g.add(mesh); return mesh; };
        const name = look.tool;
        // Built flat in local XY. +Y runs toward the working end.
        // The hold aims that end in figure space: +Z is forward, +Y is up.
        if (name === "Wrench") {
          const shaft = add(solid(new THREE.CylinderGeometry(0.02, 0.022, 0.32, 12), m), 0.16);
          shaft.scale.z = 0.38;
          const head = new THREE.Group();
          head.position.y = 0.36;
          const back = solid(new THREE.TorusGeometry(0.04, 0.014, 8, 16, Math.PI), m);
          back.rotation.z = Math.PI;
          head.add(back);
          [-1, 1].forEach(side => {
            const prong = solid(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 10), m);
            prong.position.set(side * 0.04, 0.045, 0);
            head.add(prong);
            const tip = sphere(0.014, m, 8);
            tip.position.set(side * 0.04, 0.09, 0);
            head.add(tip);
          });
          head.scale.z = 0.45;
          // Fifteen degrees, the offset on a combination wrench. A quarter turn is too much.
          head.rotation.z = -Math.PI / 12;
          g.add(head);
        } else if (name === "Pencil") {
          add(solid(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12), dark), 0.045);
          add(solid(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 12), lite), 0.012);
          add(solid(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 6), m), 0.21);
          add(solid(new THREE.CylinderGeometry(0.006, 0.018, 0.08, 8), lite), 0.41);
          add(solid(new THREE.ConeGeometry(0.006, 0.04, 8), dark), 0.47);
        } else if (name === "Magnifying glass") {
          // The lens sits in the same plane as the handle, so the rim meets the ferrule.
          add(solid(new THREE.CylinderGeometry(0.016, 0.02, 0.3, 12), m), 0.15);
          add(solid(new THREE.CylinderGeometry(0.022, 0.016, 0.045, 12), dark), 0.30);
          add(solid(new THREE.TorusGeometry(0.11, 0.016, 10, 28), m), 0.42);
          const lensMat = shade(0.22, { roughness: 0.08, metalness: 0, clearcoat: 0.8, transparent: true, opacity: 0.55 });
          const lens = add(sphere(0.092, lensMat, 24), 0.42);
          lens.scale.y = 0.28;
          lens.rotation.x = Math.PI / 2;
        } else if (name === "Brush") {
          add(solid(new THREE.CylinderGeometry(0.014, 0.018, 0.28, 12), m), 0.14);
          add(solid(new THREE.CylinderGeometry(0.032, 0.02, 0.05, 12), dark), 0.28);
          const bristles = add(solid(new THREE.ConeGeometry(0.046, 0.16, 12), dark), 0.38);
          bristles.scale.x = 1.35;
        } else if (name === "Clipboard") {
          const board = new THREE.Group();
          const put = (mesh, y, x, z) => { mesh.position.set(x || 0, y || 0, z || 0); board.add(mesh); return mesh; };
          put(solid(new THREE.BoxGeometry(0.18, 0.26, 0.014), m), 0.15);
          // Board is 0.18 by 0.26. A 0.15 by 0.23 sheet leaves the same 0.015 margin on every side.
          put(solid(new THREE.BoxGeometry(0.15, 0.23, 0.006), lite), 0.15, 0, 0.009);
          put(solid(new THREE.BoxGeometry(0.09, 0.04, 0.018), dark), 0.27, 0, 0.012);
          put(solid(new THREE.BoxGeometry(0.05, 0.012, 0.02), m), 0.292, 0, 0.016);
          board.scale.setScalar(1.5);
          g.add(board);
        } else if (name === "Watering can") {
          const can = new THREE.Group();
          const put = (mesh, y, x, z) => { mesh.position.set(x || 0, y || 0, z || 0); can.add(mesh); return mesh; };
          // The opening is the +Y end. The spout rises out of the side. The base is what points down when held.
          const wall = m.clone();
          wall.side = THREE.DoubleSide;
          put(solid(new THREE.CylinderGeometry(0.09, 0.1, 0.2, 24, 1, true), wall), 0.34);
          put(solid(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24), m), 0.246);
          const lip = put(solid(new THREE.TorusGeometry(0.09, 0.012, 8, 24), dark), 0.44);
          lip.rotation.x = Math.PI / 2;
          const spoutDir = new THREE.Vector3(0.55, 0.42, 0).normalize();
          const spout = new THREE.Group();
          spout.position.set(0.08, 0.36, 0);
          spout.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spoutDir);
          const tube = solid(new THREE.CylinderGeometry(0.014, 0.02, 0.14, 12), dark);
          tube.position.y = 0.07;
          spout.add(tube);
          const rose = solid(new THREE.CylinderGeometry(0.028, 0.018, 0.021, 14), lite);
          rose.position.y = 0.15;
          spout.add(rose);
          can.add(spout);
          const handle = put(solid(new THREE.TorusGeometry(0.065, 0.014, 8, 18, Math.PI), m), 0.34, -0.09, 0);
          handle.rotation.z = Math.PI / 2;
          const canScale = 1.35;
          can.scale.setScalar(canScale);
          g.add(can);
          const grip = new THREE.Vector3(-0.155, 0.34, 0).multiplyScalar(canScale);
          const from = new THREE.Vector3(0, 0.34, 0).multiplyScalar(canScale);
          const to = new THREE.Vector3(0, 0.24, 0).multiplyScalar(canScale);
          g.userData.localAim = [0, -1, 0];
          g.userData.localTwist = [1, 0, 0];
          g.userData.grip = [grip.x, grip.y, grip.z];
          g.userData.aimFrom = [from.x, from.y, from.z];
          g.userData.aimTo = [to.x, to.y, to.z];
          g.userData.bodyAt = [0, 0.34 * canScale, 0];
          g.userData.crownAt = [grip.x, grip.y, grip.z];
        } else if (name === "Telescope") {
          add(solid(new THREE.CylinderGeometry(0.016, 0.02, 0.07, 12), dark), 0.04);
          add(solid(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 14), m), 0.15);
          add(solid(new THREE.CylinderGeometry(0.024, 0.024, 0.018, 12), dark), 0.1);
          add(solid(new THREE.CylinderGeometry(0.046, 0.032, 0.13, 14), m), 0.28);
          add(solid(new THREE.CylinderGeometry(0.054, 0.054, 0.026, 14), dark), 0.35);
        } else if (name === "Hammer") {
          add(solid(new THREE.CylinderGeometry(0.022, 0.026, 0.5, 12), m), 0.22);
          // Trapezoid with a small round on each corner: straight face at +X, slanted peen at -X.
          const y0 = 0.42, y1 = 0.50, z = 0.03;
          const raw = [[0.13, y0], [0.13, y1], [-0.04, y1], [-0.14, y0]];
          const outline = [];
          for (let i = 0; i < raw.length; i++) {
            const prev = raw[(i + raw.length - 1) % raw.length];
            const cur = raw[i];
            const next = raw[(i + 1) % raw.length];
            const back = new THREE.Vector2(prev[0] - cur[0], prev[1] - cur[1]);
            const forward = new THREE.Vector2(next[0] - cur[0], next[1] - cur[1]);
            const cut = Math.min(0.012, back.length() * 0.35, forward.length() * 0.35);
            back.normalize();
            forward.normalize();
            const start = new THREE.Vector2(cur[0], cur[1]).addScaledVector(back, cut);
            const end = new THREE.Vector2(cur[0], cur[1]).addScaledVector(forward, cut);
            for (let k = 0; k <= 3; k++) {
              const t = k / 3;
              const mid = start.clone().lerp(end, t);
              mid.addScaledVector(new THREE.Vector2(cur[0], cur[1]).sub(mid), Math.sin(t * Math.PI) * 0.55);
              outline.push([mid.x, mid.y]);
            }
          }
          const front = outline.map(([x, y]) => new THREE.Vector3(x, y, z));
          const rear = outline.map(([x, y]) => new THREE.Vector3(x, y, -z));
          const positions = [];
          const push = (p, q, r) => positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
          const quad = (a, b, c, d) => { push(a, b, c); push(a, c, d); };
          const center = new THREE.Vector3();
          front.forEach(p => center.add(p));
          center.multiplyScalar(1 / front.length);
          const centerBack = center.clone();
          centerBack.z = -z;
          for (let i = 0; i < front.length; i++) {
            const j = (i + 1) % front.length;
            push(center, front[i], front[j]);
            push(centerBack, rear[j], rear[i]);
            quad(front[i], rear[i], rear[j], front[j]);
          }
          const head = new THREE.BufferGeometry();
          head.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
          head.computeVertexNormals();
          const headMat = m.clone();
          headMat.side = THREE.DoubleSide;
          add(solid(head, headMat), 0);
        } else if (name === "Saw") {
          add(solid(new THREE.TorusGeometry(0.1, 0.02, 8, 20), m), 0.02);
          // The heel meets the top of the ring. The tooth edge stays straight and the back tapers toward the toe.
          const plank = (y0, x0a, x0b, y1, x1a, x1b, thick, mat) => {
            const front = [
              new THREE.Vector3(x0a, y0, thick), new THREE.Vector3(x0b, y0, thick),
              new THREE.Vector3(x1b, y1, thick), new THREE.Vector3(x1a, y1, thick)
            ];
            const rear = front.map(p => new THREE.Vector3(p.x, p.y, -thick));
            const positions = [];
            const push = (p, q, r) => positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
            const quad = (a, b, c, d) => { push(a, b, c); push(a, c, d); };
            quad(front[0], front[1], front[2], front[3]);
            quad(rear[0], rear[3], rear[2], rear[1]);
            for (let i = 0; i < 4; i++) {
              const j = (i + 1) % 4;
              quad(front[i], rear[i], rear[j], front[j]);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
            geo.computeVertexNormals();
            g.add(solid(geo, mat));
          };
          const plate = m.clone();
          plate.side = THREE.DoubleSide;
          const spine = dark.clone();
          spine.side = THREE.DoubleSide;
          plank(0.13, -0.045, 0.03, 0.68, -0.02, 0.03, 0.005, plate);
          plank(0.13, -0.05, -0.034, 0.68, -0.028, -0.014, 0.007, spine);
          for (let i = 0; i < 16; i++) {
            const tooth = add(solid(new THREE.ConeGeometry(0.017, 0.032, 3), dark), 0.16 + i * 0.034, 0.032);
            tooth.rotation.z = -Math.PI / 2;
          }
        } else if (name === "Fairy wand") {
          add(solid(new THREE.CylinderGeometry(0.012, 0.015, 0.52, 8), m), 0.24);
          const ribbon = add(solid(new THREE.TorusGeometry(0.045, 0.006, 6, 14, Math.PI), lite), 0.34, 0.03);
          ribbon.rotation.z = 0.8;
          const tail = add(solid(new THREE.TorusGeometry(0.032, 0.005, 6, 12, Math.PI * 0.85), lite), 0.3, -0.02);
          tail.rotation.z = -2.4;
          const star = new THREE.Group();
          star.position.y = 0.52;
          for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5;
            const dx = Math.sin(a);
            const dy = Math.cos(a);
            const point = solid(new THREE.ConeGeometry(0.034, 0.15, 4), hot);
            point.position.set(dx * 0.028, dy * 0.028, 0);
            point.rotation.z = Math.atan2(-dx, dy);
            point.scale.z = 0.32;
            star.add(point);
          }
          // The star lies in the stick's plane.
          g.add(star);
        } else if (name === "Scissors") {
          add(sphere(0.015, dark, 10), 0.16);
          [-1, 1].forEach(side => {
            const half = new THREE.Group();
            half.position.set(0, 0.16, side * 0.003);
            half.rotation.z = side * -0.48;
            const blade = solid(new THREE.CylinderGeometry(0.0015, 0.008, 0.21, 4), m);
            blade.position.y = 0.12;
            blade.scale.z = 0.4;
            half.add(blade);
            const shank = solid(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), m);
            shank.position.y = -0.04;
            shank.scale.z = 0.5;
            half.add(shank);
            const loop = solid(new THREE.TorusGeometry(0.024, 0.007, 6, 14), m);
            loop.position.set(0, -0.105, 0);
            half.add(loop);
            g.add(half);
          });
        } else if (name === "Tongs") {
          const spring = add(solid(new THREE.TorusGeometry(0.026, 0.009, 6, 12, Math.PI), m), 0.02);
          spring.rotation.z = Math.PI / 2;
          [-1, 1].forEach(side => {
            const pivot = new THREE.Group();
            pivot.position.set(0, 0.04, 0);
            pivot.rotation.z = side * -0.16;
            const arm = solid(new THREE.CylinderGeometry(0.008, 0.01, 0.28, 8), m);
            arm.position.y = 0.14;
            pivot.add(arm);
            const tip = sphere(0.02, dark, 10);
            tip.position.set(0, 0.3, 0);
            tip.scale.set(0.62, 1.2, 0.5);
            pivot.add(tip);
            g.add(pivot);
          });
        }
        const marked = {
          "Wrench": { grip: [0, 0.08, 0], from: [0, 0.16, 0], to: [0, 0.42, 0] },
          "Pencil": { grip: [0, 0.1, 0], from: [0, 0.2, 0], to: [0, 0.47, 0] },
          "Magnifying glass": { grip: [0, 0.08, 0], from: [0, 0.15, 0], to: [0, 0.42, 0] },
          "Brush": { grip: [0, 0.04, 0], from: [0, 0.14, 0], to: [0, 0.46, 0] },
          "Clipboard": { grip: [0, 0.06, 0], from: [0, 0.08, 0], to: [0, 0.40, 0], faceFrom: [0, 0.22, 0], faceTo: [0, 0.22, 1] },
          "Telescope": { grip: [0, 0.15, 0], from: [0, 0.04, 0], to: [0, 0.35, 0] },
          "Hammer": { grip: [0, 0.1, 0], from: [0, 0.16, 0], to: [0, 0.46, 0], faceFrom: [0, 0.46, 0], faceTo: [0.13, 0.46, 0] },
          "Saw": { grip: [0, 0.02, 0], from: [0, 0.02, 0], to: [0, 0.55, 0], faceFrom: [0, 0.40, 0], faceTo: [0.08, 0.40, 0] },
          "Fairy wand": { grip: [0, 0.10, 0], from: [0, 0.10, 0], to: [0, 0.52, 0], faceFrom: [0, 0.52, 0], faceTo: [0, 0.62, 0] },
          "Scissors": { grip: [0, 0.06, 0], from: [0, 0.06, 0], to: [0, 0.36, 0], faceFrom: [-0.05, 0.07, 0], faceTo: [0.05, 0.07, 0] },
          "Tongs": { grip: [0, 0.03, 0], from: [0, 0.04, 0], to: [0, 0.30, 0] }
        }[name];
        if (marked) {
          g.userData.grip = marked.grip;
          g.userData.aimFrom = marked.from;
          g.userData.aimTo = marked.to;
          if (marked.faceFrom) {
            g.userData.faceFrom = marked.faceFrom;
            g.userData.faceTo = marked.faceTo;
          }
        }
        return g;
      }

      // Figure-space aims from design/holds.md. The prototype joint angles are not used.
      // along "forearm" sends the tool's working axis out past the fist. aim is a figure direction.
      // twist is the figure direction of the tool's local +X (or localTwist), used for the roll.
      const DOWN = [0, -1, 0];
      const UP = [0, 1, 0];
      const RIGHT = [1, 0, 0];
      const ARM = {
        forward: { target: [0.42, -0.02, 0.22], pole: [1.05, 0.05, -0.25] },
        down: { target: [0.2, -0.36, 0.24], pole: [1.2, 0.15, -0.15] },
        raised: { target: [0.1, 0.34, 0.26], pole: [0.7, -0.6, 0.1] }
      };
      const HOLDS = {
        "Wrench": { arm: "forward", along: "forearm", twist: RIGHT },
        "Pencil": { arm: "down", along: "forearm", twist: RIGHT },
        "Magnifying glass": { arm: "forward", aim: UP, twist: RIGHT },
        "Brush": { arm: "down", aim: DOWN, twist: RIGHT },
        "Clipboard": { arm: "forward", aim: UP, twist: RIGHT },
        "Watering can": { arm: "forward", aim: DOWN, twist: RIGHT },
        "Telescope": { arm: "raised", aim: [0.78, 0.02, 0.62], twist: UP },
        "Hammer": { arm: "forward", along: "forearm", twist: DOWN },
        "Saw": { arm: "forward", along: "forearm", twist: DOWN },
        "Fairy wand": { arm: "raised", aim: [0.84, 0.2, 0.5], twist: [-1, 0, 0] },
        "Scissors": { arm: "forward", along: "forearm", twist: UP },
        "Tongs": { arm: "down", aim: DOWN, twist: RIGHT }
      };

      const fromDown = new THREE.Vector3(0, -1, 0);
      const aim = new THREE.Vector3();
      const pole = new THREE.Vector3();
      const upperDir = new THREE.Vector3();
      const lowerDir = new THREE.Vector3();
      const elbowAt = new THREE.Vector3();
      const holdAim = new THREE.Vector3();
      const holdTwist = new THREE.Vector3();
      const holdSrcA = new THREE.Vector3();
      const holdSrcT = new THREE.Vector3();
      const holdHint = new THREE.Vector3();
      const holdFrom = new THREE.Vector3();
      const holdTo = new THREE.Vector3();
      const holdHand = new THREE.Vector3();
      const holdElbowPt = new THREE.Vector3();
      const holdGrip = new THREE.Vector3();
      const holdQ = new THREE.Quaternion();
      const holdRoll = new THREE.Quaternion();
      const holdParent = new THREE.Quaternion();
      const holdFigure = new THREE.Quaternion();
      function poseBones(arm, elbow, upperLen, lowerLen, target, bendToward) {
        const dist = Math.min(upperLen + lowerLen - 1e-3, Math.max(Math.abs(upperLen - lowerLen) + 1e-3, target.length()));
        aim.copy(target).multiplyScalar(1 / Math.max(target.length(), 1e-6));
        const cosShoulder = (upperLen * upperLen + dist * dist - lowerLen * lowerLen) / (2 * upperLen * dist);
        const bend = Math.acos(Math.min(1, Math.max(-1, cosShoulder)));
        pole.copy(bendToward).addScaledVector(aim, -bendToward.dot(aim));
        if (pole.lengthSq() < 1e-8) pole.set(1, 0, 0);
        pole.normalize();
        upperDir.copy(aim).multiplyScalar(Math.cos(bend)).addScaledVector(pole, Math.sin(bend)).normalize();
        arm.quaternion.setFromUnitVectors(fromDown, upperDir);
        elbowAt.copy(upperDir).multiplyScalar(upperLen);
        lowerDir.copy(target).sub(elbowAt);
        if (lowerDir.lengthSq() < 1e-8) lowerDir.copy(upperDir);
        lowerDir.normalize();
        lowerDir.applyQuaternion(arm.quaternion.clone().invert());
        elbow.quaternion.setFromUnitVectors(fromDown, lowerDir);
      }
      function addArms(g, look, place, activity, sockets) {
        const material = paint(look, "body");
        const pose = HOLDS[look.tool];
        let holder = null;
        [-1, 1].forEach(side => {
          const held = pose && side > 0;
          const upperLen = 0.26;
          const lowerLen = 0.22;
          const arm = new THREE.Group();
          const upper = solid(new THREE.CylinderGeometry(0.055, 0.042, upperLen, 14), material);
          upper.position.y = -upperLen / 2;
          arm.add(upper);
          const elbow = new THREE.Group();
          elbow.name = "elbow";
          elbow.userData.side = side;
          elbow.position.y = -upperLen;
          elbow.add(sphere(0.046, material, 12));
          const lower = solid(new THREE.CylinderGeometry(0.04, 0.03, lowerLen, 14), material);
          lower.position.y = -lowerLen / 2;
          elbow.add(lower);
          const hand = sphere(0.05, material, 14);
          hand.position.y = -lowerLen;
          elbow.add(hand);
          arm.add(elbow);
          const shoulder = side < 0 ? sockets.shoulderLeft : sockets.shoulderRight;
          arm.position.set(shoulder[0], shoulder[1], shoulder[2]);
          if (held) {
            const shape = ARM[pose.arm];
            const target = new THREE.Vector3(shape.target[0], shape.target[1], shape.target[2]);
            const bendToward = new THREE.Vector3(side * shape.pole[0], shape.pole[1], shape.pole[2]);
            poseBones(arm, elbow, upperLen, lowerLen, target, bendToward);
            sockets.handRight = [
              shoulder[0] + target.x,
              shoulder[1] + target.y,
              shoulder[2] + target.z
            ];
            holder = { elbow, y: -lowerLen };
          } else {
            const lifted = activity === "working" && side > 0;
            const target = new THREE.Vector3(
              lifted ? -0.1 : side * 0.16,
              lifted ? 0.12 : -0.32,
              lifted ? 0.3 : 0.1
            );
            const bendToward = new THREE.Vector3(side * 1.2, lifted ? 1 : -0.15, lifted ? 0.2 : -0.35);
            poseBones(arm, elbow, upperLen, lowerLen, target, bendToward);
            sockets[side < 0 ? "handLeft" : "handRight"] = [
              shoulder[0] + target.x,
              shoulder[1] + target.y,
              shoulder[2] + target.z
            ];
          }
          g.add(arm);
        });
        if (pose && holder) {
          const tool = makeTool(look);
          tool.name = "held-tool";
          tool.scale.setScalar(1.05);
          holder.elbow.add(tool);
          aimHeldTool(tool, holder.elbow, g, pose, holder.y);
        }
      }

      // Aims in figure space, then expresses that rotation in the elbow. The stage camera is not an input.
      function aimHeldTool(tool, elbow, figure, pose, handY) {
        figure.updateMatrixWorld(true);
        figure.getWorldQuaternion(holdFigure);
        if (pose.along === "forearm") {
          holdHand.set(0, handY, 0);
          elbow.localToWorld(holdHand);
          figure.worldToLocal(holdHand);
          elbow.getWorldPosition(holdElbowPt);
          figure.worldToLocal(holdElbowPt);
          holdAim.copy(holdHand).sub(holdElbowPt);
        } else {
          holdAim.set(pose.aim[0], pose.aim[1], pose.aim[2]);
        }
        holdAim.normalize().applyQuaternion(holdFigure);
        holdTwist.set(pose.twist[0], pose.twist[1], pose.twist[2]).applyQuaternion(holdFigure);
        const srcA = tool.userData.localAim || [0, 1, 0];
        const srcT = tool.userData.localTwist || [1, 0, 0];
        holdSrcA.set(srcA[0], srcA[1], srcA[2]).normalize();
        holdSrcT.set(srcT[0], srcT[1], srcT[2]);
        if (holdSrcT.lengthSq() < 1e-8) holdSrcT.set(1, 0, 0);
        holdSrcT.normalize();
        holdQ.setFromUnitVectors(holdSrcA, holdAim);
        holdHint.copy(holdSrcT).applyQuaternion(holdQ);
        holdFrom.copy(holdHint).addScaledVector(holdAim, -holdHint.dot(holdAim));
        holdTo.copy(holdTwist).addScaledVector(holdAim, -holdTwist.dot(holdAim));
        if (holdFrom.lengthSq() > 1e-8 && holdTo.lengthSq() > 1e-8) {
          holdFrom.normalize();
          holdTo.normalize();
          // Roll around the aim. A 180° setFromUnitVectors picks an axis that flips the aim.
          holdHint.crossVectors(holdFrom, holdTo);
          const rollAngle = Math.atan2(holdHint.dot(holdAim), holdFrom.dot(holdTo));
          if (Math.abs(rollAngle) > 1e-5) {
            holdRoll.setFromAxisAngle(holdAim, rollAngle);
            holdQ.premultiply(holdRoll);
          }
        }
        elbow.getWorldQuaternion(holdParent);
        tool.quaternion.copy(holdParent).invert().multiply(holdQ);
        const grip = tool.userData.grip;
        holdGrip.set(grip[0], grip[1], grip[2]).multiplyScalar(tool.scale.x);
        holdGrip.applyQuaternion(tool.quaternion);
        tool.position.set(0, handY, 0).sub(holdGrip);
      }

      function buildFigure(look, sealed, activity) {
        const g = new THREE.Group();
        const bodyMat = paint(look, "body");
        const { group, place } = shapeBody(look.shape, bodyMat, look);
        const sockets = bodySockets(place, group);
        g.userData.sockets = sockets;
        g.userData.place = place;
        g.add(group);
        if (!sealed) wearClothes(group, bodyMat, look, place);
        addFace(g, look, place);
        if (!sealed) {
          addArms(g, look, place, activity, sockets);
          addExtra(g, look, place, sockets);
        }
        return g;
      }


  function buildNamed(kind, name) {
    const look = defaultLook();
    if (kind === "shape") look.shape = name;
    else look[kind] = name;
    return buildFigure(look, false, "idle");
  }

  return { buildFigure, buildNamed, bodySockets, stageCamera };
}

function bindCatalog(THREE, env) {
  const draw = createDraw(THREE, env);
  for (const kind of ["shape", "clothes", "tool", "extra"]) {
    for (const name of catalogNames(kind)) {
      setBuilder(kind, name, () => draw.buildNamed(kind, name));
    }
  }
  return draw;
}

export { bindCatalog, createDraw };
