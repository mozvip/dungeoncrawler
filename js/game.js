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