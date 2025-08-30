// Dashboard 3D Visualizations
class Dashboard3D {
    constructor() {
        this.scenes = {};
        this.renderers = {};
        this.cameras = {};
        this.animationIds = {};
    }

    // Initialize credits 3D visualization
    initCredits3D(containerId, creditAmount) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        
        // Create coin stack
        const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
        const coinMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            shininess: 100 
        });
        
        const coins = [];
        const maxCoins = Math.min(Math.floor(creditAmount / 10), 10); // Max 10 coins for performance
        
        for (let i = 0; i < maxCoins; i++) {
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            coin.position.y = i * 0.06;
            coin.rotation.y = i * 0.1;
            scene.add(coin);
            coins.push(coin);
        }
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(2, 2, 2);
        scene.add(pointLight);
        
        camera.position.set(1, 1, 2);
        camera.lookAt(0, (maxCoins * 0.06) / 2, 0);
        
        // Animation loop
        const animate = () => {
            this.animationIds[containerId] = requestAnimationFrame(animate);
            
            coins.forEach((coin, index) => {
                coin.rotation.y += 0.01;
                coin.position.y = (index * 0.06) + Math.sin(Date.now() * 0.002 + index) * 0.01;
            });
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Store references
        this.scenes[containerId] = scene;
        this.renderers[containerId] = renderer;
        this.cameras[containerId] = camera;
    }

    // Initialize certificates 3D visualization
    initCertificates3D(containerId, certificateCount) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        
        // Create certificate cards
        const cardGeometry = new THREE.PlaneGeometry(0.6, 0.4);
        const cardMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.8 
        });
        
        const cards = [];
        const maxCards = Math.min(certificateCount, 5); // Max 5 cards
        
        for (let i = 0; i < maxCards; i++) {
            const card = new THREE.Mesh(cardGeometry, cardMaterial);
            card.position.x = (i - maxCards / 2) * 0.3;
            card.position.z = i * -0.1;
            card.rotation.y = (i - maxCards / 2) * 0.1;
            scene.add(card);
            cards.push(card);
        }
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        camera.position.set(0, 0, 2);
        
        // Animation loop
        const animate = () => {
            this.animationIds[containerId] = requestAnimationFrame(animate);
            
            cards.forEach((card, index) => {
                card.rotation.y += 0.005;
                card.position.y = Math.sin(Date.now() * 0.001 + index) * 0.05;
            });
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Store references
        this.scenes[containerId] = scene;
        this.renderers[containerId] = renderer;
        this.cameras[containerId] = camera;
    }

    // Initialize blocks 3D visualization
    initBlocks3D(containerId, blockCount) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        
        // Create blockchain cubes
        const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        
        const cubes = [];
        const maxCubes = Math.min(blockCount, 6); // Max 6 cubes
        
        for (let i = 0; i < maxCubes; i++) {
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position.x = (i - maxCubes / 2) * 0.4;
            cube.position.y = Math.sin(i * 0.5) * 0.2;
            scene.add(cube);
            cubes.push(cube);
            
            // Add connecting lines
            if (i > 0) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3((i - 1 - maxCubes / 2) * 0.4, Math.sin((i - 1) * 0.5) * 0.2, 0),
                    new THREE.Vector3((i - maxCubes / 2) * 0.4, Math.sin(i * 0.5) * 0.2, 0)
                ]);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
            }
        }
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        camera.position.set(0, 0, 3);
        
        // Animation loop
        const animate = () => {
            this.animationIds[containerId] = requestAnimationFrame(animate);
            
            cubes.forEach((cube, index) => {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                cube.material.emissive.setHSL((Date.now() * 0.001 + index) % 1, 0.3, 0.1);
            });
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        // Store references
        this.scenes[containerId] = scene;
        this.renderers[containerId] = renderer;
        this.cameras[containerId] = camera;
    }

    // Cleanup function
    dispose(containerId) {
        if (this.animationIds[containerId]) {
            cancelAnimationFrame(this.animationIds[containerId]);
            delete this.animationIds[containerId];
        }
        
        if (this.renderers[containerId]) {
            const container = document.getElementById(containerId);
            if (container && this.renderers[containerId].domElement) {
                container.removeChild(this.renderers[containerId].domElement);
            }
            this.renderers[containerId].dispose();
            delete this.renderers[containerId];
        }
        
        if (this.scenes[containerId]) {
            // Dispose of geometries and materials
            this.scenes[containerId].traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            });
            delete this.scenes[containerId];
        }
        
        if (this.cameras[containerId]) {
            delete this.cameras[containerId];
        }
    }

    // Handle window resize
    handleResize(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.cameras[containerId] || !this.renderers[containerId]) return;
        
        this.cameras[containerId].aspect = container.offsetWidth / container.offsetHeight;
        this.cameras[containerId].updateProjectionMatrix();
        this.renderers[containerId].setSize(container.offsetWidth, container.offsetHeight);
    }
}

// Global instance
window.dashboard3D = new Dashboard3D();

// Global functions for easy access
window.initCredits3D = function(containerId, creditAmount) {
    window.dashboard3D.initCredits3D(containerId, creditAmount);
};

window.initCertificates3D = function(containerId, certificateCount) {
    window.dashboard3D.initCertificates3D(containerId, certificateCount);
};

window.initBlocks3D = function(containerId, blockCount) {
    window.dashboard3D.initBlocks3D(containerId, blockCount);
};

// Handle theme changes
window.addEventListener('themeChanged', function(event) {
    // Update materials based on theme
    const colors = window.utils?.getThemeColors() || {};
    // Implementation for theme-based color updates would go here
});

// Handle window resize
window.addEventListener('resize', function() {
    ['credits-3d', 'certificates-3d', 'blocks-3d', 'balance-3d'].forEach(id => {
        window.dashboard3D.handleResize(id);
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    ['credits-3d', 'certificates-3d', 'blocks-3d', 'balance-3d'].forEach(id => {
        window.dashboard3D.dispose(id);
    });
});
