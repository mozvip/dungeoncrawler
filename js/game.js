class Game {
    constructor() {
        // Initialize game properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dungeon = null;
        this.player = null;
        
        // Initialize input handling
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            turnLeft: false,
            turnRight: false,
            fireLightning: false,
            fireGasCloud: false
        };
        
        // Animation timer
        this.lastTime = 0;
        
        // Movement cooldown to prevent too fast movement
        this.movementCooldown = 0;
        this.turnCooldown = 0;
        
        // Sound manager
        this.soundManager = null;
        
        // Active projectiles
        this.projectiles = [];
        
        // Fireball cooldown
        this.fireballCooldown = 0;
        // Lightning cooldown (separate from fireball for balancing)
        this.lightningCooldown = 0;
        // Gas cloud cooldown
        this.gasCloudCooldown = 0;
        
        // Placed torches
        this.torches = [];
    }

    async init() {
        // Create the Three.js scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Set up lighting
        this.setupLights();
        
        // Set up audio
        this.soundManager = new SoundManager(this.camera);
        
        // Create the dungeon and wait for it to load
        this.dungeon = new Dungeon();
        await this.dungeon.createDungeon(this.scene);
        
        // Create the player with starting position from dungeon data
        this.player = new Player(this.dungeon);
        const playerStart = this.dungeon.getPlayerStart();
        
        // Initialize player at the starting position from the dungeon data
        this.player.x = playerStart.x;
        this.player.z = playerStart.z;
        this.player.direction = playerStart.direction;
        
        // Set camera and update position
        this.player.setCamera(this.camera);
        this.player.updateCompass();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Display dungeon information
        this.showDungeonInfo();
        
        // Start the game loop
        this.gameLoop(0);
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x202020);
        this.scene.add(ambientLight);
        
        // Point light that follows the player (like a torch)
        const pointLight = new THREE.PointLight(0xff9900, 1, 5);
        pointLight.position.set(0, 1, 0);
        this.camera.add(pointLight);
        this.scene.add(this.camera);
        
        // Directional light for shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Mouse controls - add click listener for firing
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            this.handleMouseDown(event);
        });
        
        // Prevent context menu from appearing on right-click
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            return false;
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    handleKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = true;
                break;
            case 'a':
                this.keys.left = true;
                break;
            case 'd':
                this.keys.right = true;
                break;
            case 'q':
            case 'arrowleft':
                this.keys.turnLeft = true;
                break;
            case 'e':
            case 'arrowright':
                this.keys.turnRight = true;
                break;
            case ' ':
                // Fire lightning when space bar is pressed
                this.fireLightning();
                break;
            case 'g':
                // Fire gas cloud when G is pressed
                this.fireGasCloud();
                break;
            case 'm':
                // Toggle background music on/off
                this.soundManager.toggleBackgroundMusic();
                break;
            case 't':
                // Place torch on the wall the player is facing
                this.placeTorch();
                break;
        }
    }

    handleKeyUp(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = false;
                break;
            case 'a':
                this.keys.left = false;
                break;
            case 'd':
                this.keys.right = false;
                break;
            case 'q':
            case 'arrowleft':
                this.keys.turnLeft = false;
                break;
            case 'e':
            case 'arrowright':
                this.keys.turnRight = false;
                break;
        }
    }
    
    handleMouseDown(event) {
        // Check if it's the left mouse button (button 0)
        if (event.button === 0) {
            this.fireFireball();
        }
        // Check if it's the right mouse button (button 2)
        else if (event.button === 2) {
            this.fireIceArrow();
        }
        // Check if it's the middle mouse button (button 1)
        else if (event.button === 1) {
            this.fireGasCloud();
            // Prevent default scrolling behavior
            event.preventDefault();
        }
    }
    
    fireFireball() {
        // Check cooldown
        if (this.fireballCooldown > 0) return;
        
        // Set cooldown (800ms between shots)
        this.fireballCooldown = 800;
        
        // Calculate spawn position (slightly in front of the player)
        let spawnX = this.player.x;
        let spawnZ = this.player.z;
        
        // Adjust spawn position based on player direction
        if (this.player.direction === 0) { // North
            spawnZ -= 0.5;
        } else if (this.player.direction === 1) { // East
            spawnX += 0.5;
        } else if (this.player.direction === 2) { // South
            spawnZ += 0.5;
        } else if (this.player.direction === 3) { // West
            spawnX -= 0.5;
        }
        
        // Create fireball using the Fireball class
        const fireball = new Fireball(
            this.scene,
            { x: spawnX, y: this.player.height, z: spawnZ },
            this.player.direction
        );
        
        // Add to active projectiles list
        this.projectiles.push(fireball);
        
        // Play sound effect
        this.soundManager.playFireballSound();
    }

    fireIceArrow() {
        // Check cooldown
        if (this.fireballCooldown > 0) return;
        
        // Set cooldown (800ms between shots)
        this.fireballCooldown = 800;
        
        // Calculate spawn position (slightly in front of the player)
        let spawnX = this.player.x;
        let spawnZ = this.player.z;
        
        // Adjust spawn position based on player direction
        if (this.player.direction === 0) { // North
            spawnZ -= 0.5;
        } else if (this.player.direction === 1) { // East
            spawnX += 0.5;
        } else if (this.player.direction === 2) { // South
            spawnZ += 0.5;
        } else if (this.player.direction === 3) { // West
            spawnX -= 0.5;
        }
        
        // Create ice arrow using the IceArrow class
        const iceArrow = new IceArrow(
            this.scene,
            { x: spawnX, y: this.player.height, z: spawnZ },
            this.player.direction
        );
        
        // Add to active projectiles list
        this.projectiles.push(iceArrow);
        
        // Play ice arrow sound
        this.soundManager.playIceArrowSound();
    }

    fireLightning() {
        // Check cooldown
        if (this.lightningCooldown > 0) return;
        
        // Set cooldown (1000ms between shots - slightly longer than fireball)
        this.lightningCooldown = 1000;
        
        // Calculate spawn position (slightly in front of the player)
        let spawnX = this.player.x;
        let spawnZ = this.player.z;
        
        // Adjust spawn position based on player direction
        if (this.player.direction === 0) { // North
            spawnZ -= 0.5;
        } else if (this.player.direction === 1) { // East
            spawnX += 0.5;
        } else if (this.player.direction === 2) { // South
            spawnZ += 0.5;
        } else if (this.player.direction === 3) { // West
            spawnX -= 0.5;
        }
        
        // Create lightning using the Lightning class
        const lightning = new Lightning(
            this.scene,
            { x: spawnX, y: this.player.height, z: spawnZ },
            this.player.direction
        );
        
        // Add to active projectiles list
        this.projectiles.push(lightning);
        
        // Play sound effect
        this.soundManager.playLightningSound();
    }

    fireGasCloud() {
        // Check cooldown
        if (this.gasCloudCooldown > 0) return;
        
        // Set cooldown (1200ms between shots - longer than other projectiles)
        this.gasCloudCooldown = 1200;
        
        // Calculate spawn position (slightly in front of the player)
        let spawnX = this.player.x;
        let spawnZ = this.player.z;
        
        // Adjust spawn position based on player direction
        if (this.player.direction === 0) { // North
            spawnZ -= 0.5;
        } else if (this.player.direction === 1) { // East
            spawnX += 0.5;
        } else if (this.player.direction === 2) { // South
            spawnZ += 0.5;
        } else if (this.player.direction === 3) { // West
            spawnX -= 0.5;
        }
        
        // Create gas cloud using the GasCloud class
        const gasCloud = new GasCloud(
            this.scene,
            { x: spawnX, y: this.player.height, z: spawnZ },
            this.player.direction
        );
        
        // Add to active projectiles list
        this.projectiles.push(gasCloud);
        
        // Play sound effect
        this.soundManager.playGasCloudSound();
    }

    // Place a torch on the wall the player is facing
    placeTorch() {
        if (!this.player || !this.dungeon) return;
        
        // Get the position in front of the player
        const forwardPos = this.player.getForwardPosition();
        
        // Check if there's a wall in front of the player
        if (!this.dungeon.isValidPosition(forwardPos.x, forwardPos.z)) {
            // There's a wall, so we can place a torch on it
            
            // Check if there's already a torch at this position
            const existingTorchIndex = this.torches.findIndex(torch => 
                torch.wallX === forwardPos.x && torch.wallZ === forwardPos.z && 
                torch.direction === this.player.direction
            );
            
            if (existingTorchIndex >= 0) {
                // There's already a torch here, remove it
                const torch = this.torches[existingTorchIndex];
                this.scene.remove(torch.mesh);
                this.scene.remove(torch.light);
                this.torches.splice(existingTorchIndex, 1);
                return;
            }
            
            // Create torch mesh
            const torchGroup = new THREE.Group();
            
            // Torch stick (cylinder) - keep it vertical
            const stickGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8);
            const stickMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown wood color
                roughness: 0.9
            });
            const stick = new THREE.Mesh(stickGeometry, stickMaterial);
            
            // Torch flame (cone shape) - positioned at the top of the stick
            const flameGeometry = new THREE.ConeGeometry(0.05, 0.1, 8);
            const flameMaterial = new THREE.MeshStandardMaterial({
                color: 0xFF4500, // Orange-red for the burning part
                emissive: 0xFF2000,
                emissiveIntensity: 0.5,
                roughness: 0.7
            });
            // rotate the flame to point upwards
            flameGeometry.rotateX(Math.PI);
            const head = new THREE.Mesh(flameGeometry, flameMaterial);
            head.position.set(0, 0.2, 0); // Position at the top of the stick
            
            // Add to group
            torchGroup.add(stick);
            torchGroup.add(head);
            
            // Position the torch on the wall
            let wallOffset = 0.5; // Half a tile to reach the wall
            let torchX = this.player.x;
            let torchZ = this.player.z;
            let rotation = 0;
            
            // Adjust position and rotation based on direction
            if (this.player.direction === 0) { // North
                torchZ -= wallOffset;
                rotation = 0;
                // Tilt torch slightly forward
                torchGroup.rotation.x = Math.PI * 0.1;
            } else if (this.player.direction === 1) { // East
                torchX += wallOffset;
                rotation = Math.PI / 2;
                // Tilt torch slightly forward
                torchGroup.rotation.z = -Math.PI * 0.1;
            } else if (this.player.direction === 2) { // South
                torchZ += wallOffset;
                rotation = Math.PI;
                // Tilt torch slightly forward
                torchGroup.rotation.x = -Math.PI * 0.1;
            } else { // West
                torchX -= wallOffset;
                rotation = -Math.PI / 2;
                // Tilt torch slightly forward
                torchGroup.rotation.z = Math.PI * 0.1;
            }
            
            // Apply final position and rotation
            torchGroup.position.set(torchX, this.player.height, torchZ);
            torchGroup.rotation.y = rotation;
            
            // Create a point light for the torch
            const torchLight = new THREE.PointLight(0xff6600, 1, 3);
            torchLight.position.copy(torchGroup.position);
            
            // Add height offset to the light to make it appear from the torch head
            torchLight.position.y += 0.2;
            
            // Add to scene
            this.scene.add(torchGroup);
            this.scene.add(torchLight);
            
            // Store the torch information
            this.torches.push({
                mesh: torchGroup,
                light: torchLight,
                wallX: forwardPos.x,
                wallZ: forwardPos.z,
                direction: this.player.direction,
                time: 0
            });
        }
    }

    gameLoop(timestamp) {
        // Calculate time delta
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Handle player input with cooldown
        this.handleInput(deltaTime);
        
        // Update camera rotation animation
        if (this.player) {
            this.player.updateRotation(deltaTime);
            this.player.updateMovement(deltaTime);
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update trap animations
        if (this.dungeon && this.dungeon.updateTraps) {
            this.dungeon.updateTraps(deltaTime);
        }
        
        // Update torch animations
        this.updateTorches(deltaTime);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue the loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    handleInput(deltaTime) {
        // Update movement cooldown
        this.movementCooldown -= deltaTime;
        this.turnCooldown -= deltaTime;
        this.fireballCooldown -= deltaTime;
        this.lightningCooldown -= deltaTime;
        this.gasCloudCooldown -= deltaTime;
        
        // Movement requires a cooldown of 200ms between actions
        if (this.movementCooldown <= 0) {
            if (this.keys.forward && this.player.moveForward()) {
                this.movementCooldown = 200;
                this.soundManager.playStepSound();
            } else if (this.keys.backward && this.player.moveBackward()) {
                this.movementCooldown = 200;
                this.soundManager.playStepSound();
            } else if (this.keys.left && this.player.strafeLeft()) {
                this.movementCooldown = 200;
                this.soundManager.playStepSound();
            } else if (this.keys.right && this.player.strafeRight()) {
                this.movementCooldown = 200;
                this.soundManager.playStepSound();
            }
        }
        
        // Turning requires a cooldown of 150ms between actions
        if (this.turnCooldown <= 0) {
            if (this.keys.turnLeft) {
                this.player.turnLeft();
                this.turnCooldown = 150;
            } else if (this.keys.turnRight) {
                this.player.turnRight();
                this.turnCooldown = 150;
            }
        }
    }
    
    updateProjectiles(deltaTime) {
        // Update all active projectiles and remove inactive ones
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime, this.dungeon);
            
            // Remove inactive projectiles
            if (!this.projectiles[i].isActive) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateTorches(deltaTime) {
        // Update all active torches
        for (let i = 0; i < this.torches.length; i++) {
            const torch = this.torches[i];
            torch.time += deltaTime * 0.01;

            // Animate torch light intensity (flickering effect)
            const flicker = Math.sin(torch.time) * 0.2 + Math.random() * 0.1 + 0.8;
            torch.light.intensity = flicker;
            
            // Small color variation for a more realistic fire effect
            const hue = 0.08 + Math.sin(torch.time * 0.5) * 0.01; // Slight hue variation
            const saturation = 0.9 + Math.sin(torch.time * 0.7) * 0.1; // Saturation variation
            
            // Use Three.js Color to adjust the light color
            torch.light.color.setHSL(hue, saturation, 0.5);
            
            // Animate the torch head (flame) with a subtle rotation
            if (torch.mesh && torch.mesh.children && torch.mesh.children.length > 1) {
                const head = torch.mesh.children[1]; // The flame/head is the second child
                head.rotation.z = Math.sin(torch.time * 2) * 0.1;
            }
        }
    }

    // Display dungeon information on screen
    showDungeonInfo() {
        if (this.dungeon.name) {
            const infoElement = document.getElementById('dungeon-info');
            if (infoElement) {
                infoElement.innerHTML = `<h2>${this.dungeon.name}</h2><p>${this.dungeon.description}</p>`;
                infoElement.style.display = 'block';
                
                // Hide after 5 seconds
                setTimeout(() => {
                    infoElement.style.opacity = '0';
                    setTimeout(() => {
                        infoElement.style.display = 'none';
                        infoElement.style.opacity = '1';
                    }, 1000);
                }, 5000);
            }
        }
    }
}

// Start the game when the page is loaded
window.addEventListener('load', () => {
    const game = new Game();
    // Call init asynchronously
    game.init().catch(error => {
        console.error("Game initialization failed:", error);
    });
});