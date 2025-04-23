class Player {
    constructor(dungeon) {
        this.dungeon = dungeon;
        
        // Starting position
        this.x = 1;
        this.z = 1;
        
        // Player height (eye level) - adjusted for new wall height
        this.height = 0.6;
        
        // Starting direction (North = 0, East = 1, South = 2, West = 3)
        this.direction = 0;
        
        // Reference to camera for updating position/rotation
        this.camera = null; 
        
        // Camera rotation animation properties
        this.isRotating = false;
        this.rotationStartAngle = 0;
        this.rotationEndAngle = 0;
        this.rotationProgress = 0;
        this.rotationDuration = 300; // milliseconds

        // Movement animation properties
        this.isMoving = false;
        this.moveStartX = 0;
        this.moveStartZ = 0;
        this.moveEndX = 0;
        this.moveEndZ = 0;
        this.moveProgress = 0;
        this.moveDuration = 300; // milliseconds
    }

    // Link camera to player
    setCamera(camera) {
        this.camera = camera;
        this.updateCameraPosition();
    }

    // Update camera position and rotation based on player's state
    updateCameraPosition() {
        if (!this.camera) return;
        
        // Only update position directly if not in the middle of a movement animation
        if (!this.isMoving) {
            this.camera.position.set(this.x, this.height, this.z);
        } else {
            // Just update the height
            this.camera.position.y = this.height;
        }
        
        // Set rotation based on direction only if not in the middle of a rotation animation
        if (!this.isRotating) {
            if (this.direction === 0) { // North
                this.camera.rotation.y = 0;
            } else if (this.direction === 1) { // East
                this.camera.rotation.y = -Math.PI / 2;
            } else if (this.direction === 2) { // South
                this.camera.rotation.y = Math.PI;
            } else { // West
                this.camera.rotation.y = Math.PI / 2;
            }
        }
    }

    // Move forward in the current direction
    moveForward() {
        // Don't allow moving while a movement or rotation is in progress
        if (this.isMoving || this.isRotating) return false;
        
        const nextX = this.getForwardPosition().x;
        const nextZ = this.getForwardPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            // Start movement animation
            this.startMovementAnimation(this.x, this.z, nextX, nextZ);
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Move backward in the current direction
    moveBackward() {
        // Don't allow moving while a movement or rotation is in progress
        if (this.isMoving || this.isRotating) return false;
        
        const nextX = this.getBackwardPosition().x;
        const nextZ = this.getBackwardPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            // Start movement animation
            this.startMovementAnimation(this.x, this.z, nextX, nextZ);
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Strafe left (perpendicular to current direction)
    strafeLeft() {
        // Don't allow moving while a movement or rotation is in progress
        if (this.isMoving || this.isRotating) return false;
        
        const nextX = this.getLeftPosition().x;
        const nextZ = this.getLeftPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            // Start movement animation
            this.startMovementAnimation(this.x, this.z, nextX, nextZ);
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Strafe right (perpendicular to current direction)
    strafeRight() {
        // Don't allow moving while a movement or rotation is in progress
        if (this.isMoving || this.isRotating) return false;
        
        const nextX = this.getRightPosition().x;
        const nextZ = this.getRightPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            // Start movement animation
            this.startMovementAnimation(this.x, this.z, nextX, nextZ);
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Turn left (90 degrees)
    turnLeft() {
        // Don't allow turning while a rotation is in progress
        if (this.isRotating) return;
        
        // Store the current direction to calculate starting angle
        const oldDirection = this.direction;
        
        // Update direction
        this.direction = (this.direction + 3) % 4;
        
        // Start rotation animation
        this.startRotationAnimation(oldDirection, this.direction);
        
        // Update compass immediately
        this.updateCompass();
    }

    // Turn right (90 degrees)
    turnRight() {
        // Don't allow turning while a rotation is in progress
        if (this.isRotating) return;
        
        // Store the current direction to calculate starting angle
        const oldDirection = this.direction;
        
        // Update direction
        this.direction = (this.direction + 1) % 4;
        
        // Start rotation animation
        this.startRotationAnimation(oldDirection, this.direction);
        
        // Update compass immediately
        this.updateCompass();
    }
    
    // Start a rotation animation from one direction to another
    startRotationAnimation(fromDirection, toDirection) {
        if (!this.camera) return;
        
        // Set up animation parameters
        this.isRotating = true;
        this.rotationProgress = 0;
        
        // Get the starting angle based on the fromDirection
        if (fromDirection === 0) { // North
            this.rotationStartAngle = 0;
        } else if (fromDirection === 1) { // East
            this.rotationStartAngle = -Math.PI / 2;
        } else if (fromDirection === 2) { // South
            this.rotationStartAngle = Math.PI;
        } else { // West
            this.rotationStartAngle = Math.PI / 2;
        }
        
        // Get the target angle based on the toDirection
        if (toDirection === 0) { // North
            this.rotationEndAngle = 0;
        } else if (toDirection === 1) { // East
            this.rotationEndAngle = -Math.PI / 2;
        } else if (toDirection === 2) { // South
            this.rotationEndAngle = Math.PI;
        } else { // West
            this.rotationEndAngle = Math.PI / 2;
        }
        
        // Handle special case when rotating from South to West or vice versa
        // to ensure we take the shortest path
        if (Math.abs(this.rotationEndAngle - this.rotationStartAngle) > Math.PI) {
            if (this.rotationEndAngle > this.rotationStartAngle) {
                this.rotationEndAngle -= Math.PI * 2;
            } else {
                this.rotationEndAngle += Math.PI * 2;
            }
        }
        
        // Initial camera rotation to starting angle
        this.camera.rotation.y = this.rotationStartAngle;
    }
    
    // Update the rotation animation - call this from the game loop
    updateRotation(deltaTime) {
        if (!this.isRotating || !this.camera) return;
        
        // Calculate how much progress to add based on delta time
        const progressIncrement = deltaTime / this.rotationDuration;
        this.rotationProgress += progressIncrement;
        
        // Clamp progress to 1.0
        if (this.rotationProgress >= 1.0) {
            this.rotationProgress = 1.0;
            this.isRotating = false;
            
            // Ensure we end exactly at the target angle
            this.camera.rotation.y = this.rotationEndAngle;
            return;
        }
        
        // Use an easing function for smoother motion
        // This uses a simple ease-in-out function
        const easedProgress = this.easeInOutQuad(this.rotationProgress);
        
        // Interpolate between start and end angles
        const currentAngle = this.rotationStartAngle + 
            (this.rotationEndAngle - this.rotationStartAngle) * easedProgress;
        
        // Set the camera rotation
        this.camera.rotation.y = currentAngle;
    }

    // Start a movement animation from one position to another
    startMovementAnimation(fromX, fromZ, toX, toZ) {
        if (!this.camera) return;
        
        // Set up animation parameters
        this.isMoving = true;
        this.moveProgress = 0;
        this.moveStartX = fromX;
        this.moveStartZ = fromZ;
        this.moveEndX = toX;
        this.moveEndZ = toZ;
        
        // Store the final position for when animation completes
        this.x = toX;
        this.z = toZ;
    }
    
    // Update the movement animation - call this from the game loop
    updateMovement(deltaTime) {
        if (!this.isMoving || !this.camera) return;
        
        // Calculate how much progress to add based on delta time
        const progressIncrement = deltaTime / this.moveDuration;
        this.moveProgress += progressIncrement;
        
        // Clamp progress to 1.0
        if (this.moveProgress >= 1.0) {
            this.moveProgress = 1.0;
            this.isMoving = false;
            
            // Ensure we end exactly at the target position
            this.camera.position.x = this.moveEndX;
            this.camera.position.z = this.moveEndZ;
            return;
        }
        
        // Use an easing function for smoother motion
        const easedProgress = this.easeInOutQuad(this.moveProgress);
        
        // Interpolate between start and end positions
        const currentX = this.moveStartX + (this.moveEndX - this.moveStartX) * easedProgress;
        const currentZ = this.moveStartZ + (this.moveEndZ - this.moveStartZ) * easedProgress;
        
        // Set the camera position
        this.camera.position.x = currentX;
        this.camera.position.z = currentZ;
    }
    
    // Ease-in-out quadratic interpolation for smoother animation
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Calculate position in front of player
    getForwardPosition() {
        if (this.direction === 0) return { x: this.x, z: this.z - 1 }; // North
        if (this.direction === 1) return { x: this.x + 1, z: this.z }; // East
        if (this.direction === 2) return { x: this.x, z: this.z + 1 }; // South
        if (this.direction === 3) return { x: this.x - 1, z: this.z }; // West
    }

    // Calculate position behind player
    getBackwardPosition() {
        if (this.direction === 0) return { x: this.x, z: this.z + 1 }; // North
        if (this.direction === 1) return { x: this.x - 1, z: this.z }; // East
        if (this.direction === 2) return { x: this.x, z: this.z - 1 }; // South
        if (this.direction === 3) return { x: this.x + 1, z: this.z }; // West
    }

    // Calculate position to the left of player
    getLeftPosition() {
        if (this.direction === 0) return { x: this.x - 1, z: this.z }; // North
        if (this.direction === 1) return { x: this.x, z: this.z - 1 }; // East
        if (this.direction === 2) return { x: this.x + 1, z: this.z }; // South
        if (this.direction === 3) return { x: this.x, z: this.z + 1 }; // West
    }

    // Calculate position to the right of player
    getRightPosition() {
        if (this.direction === 0) return { x: this.x + 1, z: this.z }; // North
        if (this.direction === 1) return { x: this.x, z: this.z + 1 }; // East
        if (this.direction === 2) return { x: this.x - 1, z: this.z }; // South
        if (this.direction === 3) return { x: this.x, z: this.z - 1 }; // West
    }

    // Update the compass display to match the player's direction
    updateCompass() {
        const directions = ['north', 'east', 'south', 'west'];
        const compassElements = document.querySelectorAll('#compass .direction');

        // Reset all directions
        compassElements.forEach(element => {
            element.classList.remove('active');
        });
        
        // Activate the current direction
        const currentDirection = directions[this.direction];
        const activeElement = document.getElementById(currentDirection);
        if (activeElement) {
            activeElement.classList.add('active');
        }
    }
}