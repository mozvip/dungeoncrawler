import * as THREE from 'three';
import { Projectile } from '../projectile.js';

// filepath: /mnt/Apps/github.com/mozvip/dunwich/js/projectiles/Lightning.js
export class Lightning extends Projectile {
    constructor(scene, position, direction, speed = 0.25, lifetime = 2000) {
        super(scene, position, direction, speed, lifetime);
    }

    createProjectile() {
        // Create a lightning bolt
        const geometry = new THREE.ConeGeometry(0.07, 1.2, 8);
        
        // Create material with emissive properties for electric glowing effect
        const material = new THREE.MeshStandardMaterial({
            color: 0xeeff00, // Bright yellow
            emissive: 0x88aaff, // Blue-ish glow
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position at the starting point
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Rotate to point in the direction
        if (this.direction === 0) { // North
            this.mesh.rotation.x = Math.PI / 2;
        } else if (this.direction === 1) { // East
            this.mesh.rotation.z = -Math.PI / 2;
        } else if (this.direction === 2) { // South
            this.mesh.rotation.x = -Math.PI / 2;
        } else { // West
            this.mesh.rotation.z = Math.PI / 2;
        }
        
        // Add a point light to make it glow
        this.light = new THREE.PointLight(0xaaddff, 3, 4);
        this.light.position.copy(this.mesh.position);
        
        // Add to scene
        this.scene.add(this.mesh);
        this.scene.add(this.light);
    }
    
    updateVisuals(deltaTime) {
        // Update position
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        }
        if (this.light) {
            this.light.position.copy(this.mesh.position);
            
            // Electric flicker effect
            this.light.intensity = 2.5 + Math.random() * 1.0;
        }
        
        // Lightning doesn't rotate like other projectiles
    }

    createImpactEffect() {
        // Electric blue/white impact for lightning
        this.createBasicImpactLight(0xccffff, 6);
    }
}