import * as THREE from 'three';
import { Projectile } from '../projectile.js';

// filepath: /mnt/Apps/github.com/mozvip/dunwich/js/projectiles/IceArrow.js
export class IceArrow extends Projectile {
    constructor(scene, position, direction, speed = 0.2, lifetime = 3000) {
        super(scene, position, direction, speed, lifetime);
    }

    createProjectile() {
        // Create an ice arrow
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 12);
        
        // Create material with emissive properties for glowing effect
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            emissiveIntensity: 1,
            roughness: 0.2,
            metalness: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position at the starting point
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Add a point light to make it glow
        this.light = new THREE.PointLight(0x00aaaa, 2, 3);
        this.light.position.copy(this.mesh.position);
        
        // Add to scene
        this.scene.add(this.mesh);
        this.scene.add(this.light);
    }

    createImpactEffect() {
        // Blue/cyan impact for ice arrows
        this.createBasicImpactLight(0x00aaff, 4);
    }
}