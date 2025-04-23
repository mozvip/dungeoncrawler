/**
 * StairsMesh.js - Handles the creation of stair meshes for the dungeon
 */

class StairsMesh {
    /**
     * Create a stairs mesh
     * @param {number} x - X coordinate in the dungeon grid
     * @param {number} z - Z coordinate in the dungeon grid
     * @param {THREE.Material} material - Material to use for the stairs
     * @param {boolean} isUp - Whether the stairs go up (true) or down (false)
     * @param {Object} options - Additional options for customizing the stairs
     * @returns {THREE.Group} - Group containing the stair meshes
     */
    static create(x, z, material, isUp, options = {}) {
        const stairHeight = options.stairHeight || 0.2; // Height of each step
        const stairDepth = options.stairDepth || 0.3; // Depth of each step
        const stairWidth = options.stairWidth || 1; // Width of the stairs
        const numSteps = options.numSteps || 5; // Number of steps
        const baseHeight = options.baseHeight || 0; // Base height offset

        const stairsGroup = new THREE.Group();

        for (let i = 0; i < numSteps; i++) {
            const stepGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
            const step = new THREE.Mesh(stepGeometry, material);
            step.position.set(0, i * stairHeight + baseHeight, i * stairDepth * (isUp ? 1 : -1));
            step.castShadow = true;
            step.receiveShadow = true;
            stairsGroup.add(step);
        }

        stairsGroup.position.set(x, 0, z);
        return stairsGroup;
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StairsMesh;
}