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
        
        // Create different features based on type
        switch (featureType) {
            case 'door':
                this.createDoor(scene, posX, posZ, rotation);
                break;
            case 'torch':
                this.createTorch(scene, posX, posZ, rotation);
                break;
            case 'painting':
                this.createPainting(scene, posX, posZ, rotation);
                break;
            // Add more feature types as needed
            default:
                console.warn(`Unknown wall feature type: ${featureType}`);
        }
    }
    
    // Example feature creation methods
    createDoor(scene, x, z, rotation) {
        // Placeholder for door creation
        const doorGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        
        door.position.set(x, this.wallHeight/2, z);
        door.rotation.y = rotation;
        scene.add(door);
    }
    
    createTorch(scene, x, z, rotation) {
        // Placeholder for torch creation
        const torchGroup = new THREE.Group();
        
        // Torch handle
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2822 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = this.wallHeight/2;
        
        // Torch flame
        const flameGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff7700 });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = this.wallHeight/2 + 0.2;
        
        // Add to group
        torchGroup.add(handle);
        torchGroup.add(flame);
        
        // Add torch light
        const torchLight = new THREE.PointLight(0xff5500, 1, 3);
        torchLight.position.y = this.wallHeight/2 + 0.2;
        torchGroup.add(torchLight);
        
        // Position and rotate the torch group
        torchGroup.position.set(x, 0, z);
        torchGroup.rotation.y = rotation;
        
        // Adjust position to be flush with wall
        const offset = 0.51; // Slightly more than half the wall thickness
        switch (Math.round((rotation / (Math.PI/2)) % 4)) {
            case 0: // North
                torchGroup.position.z += offset;
                break;
            case 2: case -2: // South
                torchGroup.position.z -= offset;
                break;
            case 1: case -3: // East
                torchGroup.position.x -= offset;
                break;
            case 3: case -1: // West
                torchGroup.position.x += offset;
                break;
        }
        
        scene.add(torchGroup);
        
        // Store torch for animation
        if (!this.torches) this.torches = [];
        this.torches.push({
            flame,
            light: torchLight,
            time: Math.random() * Math.PI * 2
        });
    }
    
    createPainting(scene, x, z, rotation) {
        // Placeholder for painting creation
        const frameGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.05);
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        
        frame.position.set(x, this.wallHeight/2, z);
        frame.rotation.y = rotation;
        
        // Adjust position to be flush with wall
        const offset = 0.525; // Slightly more than half the wall thickness
        switch (Math.round((rotation / (Math.PI/2)) % 4)) {
            case 0: // North
                frame.position.z += offset;
                break;
            case 2: case -2: // South
                frame.position.z -= offset;
                break;
            case 1: case -3: // East
                frame.position.x -= offset;
                break;
            case 3: case -1: // West
                frame.position.x += offset;
                break;
        }
        
        scene.add(frame);
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
        
        // Check if the position is a walkable tile (not a wall)
        return this.map[x][z].type === "empty" || this.map[x][z].type === "trap";
    }
}