import * as THREE from 'three';
// Feature creation functions for dungeon walls

export function createDoor(scene, x, z, rotation) {
    // Placeholder for door creation
    const doorGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);

    // Dungeon wall height is assumed to be 1, adjust if needed
    door.position.set(x, 0.5, z);
    door.rotation.y = rotation;
    scene.add(door);
}

export function createTorch(scene, x, z, rotation, dungeon) {
    // Placeholder for torch creation
    const torchGroup = new THREE.Group();

    // Torch handle
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2822 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = dungeon.wallHeight/2;

    // Torch flame
    const flameGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = dungeon.wallHeight/2 + 0.2;

    // Add to group
    torchGroup.add(handle);
    torchGroup.add(flame);

    // Add torch light
    const torchLight = new THREE.PointLight(0xff5500, 1, 3);
    torchLight.position.y = dungeon.wallHeight/2 + 0.2;
    torchGroup.add(torchLight);

    // Position and rotate the torch group
    torchGroup.position.set(x, 0, z);
    torchGroup.rotation.y = rotation;

    // Adjust position to be flush with wall
    const offset = 0.51; // Slightly more than half the wall thickness
    const offsetPosition = dungeon.getWallFeatureOffset(rotation, offset);
    torchGroup.position.x += offsetPosition.x;
    torchGroup.position.z += offsetPosition.z;

    scene.add(torchGroup);

    // Store torch for animation
    if (!dungeon.torches) dungeon.torches = [];
    dungeon.torches.push({
        flame,
        light: torchLight,
        time: Math.random() * Math.PI * 2
    });
}

export function createPainting(scene, x, z, rotation, dungeon) {
    // Placeholder for painting creation
    const frameGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.05);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);

    frame.position.set(x, dungeon.wallHeight/2, z);
    frame.rotation.y = rotation;

    // Adjust position to be flush with wall
    const offset = 0.525; // Slightly more than half the wall thickness
    const offsetPosition = dungeon.getWallFeatureOffset(rotation, offset);
    frame.position.x += offsetPosition.x;
    frame.position.z += offsetPosition.z;

    scene.add(frame);
}
