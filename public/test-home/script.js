// Constants and State
const state = {
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    windowHalfX: window.innerWidth / 2,
    windowHalfY: window.innerHeight / 2,
};

// --- Custom Cursor ---
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

document.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    
    cursorDot.style.transform = `translate3d(${state.mouseX}px, ${state.mouseY}px, 0)`;
    cursorRing.style.transform = `translate3d(${state.mouseX - 20}px, ${state.mouseY - 20}px, 0)`;
});

// Cursor Hover Effects
const hoverElements = document.querySelectorAll('a, button, .product-card, .disc-card');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
});


// --- Three.js Background (Multi-colored Particles) ---
const initBackground = () => {
    const canvas = document.getElementById('three-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const particlesCount = 2500;
    const posArray = new Float32Array(particlesCount * 3);
    const colArray = new Float32Array(particlesCount * 3);
    const originalPos = new Float32Array(particlesCount * 3);
    
    const colors = [
        new THREE.Color(0x0ea5e9), // Cyan
        new THREE.Color(0xf59e0b), // Amber
        new THREE.Color(0xf43f5e), // Rose
        new THREE.Color(0x10b981), // Emerald
        new THREE.Color(0x6366f1)  // Indigo
    ];

    for(let i=0; i < particlesCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const x = (Math.random() - 0.5) * 15;
        const y = (Math.random() - 0.5) * 15;
        const z = (Math.random() - 0.5) * 15;

        posArray[ix] = x;
        posArray[iy] = y;
        posArray[iz] = z;
        originalPos[ix] = x;
        originalPos[iy] = y;
        originalPos[iz] = z;

        const color = colors[Math.floor(Math.random() * colors.length)];
        colArray[ix] = color.r;
        colArray[iy] = color.g;
        colArray[iz] = color.b;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.01,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const animate = () => {
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.0004;
        
        const positions = particlesGeometry.attributes.position.array;
        const mx = (state.mouseX / window.innerWidth) * 2 - 1;
        const my = -(state.mouseY / window.innerHeight) * 2 + 1;
        const mouse3D = new THREE.Vector3(mx * 8, my * 4, 0);

        for (let i = 0; i < particlesCount; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            const px = positions[ix];
            const py = positions[iy];
            const pz = positions[iz];

            const dx = px - mouse3D.x;
            const dy = py - mouse3D.y;
            const dz = pz - mouse3D.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

            if (dist < 3) {
                const force = (3 - dist) / 3;
                positions[ix] += dx * force * 0.15;
                positions[iy] += dy * force * 0.15;
            } else {
                positions[ix] += (originalPos[ix] - positions[ix]) * 0.03;
                positions[iy] += (originalPos[iy] - positions[iy]) * 0.03;
                positions[iz] += (originalPos[iz] - positions[iz]) * 0.03;
            }
        }
        particlesGeometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        state.windowHalfX = window.innerWidth / 2;
        state.windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// --- Three.js Book Showcase ---
const initBookShowcase = () => {
    const canvas = document.getElementById('book-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const lights = [
        { color: 0xf59e0b, pos: [5, 5, 5] },
        { color: 0x6366f1, pos: [-5, -5, 5] },
        { color: 0xf43f5e, pos: [0, 5, -5] }
    ];

    lights.forEach(l => {
        const light = new THREE.PointLight(l.color, 1.2);
        light.position.set(...l.pos);
        scene.add(light);
    });

    const geometry = new THREE.BoxGeometry(1.3, 1.9, 0.3);
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x0a1628 }), 
        new THREE.MeshStandardMaterial({ color: 0x0a1628 }), 
        new THREE.MeshStandardMaterial({ color: 0xffffff }), 
        new THREE.MeshStandardMaterial({ color: 0xffffff }), 
        new THREE.MeshStandardMaterial({ color: 0x6366f1 }), // Indigo cover
        new THREE.MeshStandardMaterial({ color: 0x0a1628 }), 
    ];
    const book = new THREE.Mesh(geometry, materials);
    scene.add(book);

    const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 })
    );
    book.add(wireframe);

    const animate = () => {
        requestAnimationFrame(animate);
        book.rotation.y += 0.01;
        book.rotation.x = Math.sin(Date.now() * 0.001) * 0.25;
        book.position.y = Math.sin(Date.now() * 0.002) * 0.2;
        renderer.render(scene, camera);
    };

    animate();
    
    window.addEventListener('resize', () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    });
};

// --- Reveal on Scroll ---
const revealOnScroll = () => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
};

window.addEventListener('load', () => {
    initBackground();
    initBookShowcase();
    revealOnScroll();
});
