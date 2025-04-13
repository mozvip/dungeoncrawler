// filepath: /mnt/Apps/github.com/mozvip/dunwich/js/projectiles/Fireball.js
class Fireball extends Projectile {
    constructor(scene, position, direction, speed = 0.10, lifetime = 3000) {
        super(scene, position, direction, speed, lifetime);
    }

    createProjectile() {
        // Create a glowing fireball
        const geometry = new THREE.SphereGeometry(0.2, 12, 12);
        
        // Create material with emissive properties for glowing effect
        const material = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            emissive: 0xff5500,
            emissiveIntensity: 1,
            roughness: 0.2,
            metalness: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position at the starting point
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Add a point light to make it glow
        this.light = new THREE.PointLight(0xff5500, 2, 3);
        this.light.position.copy(this.mesh.position);
        
        // Add to scene
        this.scene.add(this.mesh);
        this.scene.add(this.light);
    }

    createImpactEffect() {
        // Orange/red impact for fireballs
        this.createBasicImpactLight(0xff3300, 5);
    }
}