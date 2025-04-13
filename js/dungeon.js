class Dungeon {
    constructor() {
        // Default empty map (will be replaced when loaded)
        this.map = [];
        
        // Dungeon properties
        this.name = "";
        this.description = "";
        
        // Player starting position
        this.playerStart = {
            x: 1,
            z: 1,
            direction: 0
        };
        
        // Wall dimensions
        this.wallWidth = 1;
        this.wallHeight = 1;
        this.wallDepth = 1;
        
        this.wallTexture = null;
        this.floorTexture = null;
        this.ceilingTexture = null;
        
        // Current level
        this.currentLevel = "level1";
    }
    
    // Load dungeon data from JSON file
    async loadDungeonData(levelName = "level1") {
        this.currentLevel = levelName;
        
        try {
            const response = await fetch(`assets/dungeons/${levelName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load dungeon data: ${response.status}`);
            }
            
            const dungeonData = await response.json();
            
            // Set dungeon properties
            this.name = dungeonData.name || "Unnamed Dungeon";
            this.description = dungeonData.description || "";
            this.map = dungeonData.map || [];
            this.playerStart = dungeonData.playerStart || { x: 1, z: 1, direction: 0 };
            
            console.log(`Loaded dungeon: ${this.name}`);
            return true;
        } catch (error) {
            console.error("Error loading dungeon data:", error);
            // Create a default map if loading fails
            this.createDefaultMap();
            return false;
        }
    }
    
    // Create a default map in case loading fails
    createDefaultMap() {
        console.warn("Creating default map");
        this.name = "Default Dungeon";
        this.description = "A basic dungeon layout";
        
        // Define default dungeon map - 1 is wall, 0 is floor
        this.map = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ];
        
        this.playerStart = { x: 1, z: 1, direction: 0 };
    }

    // Initialize textures
    initTextures() {
        const textureLoader = new THREE.TextureLoader();
        
        // Load textures
        this.wallTexture = textureLoader.load('assets/wall.jpg', texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
        });
        
        this.floorTexture = textureLoader.load('assets/floor.jpg', texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
        });
        
        this.ceilingTexture = textureLoader.load('assets/ceiling.jpg', texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
        });
    }

    // Create the dungeon geometry
    async createDungeon(scene) {
        // First load the dungeon data
        await this.loadDungeonData(this.currentLevel);
        
        this.initTextures();
        
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            map: this.wallTexture,
            roughness: 0.8
        });
        
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            map: this.floorTexture,
            roughness: 0.9
        });
        
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            map: this.ceilingTexture,
            roughness: 0.7
        });
        
        // Create materials for the pit/hole
        const pitWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.2,
            side: THREE.DoubleSide
        });

        // Create walls
        for (let x = 0; x < this.map.length; x++) {
            for (let z = 0; z < this.map[x].length; z++) {
                const tileValue = this.map[x][z];
                
                if (tileValue === 1) {
                    // Wall cube - using consistent dimensions for square appearance
                    const wallGeometry = new THREE.BoxGeometry(
                        this.wallWidth, 
                        this.wallHeight, 
                        this.wallDepth
                    );
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, this.wallHeight / 2, z);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    scene.add(wall);
                } else {
                    // For all walkable spaces (0 = normal floor, 2 = trap)
                    
                    if (tileValue === 2) {
                        // Create a pit/hole for the trap
                        this.createPit(scene, x, z, pitWallMaterial);
                    } else {
                        // Regular floor
                        const floorGeometry = new THREE.PlaneGeometry(1, 1);
                        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                        floor.rotation.x = -Math.PI / 2;
                        floor.position.set(x, 0, z);
                        floor.receiveShadow = true;
                        scene.add(floor);
                    }
                    
                    // Ceiling is the same for all walkable spaces
                    const ceilingGeometry = new THREE.PlaneGeometry(1, 1);
                    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
                    ceiling.rotation.x = Math.PI / 2;
                    ceiling.position.set(x, this.wallHeight, z); // Adjusted ceiling height
                    ceiling.receiveShadow = true;
                    scene.add(ceiling);
                }
            }
        }
        
        return this.playerStart;
    }

    // Create a pit/hole for a floor trap
    createPit(scene, x, z, pitWallMaterial) {
        const pitDepth = 2; // How deep the pit goes
        const pitSize = 0.8; // Slightly smaller than a full tile to create a ledge
        
        // Create the pit geometry
        const pitGroup = new THREE.Group();
        
        // Bottom of the pit
        const pitBottomGeometry = new THREE.PlaneGeometry(pitSize, pitSize);
        const pitBottom = new THREE.Mesh(pitBottomGeometry, pitWallMaterial);
        pitBottom.rotation.x = -Math.PI / 2;
        pitBottom.position.set(0, -pitDepth, 0);
        pitGroup.add(pitBottom);
        
        // Walls of the pit - using thin boxes for the four sides
        // North wall
        const northWallGeometry = new THREE.BoxGeometry(pitSize, pitDepth, 0.05);
        const northWall = new THREE.Mesh(northWallGeometry, pitWallMaterial);
        northWall.position.set(0, -pitDepth/2, -pitSize/2);
        pitGroup.add(northWall);
        
        // South wall
        const southWallGeometry = new THREE.BoxGeometry(pitSize, pitDepth, 0.05);
        const southWall = new THREE.Mesh(southWallGeometry, pitWallMaterial);
        southWall.position.set(0, -pitDepth/2, pitSize/2);
        pitGroup.add(southWall);
        
        // East wall
        const eastWallGeometry = new THREE.BoxGeometry(0.05, pitDepth, pitSize);
        const eastWall = new THREE.Mesh(eastWallGeometry, pitWallMaterial);
        eastWall.position.set(pitSize/2, -pitDepth/2, 0);
        pitGroup.add(eastWall);
        
        // West wall
        const westWallGeometry = new THREE.BoxGeometry(0.05, pitDepth, pitSize);
        const westWall = new THREE.Mesh(westWallGeometry, pitWallMaterial);
        westWall.position.set(-pitSize/2, -pitDepth/2, 0);
        pitGroup.add(westWall);
        
        // Position the entire pit in the world
        pitGroup.position.set(x, 0, z);
        scene.add(pitGroup);
        
        // Add lighting effect inside the pit
        const pitLight = new THREE.PointLight(0xff3300, 0.7, 2);
        pitLight.position.set(x, -pitDepth/2, z);
        scene.add(pitLight);
        
        // Store reference for animation
        if (!this.trapLights) this.trapLights = [];
        this.trapLights.push({
            light: pitLight,
            x: x,
            z: z,
            pulseSpeed: 0.5 + Math.random() * 0.5,
            time: Math.random() * Math.PI * 2
        });
    }
    
    // Update trap effects - should be called in the game loop
    updateTraps(deltaTime) {
        if (!this.trapLights) return;
        
        for (const trap of this.trapLights) {
            trap.time += deltaTime * 0.001 * trap.pulseSpeed;
            
            // Calculate pulsating intensity
            const intensity = 0.8 + Math.sin(trap.time * 2) * 0.2;
            trap.light.intensity = intensity;
            
            // Add subtle position change for the light to create flickering effect
            const flickerAmount = 0.05;
            trap.light.position.x = trap.x + (Math.random() * flickerAmount - flickerAmount/2);
            trap.light.position.z = trap.z + (Math.random() * flickerAmount - flickerAmount/2);
        }
    }

    // Get starting position for the player
    getPlayerStart() {
        return this.playerStart;
    }

    // Check if movement to the specified position is valid (not a wall)
    isValidPosition(x, z) {
        // Make sure we're within bounds
        if (x < 0 || x >= this.map.length || z < 0 || z >= this.map[0].length) {
            return false;
        }
        
        // Check if the position is a walkable tile (0 = floor, 2 = trap)
        return this.map[x][z] === 0 || this.map[x][z] === 2;
    }
}