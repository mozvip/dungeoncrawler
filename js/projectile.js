class Projectile {
    constructor(scene, position, direction, speed = 0.15, lifetime = 3000) {
        this.scene = scene;
        this.position = { ...position };
        this.direction = direction;
        this.speed = speed;
        this.lifetime = lifetime;
        this.isActive = true;
        this.createdAt = Date.now();
        this.mesh = null;
        this.light = null;
        
        // Create the projectile visuals (to be implemented by subclasses)
        this.createProjectile();
    }
    
    // Abstract method to be implemented by subclasses
    createProjectile() {
        // This should be overridden by subclasses
        console.warn("createProjectile() not implemented by subclass");
    }

    update(deltaTime, dungeon) {
        if (!this.isActive) return;
        
        // Check if lifetime is up
        if (Date.now() - this.createdAt > this.lifetime) {
            this.destroy();
            return;
        }
        
        // Calculate new position
        const movementDistance = this.speed * (deltaTime / 16.67); // Normalized to ~60fps
        
        const newPosition = { ...this.position };
        
        // Move in the direction the projectile is facing
        if (this.direction === 0) { // North
            newPosition.z -= movementDistance;
        } else if (this.direction === 1) { // East
            newPosition.x += movementDistance;
        } else if (this.direction === 2) { // South
            newPosition.z += movementDistance;
        } else { // West
            newPosition.x -= movementDistance;
        }
        
        // Check for collisions
        const cellX = Math.floor(newPosition.x);
        const cellZ = Math.floor(newPosition.z);

        if (dungeon && !dungeon.isValidPosition(cellX, cellZ)) {
            // Hit a wall - create impact effect and destroy
            this.createImpactEffect();
            this.destroy();
            return;
        }
        
        // Update position
        this.position = newPosition;
        this.updateVisuals(deltaTime);
    }
    
    // Update visual elements of the projectile (can be overridden by subclasses)
    updateVisuals(deltaTime) {
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        }
        
        if (this.light) {
            this.light.position.copy(this.mesh.position);
            
            // Default light flicker effect
            this.light.intensity = 1.8 + Math.random() * 0.4;
        }
        
        // Default rotation for most projectiles
        if (this.mesh) {
            this.mesh.rotation.x += 0.05;
            this.mesh.rotation.z += 0.05;
        }
    }
    
    // Abstract method to be implemented by subclasses
    createImpactEffect() {
        // This should be overridden by subclasses
        console.warn("createImpactEffect() not implemented by subclass");
    }
    
    destroy() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.mesh) this.scene.remove(this.mesh);
        if (this.light) this.scene.remove(this.light);
    }
    
    // Utility method for creating a simple impact light
    createBasicImpactLight(color, intensity) {
        const impactLight = new THREE.PointLight(color, intensity, 3);
        impactLight.position.copy(this.mesh.position);
        this.scene.add(impactLight);
        
        // Fade out impact light
        setTimeout(() => {
            this.scene.remove(impactLight);
        }, 150);
    }
}

// Factory function to create the appropriate projectile type
function createProjectile(scene, position, direction, type, speed, lifetime) {
    // This will be replaced with dynamic imports
    switch (type) {
        case 'fireball':
            return new Fireball(scene, position, direction, speed, lifetime);
        case 'ice':
            return new IceArrow(scene, position, direction, speed, lifetime);
        case 'lightning':
            return new Lightning(scene, position, direction, speed, lifetime);
        case 'gasCloud':
            return new GasCloud(scene, position, direction, speed, lifetime);
        default:
            return new Fireball(scene, position, direction, speed, lifetime);
    }
}