import * as THREE from 'three';

export class SoundManager {
    constructor(camera) {
        // Audio system
        this.audioListener = null;
        this.stepSound = null;
        this.fireballSound = null;
        this.iceArrowSound = null;
        this.lightningSound = null;
        this.gasCloudSound = null;
        this.backgroundMusic = null;
        
        // Initialize the audio system if we have a camera
        if (camera) {
            this.initAudio(camera);
        }
    }

    initAudio(camera) {
        // Create audio listener and attach to camera
        this.audioListener = new THREE.AudioListener();
        camera.add(this.audioListener);
        
        // Load all sound effects and music
        this.loadSounds();
    }

    loadSounds() {
        const audioLoader = new THREE.AudioLoader();
        
        // Create step sound
        this.stepSound = new THREE.Audio(this.audioListener);
        
        // Load step sound
        audioLoader.load(
            'assets/sounds/footsteps.wav',
            (buffer) => {
                this.stepSound.setBuffer(buffer);
                this.stepSound.setVolume(0.5);
            },
            (xhr) => {
                console.log('Sound loading: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Sound loading error:', error);
            }
        );
        
        // Create fireball sound
        this.fireballSound = new THREE.Audio(this.audioListener);
        
        // Load fireball sound from file
        audioLoader.load(
            'assets/sounds/fire-ball.wav',
            (buffer) => {
                this.fireballSound.setBuffer(buffer);
                this.fireballSound.setVolume(0.6);
            },
            (xhr) => {
                console.log('Fireball sound loading: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Fireball sound loading error:', error);
            }
        );
        
        // Create ice arrow sound
        this.iceArrowSound = new THREE.Audio(this.audioListener);
        
        // Load ice arrow sound from file
        audioLoader.load(
            'assets/sounds/ice-arrow.wav',
            (buffer) => {
                this.iceArrowSound.setBuffer(buffer);
                this.iceArrowSound.setVolume(0.6);
            },
            (xhr) => {
                console.log('Ice arrow sound loading: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Ice arrow sound loading error:', error);
            }
        );
        
        // Create lightning sound
        this.lightningSound = new THREE.Audio(this.audioListener);

        // Load lightning sound from file
        audioLoader.load(
            'assets/sounds/dmjava/zap.wav',
            (buffer) => {
                this.lightningSound.setBuffer(buffer);
                this.lightningSound.setVolume(0.6);
            },
            (xhr) => {
                console.log('Lighting sound loading: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Lighting sound loading error:', error);
            }
        );
        
        // Create gas cloud sound
        this.gasCloudSound = new THREE.Audio(this.audioListener);

        // Load gas cloud sound from file (reusing a sound effect from the game)
        audioLoader.load(
            'assets/sounds/dmjava/poison.wav',
            (buffer) => {
                this.gasCloudSound.setBuffer(buffer);
                this.gasCloudSound.setVolume(0.7);
            },
            (xhr) => {
                console.log('Gas cloud sound loading: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Gas cloud sound loading error:', error);
            }
        );
        
        // Load background music
        this.backgroundMusic = new THREE.Audio(this.audioListener);
        audioLoader.load(
            'assets/sounds/dungeon-loop.wav',
            (buffer) => {
                this.backgroundMusic.setBuffer(buffer);
                this.backgroundMusic.setVolume(0.3); // Lower volume for background music
                this.backgroundMusic.setLoop(true); // Set to loop continuously
                
                // Start playing the background music
                this.playBackgroundMusic();
            },
            (xhr) => {
                console.log('Background music loading: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.error('Background music loading error:', error);
            }
        );
    }
   
    // Play step sound with slight pitch variation for realism
    playStepSound() {
        if (this.stepSound && this.stepSound.buffer) {
            // Add slight pitch variation for more natural sound
            this.stepSound.detune = Math.random() * 200 - 100; // Random detune between -100 and +100 cents
            
            // Play sound if not already playing, otherwise restart it
            if (!this.stepSound.isPlaying) {
                this.stepSound.play();
            } else {
                this.stepSound.stop();
                this.stepSound.play();
            }
        }
    }
    
    // Play fireball sound with slight pitch variation
    playFireballSound() {
        if (this.fireballSound && this.fireballSound.buffer) {
            // Add slight pitch variation
            this.fireballSound.detune = Math.random() * 300 - 150;
            
            if (!this.fireballSound.isPlaying) {
                this.fireballSound.play();
            } else {
                this.fireballSound.stop();
                this.fireballSound.play();
            }
        }
    }
    
    // Play ice arrow sound with slight pitch variation
    playIceArrowSound() {
        if (this.iceArrowSound && this.iceArrowSound.buffer) {
            // Add slight pitch variation
            this.iceArrowSound.detune = Math.random() * 300 - 150;
            
            if (!this.iceArrowSound.isPlaying) {
                this.iceArrowSound.play();
            } else {
                this.iceArrowSound.stop();
                this.iceArrowSound.play();
            }
        }
    }
    
    // Play lightning sound with slight pitch variation
    playLightningSound() {
        if (this.lightningSound && this.lightningSound.buffer) {
            // Add slight pitch variation
            this.lightningSound.detune = Math.random() * 400 - 200;
            
            if (!this.lightningSound.isPlaying) {
                this.lightningSound.play();
            } else {
                this.lightningSound.stop();
                this.lightningSound.play();
            }
        }
    }

    // Play gas cloud sound with slight pitch variation
    playGasCloudSound() {
        if (this.gasCloudSound && this.gasCloudSound.buffer) {
            // Add slight pitch variation
            this.gasCloudSound.detune = Math.random() * 200 - 100; // Random detune between -100 and +100 cents
            
            if (!this.gasCloudSound.isPlaying) {
                this.gasCloudSound.play();
            } else {
                this.gasCloudSound.stop();
                this.gasCloudSound.play();
            }
        } else {
            // Fallback to fireball sound if gas cloud sound isn't loaded
            this.playFireballSound();
        }
    }

    // Play background music
    playBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.buffer) {
            if (!this.backgroundMusic.isPlaying) {
                this.backgroundMusic.play();
                
                // Initialize the music indicator UI when music first plays
                const musicIndicator = document.getElementById('music-indicator');
                if (musicIndicator) {
                    musicIndicator.classList.remove('music-off');
                    musicIndicator.classList.add('music-on');
                    musicIndicator.querySelector('span').textContent = 'Music: ON';
                }
            }
        }
    }

    // Toggle background music on/off
    toggleBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.buffer) {
            const musicIndicator = document.getElementById('music-indicator');
            
            if (this.backgroundMusic.isPlaying) {
                this.backgroundMusic.pause();
                
                // Update UI
                if (musicIndicator) {
                    musicIndicator.classList.remove('music-on');
                    musicIndicator.classList.add('music-off');
                    musicIndicator.querySelector('span').textContent = 'Music: OFF';
                }
            } else {
                this.backgroundMusic.play();
                
                // Update UI
                if (musicIndicator) {
                    musicIndicator.classList.remove('music-off');
                    musicIndicator.classList.add('music-on');
                    musicIndicator.querySelector('span').textContent = 'Music: ON';
                }
            }
        }
    }
}