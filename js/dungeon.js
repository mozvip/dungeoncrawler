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
            return false;
        }
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
        
        // Material for stairs
        const stairMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,  // Brown color for wooden stairs
            roughness: 0.7,
            metalness: 0.1
        });

        // Create walls
        for (let x = 0; x < this.map.length; x++) {
            for (let z = 0; z < this.map[x].length; z++) {
                const cell = this.map[x][z];
                const cellType = cell.type;
                
                if (cellType === "wall") {
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
                    
                    // Process wall face attributes (north, south, east, west)
                    this.processWallFeatures(scene, x, z, cell);
                } else if (cellType === "stairs-up" || cellType === "stairs-down") {
                    // Create stairs
                    this.createStairs(scene, x, z, stairMaterial, cellType === "stairs-up");
                    
                    // Add ceiling above stairs
                    const ceilingGeometry = new THREE.PlaneGeometry(1, 1);
                    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
                    ceiling.rotation.x = Math.PI / 2;
                    ceiling.position.set(x, this.wallHeight, z);
                    ceiling.receiveShadow = true;
                    scene.add(ceiling);
                } else {
                    // For all walkable spaces ("empty" = normal floor, "trap" = trap)
                    
                    if (cellType === "trap") {
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

    // Process special wall features based on directional attributes
    processWallFeatures(scene, x, z, cell) {
        // Check and process features for each direction
        if (cell.north) {
            this.createWallFeature(scene, x, z, 'north', cell.north);
        }
        if (cell.south) {
            this.createWallFeature(scene, x, z, 'south', cell.south);
        }
        if (cell.east) {
            this.createWallFeature(scene, x, z, 'east', cell.east);
        }
        if (cell.west) {
            this.createWallFeature(scene, x, z, 'west', cell.west);
        }
    }
    
    // Create a specific wall feature (door, torch, painting, etc.)
    createWallFeature(scene, x, z, direction, featureType) {
        // Set positioning parameters based on direction
        let posX = x;
        let posZ = z;
        let rotation = 0;
        
        // Adjust position and rotation based on the direction
        switch (direction) {
            case 'north':
                posZ -= 0.5;
                rotation = 0;
                break;
            case 'south':
                posZ += 0.5;
                rotation = Math.PI;
                break;
            case 'east':
                posX += 0.5;
                rotation = Math.PI / 2;
                break;
            case 'west':
                posX -= 0.5;
                rotation = -Math.PI / 2;
                break;
        }
        
        const featureMap = {
            door: createDoor,
            torch: createTorch,
            painting: createPainting,
            // Add more features here
        };

        const featureFn = featureMap[featureType];
        if (featureFn) {
            featureFn(scene, posX, posZ, rotation, this); // Pass dungeon instance for context if needed
        } else {
            console.warn(`Unknown wall feature type: ${featureType}`);
        }
    }

    // Create a pit/hole for a floor trap
    createPit(scene, x, z, pitWallMaterial) {
        // Use the PitMesh class to create the pit
        const pit = PitMesh.create(x, z, pitWallMaterial);
        
        // Add the pit group to the scene
        scene.add(pit.group);
        
        // Add the pit light to the scene
        scene.add(pit.light);
        
        // Store reference for animation
        if (!this.trapLights) this.trapLights = [];
        this.trapLights.push({
            light: pit.light,
            x: pit.lightData.x,
            z: pit.lightData.z,
            pulseSpeed: pit.lightData.pulseSpeed,
            time: pit.lightData.time
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
        
        // Check if the position is a walkable tile (not a wall)
        return this.map[x][z].type === "empty" || 
               this.map[x][z].type === "trap" || 
               this.map[x][z].type === "stairs-up" || 
               this.map[x][z].type === "stairs-down";
    }

    // Create stairs
    createStairs(scene, x, z, material, isUp) {
        // Use the StairsMesh class to create the stairs
        const stairs = StairsMesh.create(x, z, material, isUp);
        
        // Add the stairs group to the scene
        scene.add(stairs);
    }

    // Get wall feature offset based on rotation
    getWallFeatureOffset(rotation, offset) {
        switch (Math.round((rotation / (Math.PI/2)) % 4)) {
            case 0: return { x: 0, z: offset };      // North
            case 2: case -2: return { x: 0, z: -offset }; // South
            case 1: case -3: return { x: -offset, z: 0 }; // East
            case 3: case -1: return { x: offset, z: 0 };  // West
            default: return { x: 0, z: 0 };
        }
    }
}