/**
 * Dungeon Level Editor
 * This file contains all the functionality for the level editor
 */

class LevelEditor {
    constructor() {
        // Current level data
        this.levelData = {
            name: "",
            description: "",
            map: [],
            playerStart: {
                x: 1,
                z: 1,
                direction: 0
            }
        };

        // Editor state
        this.currentTool = "wall";
        this.currentWallFeature = "none";
        this.currentWallDirection = "north";
        this.gridSize = 10;
        this.selectedCell = null;
        this.availableLevels = [];
        
        // Initialize the editor
        this.init();
    }

    /**
     * Initialize the level editor
     */
    init() {
        // Create a new blank level
        this.createNewLevel();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load available levels
        this.loadAvailableLevels();
    }

    /**
     * Set up event listeners for the editor controls
     */
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', () => {
                this.selectTool(tool.dataset.tool);
            });
        });

        // Wall feature selection
        document.querySelectorAll('.wall-feature').forEach(feature => {
            feature.addEventListener('click', () => {
                this.selectWallFeature(feature.dataset.feature);
            });
        });

        // Wall direction selection
        document.querySelectorAll('.wall-direction').forEach(direction => {
            direction.addEventListener('click', () => {
                this.selectWallDirection(direction.dataset.direction);
            });
        });

        // New level button
        document.getElementById('newLevel').addEventListener('click', () => {
            this.createNewLevel();
        });

        // Save level button
        document.getElementById('saveLevel').addEventListener('click', () => {
            this.openSaveModal();
        });

        // Level selection dropdown
        document.getElementById('levelSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadLevel(e.target.value);
            }
        });

        // Map size dropdown
        document.getElementById('mapSize').addEventListener('change', (e) => {
            this.resizeMap(parseInt(e.target.value));
        });

        // Level properties inputs
        document.getElementById('levelName').addEventListener('input', (e) => {
            this.levelData.name = e.target.value;
        });

        document.getElementById('levelDescription').addEventListener('input', (e) => {
            this.levelData.description = e.target.value;
        });

        // Player start position inputs
        document.getElementById('playerX').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 0 && value < this.gridSize) {
                this.levelData.playerStart.x = value;
                this.updateGrid();
            }
        });

        document.getElementById('playerZ').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 0 && value < this.gridSize) {
                this.levelData.playerStart.z = value;
                this.updateGrid();
            }
        });

        document.getElementById('playerDirection').addEventListener('change', (e) => {
            this.levelData.playerStart.direction = parseInt(e.target.value);
            this.updateGrid();
        });

        // Save modal buttons
        document.getElementById('cancelSave').addEventListener('click', () => {
            this.closeSaveModal();
        });

        document.getElementById('confirmSave').addEventListener('click', () => {
            this.saveLevel();
        });
    }

    /**
     * Select a tool for editing the level
     * @param {string} toolName - The name of the tool to select
     */
    selectTool(toolName) {
        // Update the current tool
        this.currentTool = toolName;
        
        // Update the UI
        document.querySelectorAll('.tool').forEach(tool => {
            if (tool.dataset.tool === toolName) {
                tool.classList.add('selected');
            } else {
                tool.classList.remove('selected');
            }
        });
        
        // Show/hide wall feature options based on the selected tool
        const wallFeaturesPanel = document.getElementById('wallFeaturesPanel');
        if (toolName === 'wallFeature') {
            wallFeaturesPanel.style.display = 'block';
        } else {
            wallFeaturesPanel.style.display = 'none';
        }
        
        // Update status
        this.updateStatus(`Selected tool: ${toolName}`);
    }

    /**
     * Select a wall feature
     * @param {string} featureName - The name of the wall feature
     */
    selectWallFeature(featureName) {
        // Update the current wall feature
        this.currentWallFeature = featureName;
        
        // Update the UI
        document.querySelectorAll('.wall-feature').forEach(feature => {
            if (feature.dataset.feature === featureName) {
                feature.classList.add('selected');
            } else {
                feature.classList.remove('selected');
            }
        });
        
        // Update status
        this.updateStatus(`Selected wall feature: ${featureName}`);
    }

    /**
     * Select a wall direction
     * @param {string} directionName - The direction (north, south, east, west)
     */
    selectWallDirection(directionName) {
        // Update the current wall direction
        this.currentWallDirection = directionName;
        
        // Update the UI
        document.querySelectorAll('.wall-direction').forEach(direction => {
            if (direction.dataset.direction === directionName) {
                direction.classList.add('selected');
            } else {
                direction.classList.remove('selected');
            }
        });
        
        // Update status
        this.updateStatus(`Selected wall direction: ${directionName}`);
    }

    /**
     * Create a new blank level
     */
    createNewLevel() {
        // Reset level data
        this.levelData = {
            name: "New Level",
            description: "A new dungeon level",
            map: [],
            playerStart: {
                x: 1,
                z: 1,
                direction: 0
            }
        };
        
        // Get the grid size from the select element
        this.gridSize = parseInt(document.getElementById('mapSize').value);
        
        // Create a blank map
        this.createBlankMap();
        
        // Update the UI
        this.updateUI();
        
        // Update status
        this.updateStatus("Created new level");
    }

    /**
     * Create a blank map with walls around the edges
     */
    createBlankMap() {
        this.levelData.map = [];
        
        for (let x = 0; x < this.gridSize; x++) {
            this.levelData.map[x] = [];
            for (let z = 0; z < this.gridSize; z++) {
                // Set walls around the edges
                if (x === 0 || x === this.gridSize - 1 || z === 0 || z === this.gridSize - 1) {
                    this.levelData.map[x][z] = { type: "wall", north: null, south: null, east: null, west: null };
                } else {
                    this.levelData.map[x][z] = { type: "empty", north: null, south: null, east: null, west: null };
                }
            }
        }
    }

    /**
     * Resize the map to a new size
     * @param {number} newSize - The new size for the map
     */
    resizeMap(newSize) {
        if (newSize === this.gridSize) return;
        
        // Save the current map
        const oldMap = this.levelData.map;
        const oldSize = this.gridSize;
        
        // Update the grid size
        this.gridSize = newSize;
        
        // Create a new blank map
        this.createBlankMap();
        
        // Copy the old data to the new map
        for (let x = 0; x < oldSize && x < newSize; x++) {
            for (let z = 0; z < oldSize && z < newSize; z++) {
                if (oldMap[x] && oldMap[x][z]) {
                    this.levelData.map[x][z] = oldMap[x][z];
                }
            }
        }
        
        // Adjust player start position if outside the new map
        if (this.levelData.playerStart.x >= newSize) {
            this.levelData.playerStart.x = newSize - 2;
        }
        
        if (this.levelData.playerStart.z >= newSize) {
            this.levelData.playerStart.z = newSize - 2;
        }
        
        // Update the UI
        this.updateUI();
        
        // Update status
        this.updateStatus(`Resized map to ${newSize}x${newSize}`);
    }

    /**
     * Update the UI to reflect the current level data
     */
    updateUI() {
        // Update level inputs
        document.getElementById('levelName').value = this.levelData.name;
        document.getElementById('levelDescription').value = this.levelData.description;
        document.getElementById('mapSize').value = this.gridSize.toString();
        
        // Update player start position
        document.getElementById('playerX').value = this.levelData.playerStart.x;
        document.getElementById('playerZ').value = this.levelData.playerStart.z;
        document.getElementById('playerDirection').value = this.levelData.playerStart.direction;
        
        // Update grid
        this.updateGrid();
    }

    /**
     * Update the grid display
     */
    updateGrid() {
        const grid = document.getElementById('mapGrid');
        
        // Clear the grid
        grid.innerHTML = '';
        
        // Set the grid size
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 40px)`;
        
        // Create the cells
        for (let z = 0; z < this.gridSize; z++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                // Add data attributes for coordinates
                cell.dataset.x = x;
                cell.dataset.z = z;
                
                // Add coordinates label
                const coords = document.createElement('span');
                coords.className = 'coordinates';
                coords.textContent = `${x},${z}`;
                cell.appendChild(coords);
                
                // Get cell type
                const cellData = this.levelData.map[x][z];
                if (cellData) {
                    cell.classList.add(cellData.type);
                    
                    // Add wall feature indicators if this is a wall
                    if (cellData.type === 'wall') {
                        this.addWallFeatureIndicators(cell, cellData);
                    }
                }
                
                // Mark player start position
                if (this.levelData.playerStart.x === x && this.levelData.playerStart.z === z) {
                    cell.classList.add('playerStart');
                    
                    // Add direction indication
                    const directionClasses = ['north', 'east', 'south', 'west'];
                    cell.classList.add(directionClasses[this.levelData.playerStart.direction]);
                }
                
                // Add click events
                cell.addEventListener('click', () => {
                    this.handleCellClick(x, z);
                });
                
                grid.appendChild(cell);
            }
        }
    }

    /**
     * Add wall feature indicators to a cell
     * @param {HTMLElement} cell - The grid cell element
     * @param {Object} cellData - The cell data
     */
    addWallFeatureIndicators(cell, cellData) {
        const directions = ['north', 'east', 'south', 'west'];
        
        directions.forEach(direction => {
            if (cellData[direction]) {
                const indicator = document.createElement('div');
                indicator.className = `wall-feature-indicator ${direction} ${cellData[direction]}`;
                indicator.title = `${direction}: ${cellData[direction]}`;
                cell.appendChild(indicator);
            }
        });
    }

    /**
     * Handle a cell click in the grid
     * @param {number} x - The x coordinate of the cell
     * @param {number} z - The z coordinate of the cell
     */
    handleCellClick(x, z) {
        // Update the selected cell
        this.selectedCell = { x, z };
        
        // Apply the current tool
        if (this.currentTool === 'player') {
            // Set player start position
            this.levelData.playerStart.x = x;
            this.levelData.playerStart.z = z;
            
            // Update player start inputs
            document.getElementById('playerX').value = x;
            document.getElementById('playerZ').value = z;
        } else if (this.currentTool === 'wallFeature') {
            // Only apply wall features to walls
            if (this.levelData.map[x][z].type === 'wall') {
                if (this.currentWallFeature === 'none') {
                    // Remove the feature
                    this.levelData.map[x][z][this.currentWallDirection] = null;
                } else {
                    // Add the feature
                    this.levelData.map[x][z][this.currentWallDirection] = this.currentWallFeature;
                }
            } else {
                this.updateStatus("Wall features can only be added to walls");
            }
        } else if (this.currentTool === 'stairs-up' || this.currentTool === 'stairs-down') {
            // Add stairs (up or down)
            this.levelData.map[x][z].type = this.currentTool;
            
            // Clear any wall features as this is no longer a wall
            this.levelData.map[x][z].north = null;
            this.levelData.map[x][z].south = null;
            this.levelData.map[x][z].east = null;
            this.levelData.map[x][z].west = null;
            
            // Add stair direction property
            this.levelData.map[x][z].stairDirection = this.currentTool === 'stairs-up' ? 'up' : 'down';
            
            this.updateStatus(`Added ${this.currentTool === 'stairs-up' ? 'upward' : 'downward'} stairs at (${x}, ${z})`);
        } else {
            // Update the cell type for other tools (wall, empty, trap)
            this.levelData.map[x][z].type = this.currentTool;
            
            // If changing to a non-wall, clear any wall features
            if (this.currentTool !== 'wall') {
                this.levelData.map[x][z].north = null;
                this.levelData.map[x][z].south = null;
                this.levelData.map[x][z].east = null;
                this.levelData.map[x][z].west = null;
            }
        }
        
        // Update the grid
        this.updateGrid();
        
        // Update the cell info display
        this.updateCellInfo(x, z);
    }

    /**
     * Update the cell info display
     * @param {number} x - The x coordinate of the cell
     * @param {number} z - The z coordinate of the cell
     */
    updateCellInfo(x, z) {
        const cell = this.levelData.map[x][z];
        let info = `(${x}, ${z}) - ${cell.type}`;
        
        // Add wall feature information if this is a wall
        if (cell.type === 'wall') {
            const features = [];
            if (cell.north) features.push(`North: ${cell.north}`);
            if (cell.east) features.push(`East: ${cell.east}`);
            if (cell.south) features.push(`South: ${cell.south}`);
            if (cell.west) features.push(`West: ${cell.west}`);
            
            if (features.length > 0) {
                info += ` (${features.join(', ')})`;
            }
        }
        // Add stair direction information if this is stairs
        else if (cell.type === 'stairs-up' || cell.type === 'stairs-down') {
            info += ` (${cell.type === 'stairs-up' ? 'to previous level' : 'to next level'})`;
        }
        
        document.getElementById('cellInfo').textContent = info;
    }

    /**
     * Update the status message
     * @param {string} message - The status message to display
     */
    updateStatus(message) {
        document.getElementById('statusMessage').textContent = message;
    }

    /**
     * Load the list of available levels
     */
    async loadAvailableLevels() {
        try {
            // List of available level files in assets/dungeons/
            this.availableLevels = ['level1.json', 'level2.json', 'level3.json'];
            
            // Update the level select dropdown
            const levelSelect = document.getElementById('levelSelect');
            levelSelect.innerHTML = '<option value="">Select a level...</option>';
            
            this.availableLevels.forEach(level => {
                const option = document.createElement('option');
                option.value = level.replace('.json', '');
                option.textContent = level;
                levelSelect.appendChild(option);
            });
            
            this.updateStatus("Loaded available levels");
        } catch (error) {
            console.error('Error loading levels:', error);
            this.updateStatus("Error loading levels list");
        }
    }

    /**
     * Load a level from the server
     * @param {string} levelName - The name of the level to load
     */
    async loadLevel(levelName) {
        try {
            const response = await fetch(`/assets/dungeons/${levelName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${levelName}`);
            }
            
            this.levelData = await response.json();
            
            // Determine the grid size from the loaded map
            this.gridSize = this.levelData.map.length;
            
            // Update the UI
            this.updateUI();
            
            this.updateStatus(`Loaded level: ${levelName}`);
        } catch (error) {
            console.error('Error loading level:', error);
            this.updateStatus(`Error loading level: ${levelName}`);
        }
    }

    /**
     * Open the save modal
     */
    openSaveModal() {
        const modal = document.getElementById('saveModal');
        modal.classList.add('active');
        
        const filenameInput = document.getElementById('saveFilename');
        filenameInput.value = this.levelData.name.toLowerCase().replace(/\s+/g, '_');
        filenameInput.focus();
    }

    /**
     * Close the save modal
     */
    closeSaveModal() {
        const modal = document.getElementById('saveModal');
        modal.classList.remove('active');
    }

    /**
     * Save the current level
     */
    async saveLevel() {
        const filename = document.getElementById('saveFilename').value;
        if (!filename) {
            this.updateStatus("Please enter a filename");
            return;
        }
        
        // In a real app, we would send an API request to save the file
        // For this demo, we'll create a downloadable file
        
        // Convert the level data to a JSON string
        const jsonData = JSON.stringify(this.levelData, null, 4);
        
        // Create a download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Close the modal
        this.closeSaveModal();
        
        this.updateStatus(`Saved level as ${filename}.json`);
    }
}

// Initialize the level editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new LevelEditor();
});