import * as THREE from 'three';
import { Projectile } from '../projectile.js';

// filepath: /mnt/Apps/github.com/mozvip/dunwich/js/projectiles/GasCloud.js
export class GasCloud extends Projectile {
    constructor(scene, position, direction, speed = 0.08, lifetime = 4000) {
        super(scene, position, direction, speed, lifetime);
        this.particles = [];
    }

    createProjectile() {
        // Create a gas cloud using particle-like geometry
        const cloudGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        
        // Semi-transparent green toxic gas material
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0x2aff80,
            emissive: 0x1a6640,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create the main cloud mesh
        this.mesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        // Position at the starting point
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Create particles to simulate gas
        this.particles = [];
        
        // Create 5 smaller particles around the main cloud
        for (let i = 0; i < 5; i++) {
            const particleSize = 0.1 + Math.random() * 0.15;
            const particleGeo = new THREE.SphereGeometry(particleSize, 8, 8);
            
            // Vary the color slightly for each particle
            const hueShift = (Math.random() * 0.2) - 0.1; // -0.1 to 0.1
            const particleColor = new THREE.Color(0x2aff80);
            particleColor.offsetHSL(hueShift, 0, 0);
            
            const particleMat = new THREE.MeshStandardMaterial({
                color: particleColor,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3,
                roughness: 0.9
            });
            
            const particle = new THREE.Mesh(particleGeo, particleMat);
            
            // Position particles around the main cloud
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.1;
            particle.position.x = this.mesh.position.x + Math.cos(angle) * radius;
            particle.position.y = this.mesh.position.y + (Math.random() * 0.2 - 0.1);
            particle.position.z = this.mesh.position.z + Math.sin(angle) * radius;
            
            // Store initial offset for animation
            particle.userData = {
                offsetX: Math.cos(angle) * radius,
                offsetZ: Math.sin(angle) * radius,
                speed: 0.01 + Math.random() * 0.02,
                angle: angle
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
        
        // Add a point light to make it glow (dimmer than fireball)
        this.light = new THREE.PointLight(0x2aff80, 1, 2);
        this.light.position.copy(this.mesh.position);
        
        // Add to scene
        this.scene.add(this.mesh);
        this.scene.add(this.light);
    }
    
    updateVisuals(deltaTime) {
        // Update position of main mesh and light
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        }
        if (this.light) {
            this.light.position.copy(this.mesh.position);
        }
        
        // Update the particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const userData = particle.userData;
            
            // Rotate particle around the center
            userData.angle += userData.speed;
            
            // Update particle position
            particle.position.x = this.position.x + Math.cos(userData.angle) * userData.offsetX;
            particle.position.z = this.position.z + Math.sin(userData.angle) * userData.offsetZ;
            
            // Move with the main cloud
            particle.position.y = this.position.y + (Math.sin(userData.angle * 2) * 0.05);
            
            // Pulsate opacity for gas-like effect
            if (particle.material) {
                particle.material.opacity = 0.4 + Math.sin(Date.now() * 0.005 + i) * 0.3;
            }
        }
        
        // Make gas cloud grow slightly over time
        const lifeProgress = (Date.now() - this.createdAt) / this.lifetime;
        const scaleFactor = 1 + lifeProgress * 0.5; // Grow up to 50% larger
        this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Flickering effect for the gas
        this.light.intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    }

    createImpactEffect() {
        // Green toxic impact for gas clouds
        this.createBasicImpactLight(0x2aff80, 3);
        
        // Create additional gas particles on impact
        this.createGasImpactParticles();
    }
    
    // Special impact effect for gas clouds
    createGasImpactParticles() {
        for (let i = 0; i < 10; i++) {
            const particleSize = 0.1 + Math.random() * 0.2;
            const particleGeo = new THREE.SphereGeometry(particleSize, 8, 8);
            
            const particleMat = new THREE.MeshStandardMaterial({
                color: 0x2aff80,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3
            });
            
            const particle = new THREE.Mesh(particleGeo, particleMat);
            
            // Scatter particles around impact point
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.3 + Math.random() * 0.5;
            
            particle.position.x = this.mesh.position.x + Math.cos(angle) * distance;
            particle.position.y = this.mesh.position.y + (Math.random() * 0.3);
            particle.position.z = this.mesh.position.z + Math.sin(angle) * distance;
            
            this.scene.add(particle);
            
            // Fade out and remove particles after a delay
            const duration = 500 + Math.random() * 500;
            let startTime = Date.now();
            
            const animateParticle = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);
                
                if (progress < 1) {
                    // Fade out opacity
                    particleMat.opacity = (1 - progress) * 0.8;
                    requestAnimationFrame(animateParticle);
                } else {
                    // Remove when animation completes
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particleMat.dispose();
                }
            };
            
            animateParticle();
        }
    }
    
    destroy() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.mesh) this.scene.remove(this.mesh);
        if (this.light) this.scene.remove(this.light);
        
        // Remove gas cloud particles
        if (this.particles) {
            for (const particle of this.particles) {
                this.scene.remove(particle);
            }
            this.particles = [];
        }
    }
}