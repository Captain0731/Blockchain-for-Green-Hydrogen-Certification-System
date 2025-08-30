// Blockchain 3D Visualization
class Blockchain3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.blockMeshes = [];
        this.connectionLines = [];
        this.blocks = [];
        this.selectedBlock = null;
        this.animationId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.container = null;
    }

    // Initialize the 3D blockchain explorer
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }

        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLights();
        this.setupEventListeners();
        this.startAnimationLoop();
        
        // Load initial data
        this.loadBlockchainData();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        
        // Set background based on theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.scene.background = new THREE.Color(isDark ? 0x0f1724 : 0x1a1a1a);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(this.scene.background.getHex(), 10, 50);
    }

    setupCamera() {
        const aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setClearColor(this.scene.background);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        // Check if OrbitControls is available, if not create basic controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.maxPolarAngle = Math.PI;
        } else {
            // Fallback: simple mouse controls
            this.setupBasicControls();
        }
    }

    setupBasicControls() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;

            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;

            // Rotate camera around the scene
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);

            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        // Zoom with mouse wheel
        this.renderer.domElement.addEventListener('wheel', (event) => {
            const zoomSpeed = 0.1;
            const direction = event.deltaY > 0 ? 1 : -1;
            
            this.camera.position.multiplyScalar(1 + direction * zoomSpeed);
            event.preventDefault();
        });
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x9090ff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Accent light
        const accentLight = new THREE.PointLight(0x32CD32, 0.5, 30);
        accentLight.position.set(0, 5, 0);
        this.scene.add(accentLight);
    }

    setupEventListeners() {
        // Mouse click for block selection
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onBlockClick(event);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });

        // Theme change
        window.addEventListener('themeChanged', (event) => {
            this.updateTheme(event.detail.theme);
        });
    }

    onBlockClick(event) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.blockMeshes);

        if (intersects.length > 0) {
            const clickedBlock = intersects[0].object;
            this.selectBlock(clickedBlock);
        }
    }

    selectBlock(blockMesh) {
        // Reset previous selection
        this.blockMeshes.forEach(mesh => {
            mesh.material.emissive.setHex(0x000000);
            mesh.scale.set(1, 1, 1);
        });

        // Highlight selected block
        this.selectedBlock = blockMesh;
        blockMesh.material.emissive.setHex(0x444444);
        blockMesh.scale.set(1.1, 1.1, 1.1);

        // Show block details
        this.showBlockDetails(blockMesh.userData);

        // Animate camera to focus on block
        this.focusOnBlock(blockMesh);
    }

    focusOnBlock(blockMesh) {
        const targetPosition = blockMesh.position.clone();
        targetPosition.z += 5;
        targetPosition.y += 2;

        // Smooth camera movement
        this.animateCameraTo(targetPosition, blockMesh.position);
    }

    animateCameraTo(targetPosition, lookAtPosition) {
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();
        const duration = 1000; // 1 second

        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);
            this.camera.lookAt(lookAtPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        
        animateCamera();
    }

    onWindowResize() {
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }

    updateTheme(theme) {
        const backgroundColor = theme === 'dark' ? 0x0f1724 : 0x1a1a1a;
        this.scene.background = new THREE.Color(backgroundColor);
        this.scene.fog.color = new THREE.Color(backgroundColor);
        this.renderer.setClearColor(backgroundColor);
    }

    startAnimationLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            // Update controls
            if (this.controls && this.controls.update) {
                this.controls.update();
            }
            
            // Animate blocks
            this.animateBlocks();
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    animateBlocks() {
        const time = Date.now() * 0.001;
        
        this.blockMeshes.forEach((mesh, index) => {
            // Gentle floating animation
            mesh.position.y = mesh.userData.originalY + Math.sin(time + index * 0.5) * 0.1;
            
            // Gentle rotation
            mesh.rotation.y += 0.005;
            
            // Pulsing effect for recent blocks
            if (index >= this.blockMeshes.length - 3) {
                const pulse = Math.sin(time * 3) * 0.1 + 1;
                mesh.material.emissive.setRGB(0.1 * pulse, 0.1 * pulse, 0.3 * pulse);
            }
        });
    }

    async loadBlockchainData() {
        try {
            const response = await fetch('/api/blocks');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.blocks = await response.json();
            this.createBlockchainVisualization();
            this.updateStatistics();
            this.updateBlocksTable();
        } catch (error) {
            console.error('Error loading blockchain data:', error);
            this.showError('Failed to load blockchain data');
        }
    }

    createBlockchainVisualization() {
        // Clear existing blocks
        this.clearScene();
        
        const blockGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const spacing = 3;
        
        this.blocks.forEach((block, index) => {
            // Create block material
            const isGenesis = block.index === 0;
            const isRecent = index >= this.blocks.length - 3;
            
            let color = 0x1E90FF; // Default blue
            if (isGenesis) color = 0x32CD32; // Green for genesis
            if (isRecent) color = 0xFF6B6B; // Red for recent blocks
            
            const blockMaterial = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            // Create block mesh
            const blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);
            
            // Position blocks in a chain
            const x = (index - this.blocks.length / 2) * spacing;
            const y = Math.sin(index * 0.3) * 0.5;
            const z = 0;
            
            blockMesh.position.set(x, y, z);
            blockMesh.userData = { ...block, originalY: y };
            blockMesh.castShadow = true;
            blockMesh.receiveShadow = true;
            
            this.scene.add(blockMesh);
            this.blockMeshes.push(blockMesh);
            
            // Create connection line to previous block
            if (index > 0) {
                this.createConnectionLine(
                    this.blockMeshes[index - 1].position,
                    blockMesh.position
                );
            }
            
            // Add block label
            this.createBlockLabel(blockMesh, `Block ${block.index}`);
        });
        
        // Position camera to view the entire chain
        this.centerCameraOnChain();
    }

    createConnectionLine(startPos, endPos) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            startPos.clone(),
            endPos.clone()
        ]);
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x888888,
            transparent: true,
            opacity: 0.6
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        this.connectionLines.push(line);
    }

    createBlockLabel(blockMesh, text) {
        // Create canvas for text texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw text
        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(text, 128, 40);
        
        // Add hash preview
        context.font = '16px monospace';
        context.fillText(blockMesh.userData.hash.substring(0, 8) + '...', 128, 70);
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.position.copy(blockMesh.position);
        sprite.position.y += 2;
        sprite.scale.set(2, 1, 1);
        
        this.scene.add(sprite);
    }

    centerCameraOnChain() {
        if (this.blocks.length === 0) return;
        
        const chainLength = (this.blocks.length - 1) * 3;
        const centerX = chainLength / 2 - (this.blocks.length / 2) * 3;
        
        this.camera.position.set(centerX, 5, 10);
        
        if (this.controls && this.controls.target) {
            this.controls.target.set(centerX, 0, 0);
            this.controls.update();
        } else {
            this.camera.lookAt(centerX, 0, 0);
        }
    }

    showBlockDetails(block) {
        const infoPanel = document.getElementById('block-info');
        if (!infoPanel) return;
        
        const transactionsHtml = block.transactions.map(tx => `
            <div class="transaction-item">
                <small><strong>Type:</strong> ${tx.type}</small>
                ${tx.user_id ? `<small><strong>User:</strong> ${tx.username || tx.user_id}</small>` : ''}
                ${tx.amount ? `<small><strong>Amount:</strong> ${tx.amount}</small>` : ''}
                ${tx.certificate_id ? `<small><strong>Certificate:</strong> ${tx.certificate_id}</small>` : ''}
            </div>
        `).join('');
        
        infoPanel.innerHTML = `
            <h6>Block #${block.index}</h6>
            <div class="block-detail-item">
                <strong>Hash:</strong>
                <code class="d-block text-break">${block.hash}</code>
            </div>
            <div class="block-detail-item">
                <strong>Previous Hash:</strong>
                <code class="d-block text-break">${block.previous_hash}</code>
            </div>
            <div class="block-detail-item">
                <strong>Timestamp:</strong>
                <span>${new Date(block.timestamp).toLocaleString()}</span>
            </div>
            <div class="block-detail-item">
                <strong>Nonce:</strong>
                <span>${block.nonce}</span>
            </div>
            <div class="block-detail-item">
                <strong>Transactions (${block.transactions.length}):</strong>
                <div class="transactions-list mt-2">
                    ${transactionsHtml || '<p class="text-muted">No transactions</p>'}
                </div>
            </div>
        `;
    }

    updateStatistics() {
        const totalBlocks = this.blocks.length;
        const totalTransactions = this.blocks.reduce((sum, block) => sum + block.transactions.length, 0);
        
        // Update DOM elements
        this.updateElement('total-blocks', totalBlocks);
        this.updateElement('total-transactions', totalTransactions);
        this.updateElement('chain-length', totalBlocks);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateBlocksTable() {
        const tbody = document.querySelector('#blocks-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.blocks.forEach(block => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><span class="badge bg-primary">${block.index}</span></td>
                <td><code class="hash-short">${block.hash.substring(0, 16)}...</code></td>
                <td><code class="hash-short">${block.previous_hash.substring(0, 16)}...</code></td>
                <td>${new Date(block.timestamp).toLocaleString()}</td>
                <td><span class="badge bg-info">${block.transactions.length}</span></td>
                <td>${block.nonce}</td>
            `;
            
            row.addEventListener('click', () => {
                const blockMesh = this.blockMeshes.find(mesh => mesh.userData.index === block.index);
                if (blockMesh) {
                    this.selectBlock(blockMesh);
                }
            });
            
            row.style.cursor = 'pointer';
        });
    }

    showError(message) {
        const infoPanel = document.getElementById('block-info');
        if (infoPanel) {
            infoPanel.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>Error</h6>
                    <p>${message}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="blockchain3D.loadBlockchainData()">
                        <i class="fas fa-refresh me-1"></i>Retry
                    </button>
                </div>
            `;
        }
    }

    clearScene() {
        // Remove block meshes
        this.blockMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.blockMeshes = [];
        
        // Remove connection lines
        this.connectionLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.connectionLines = [];
        
        // Remove sprites (labels)
        const spritesToRemove = [];
        this.scene.traverse((object) => {
            if (object instanceof THREE.Sprite) {
                spritesToRemove.push(object);
            }
        });
        
        spritesToRemove.forEach(sprite => {
            this.scene.remove(sprite);
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();
        });
    }

    // Public methods for external control
    resetCamera() {
        this.centerCameraOnChain();
    }

    animateChain() {
        this.blockMeshes.forEach((mesh, index) => {
            setTimeout(() => {
                // Flash effect
                const originalEmissive = mesh.material.emissive.clone();
                mesh.material.emissive.setHex(0x666666);
                
                setTimeout(() => {
                    mesh.material.emissive.copy(originalEmissive);
                }, 500);
            }, index * 200);
        });
    }

    refresh() {
        this.loadBlockchainData();
    }

    dispose() {
        // Cancel animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear scene
        this.clearScene();
        
        // Dispose renderer
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        window.removeEventListener('themeChanged', this.updateTheme);
    }
}

// Global instance
let blockchain3D = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('blockchain-3d');
    if (container) {
        blockchain3D = new Blockchain3D();
        blockchain3D.init('blockchain-3d');
        
        // Make it globally available
        window.blockchain3D = blockchain3D;
    }
});

// Global functions for template compatibility
window.resetCamera = function() {
    if (blockchain3D) {
        blockchain3D.resetCamera();
    }
};

window.animateChain = function() {
    if (blockchain3D) {
        blockchain3D.animateChain();
    }
};

window.refreshBlockchain = function() {
    if (blockchain3D) {
        blockchain3D.refresh();
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (blockchain3D) {
        blockchain3D.dispose();
    }
});

// Add OrbitControls if not available (fallback implementation)
if (typeof THREE !== 'undefined' && !THREE.OrbitControls) {
    // Basic OrbitControls implementation for fallback
    THREE.OrbitControls = function(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3();
        this.enableDamping = false;
        this.dampingFactor = 0.25;
        this.enableZoom = true;
        this.enablePan = true;
        this.maxPolarAngle = Math.PI;
        
        // Basic implementation - the full OrbitControls would be loaded via CDN
        this.update = function() {
            this.camera.lookAt(this.target);
        };
    };
}
