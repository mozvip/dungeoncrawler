import * as THREE from 'three';

/**
 * PitMesh.js - Handles the creation of pit/trap meshes for the dungeon
 */

export class PitMesh {
    /**
     * Create a pit/trap mesh
     * @param {number} x - X coordinate in the dungeon grid
     * @param {number} z - Z coordinate in the dungeon grid
     * @param {THREE.Material} material - Material to use for the pit walls
     * @param {Object} options - Additional options for customizing the pit
     * @returns {Object} - Object containing the pit group and light
     */
    static create(x, z, material, options = {}) {
        const pitDepth = options.pitDepth || 2; // How deep the pit goes
        const pitSize = options.pitSize || 0.8; // Slightly smaller than a full tile to create a ledge
        
        // Create the pit geometry
        const pitGroup = new THREE.Group();
        
        // Bottom of the pit
        const pitBottomGeometry = new THREE.PlaneGeometry(pitSize, pitSize);
        const pitBottom = new THREE.Mesh(pitBottomGeometry, material);
        pitBottom.rotation.x = -Math.PI / 2;
        pitBottom.position.set(0, -pitDepth, 0);
        pitGroup.add(pitBottom);
        
        // Walls of the pit - using thin boxes for the four sides
        // North wall
        const northWallGeometry = new THREE.BoxGeometry(pitSize, pitDepth, 0.05);
        const northWall = new THREE.Mesh(northWallGeometry, material);
        northWall.position.set(0, -pitDepth/2, -pitSize/2);
        pitGroup.add(northWall);
        
        // South wall
        const southWallGeometry = new THREE.BoxGeometry(pitSize, pitDepth, 0.05);
        const southWall = new THREE.Mesh(southWallGeometry, material);
        southWall.position.set(0, -pitDepth/2, pitSize/2);
        pitGroup.add(southWall);
        
        // East wall
        const eastWallGeometry = new THREE.BoxGeometry(0.05, pitDepth, pitSize);
        const eastWall = new THREE.Mesh(eastWallGeometry, material);
        eastWall.position.set(pitSize/2, -pitDepth/2, 0);
        pitGroup.add(eastWall);
        
        // West wall
        const westWallGeometry = new THREE.BoxGeometry(0.05, pitDepth, pitSize);
        const westWall = new THREE.Mesh(westWallGeometry, material);
        westWall.position.set(-pitSize/2, -pitDepth/2, 0);
        pitGroup.add(westWall);
        
        // Position the entire pit in the world
        pitGroup.position.set(x, 0, z);
        
        // Add lighting effect inside the pit
        const pitLight = new THREE.PointLight(0xff3300, 0.7, 2);
        pitLight.position.set(x, -pitDepth/2, z);
        
        // Return both the group and light
        return {
            group: pitGroup,
            light: pitLight,
            lightData: {
                x: x,
                z: z,
                pulseSpeed: 0.5 + Math.random() * 0.5,
                time: Math.random() * Math.PI * 2
            }
        };
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PitMesh;
}