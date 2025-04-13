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
    }

    // Link camera to player
    setCamera(camera) {
        this.camera = camera;
        this.updateCameraPosition();
    }

    // Update camera position and rotation based on player's state
    updateCameraPosition() {
        if (!this.camera) return;
        
        this.camera.position.set(this.x, this.height, this.z);
        
        // Set rotation based on direction
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

    // Move forward in the current direction
    moveForward() {
        const nextX = this.getForwardPosition().x;
        const nextZ = this.getForwardPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            this.x = nextX;
            this.z = nextZ;
            this.updateCameraPosition();
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Move backward in the current direction
    moveBackward() {
        const nextX = this.getBackwardPosition().x;
        const nextZ = this.getBackwardPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            this.x = nextX;
            this.z = nextZ;
            this.updateCameraPosition();
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Strafe left (perpendicular to current direction)
    strafeLeft() {
        const nextX = this.getLeftPosition().x;
        const nextZ = this.getLeftPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            this.x = nextX;
            this.z = nextZ;
            this.updateCameraPosition();
            this.updateCompass();
            return true;
        }
        return false;
    }

    // Strafe right (perpendicular to current direction)
    strafeRight() {
        const nextX = this.getRightPosition().x;
        const nextZ = this.getRightPosition().z;
        
        if (this.dungeon.isValidPosition(nextX, nextZ)) {
            this.x = nextX;
            this.z = nextZ;
            this.updateCameraPosition();
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

    // Update the compass display
    updateCompass() {
        const directions = ['north', 'east', 'south', 'west'];
        
        // Reset all directions
        directions.forEach(dir => {
            document.getElementById(dir).style.color = '#fff';
        });
        
        // Highlight current direction
        document.getElementById(directions[this.direction]).style.color = '#ff0';
    }
}