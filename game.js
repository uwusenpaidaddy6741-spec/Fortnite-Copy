import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/*
===========================================================
BATTLE ROYALE - VERSION 1
===========================================================

Features:

- 3D island
- Third-person camera
- WASD movement
- Sprint
- Jump
- Shooting
- Reloading
- Health
- Shield
- Bots
- Loot
- Storm
- Victory / defeat
===========================================================
*/


// ========================================================
// BASIC SETUP
// ========================================================

const container = document.getElementById("gameCanvasContainer");
const canvas = document.getElementById("gameCanvas");

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x78bde8);

scene.fog = new THREE.Fog(
    0x78bde8,
    80,
    260
);


const camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    500
);


const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


// ========================================================
// LIGHTING
// ========================================================

const hemisphereLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x446644,
        2
    );

scene.add(hemisphereLight);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        3
    );

sun.position.set(
    80,
    120,
    60
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -150;
sun.shadow.camera.right = 150;
sun.shadow.camera.top = 150;
sun.shadow.camera.bottom = -150;

scene.add(sun);


// ========================================================
// GAME VARIABLES
// ========================================================

let gameStarted = false;
let gameOver = false;

let lastTime = performance.now();

const keys = {};

let mouseDown = false;

let yaw = 0;
let pitch = -0.28;


// ========================================================
// WORLD
// ========================================================

const WORLD_SIZE = 180;

const groundGeometry =
    new THREE.PlaneGeometry(
        WORLD_SIZE,
        WORLD_SIZE,
        40,
        40
    );

const groundMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x3f913f,
        roughness: 1
    });

const ground =
    new THREE.Mesh(
        groundGeometry,
        groundMaterial
    );

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);


// ========================================================
// WATER
// ========================================================

const waterGeometry =
    new THREE.PlaneGeometry(
        400,
        400
    );

const waterMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x2988bd,
        roughness: 0.3,
        metalness: 0.1
    });

const water =
    new THREE.Mesh(
        waterGeometry,
        waterMaterial
    );

water.rotation.x = -Math.PI / 2;

water.position.y = -0.8;

scene.add(water);


// ========================================================
// MOUNTAINS
// ========================================================

function createMountain(x, z, scale) {

    const geometry =
        new THREE.ConeGeometry(
            12,
            30,
            8
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x68705c
        });

    const mountain =
        new THREE.Mesh(
            geometry,
            material
        );

    mountain.position.set(
        x,
        14,
        z
    );

    mountain.scale.set(
        scale,
        scale,
        scale
    );

    mountain.castShadow = true;
    mountain.receiveShadow = true;

    scene.add(mountain);
}


createMountain(-65, -65, 2);
createMountain(65, -65, 1.7);
createMountain(-65, 60, 1.8);
createMountain(65, 60, 2.2);


// ========================================================
// TREES
// ========================================================

function createTree(x, z) {

    const tree = new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.7,
                0.9,
                5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x6b3f20
            })
        );

    trunk.position.y = 2.5;

    trunk.castShadow = true;

    tree.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                3.5,
                8,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x196b2a
            })
        );

    leaves.position.y = 7;

    leaves.castShadow = true;

    tree.add(leaves);

    tree.position.set(x, 0, z);

    scene.add(tree);
}


for (let i = 0; i < 70; i++) {

    const x =
        THREE.MathUtils.randFloat(
            -80,
            80
        );

    const z =
        THREE.MathUtils.randFloat(
            -80,
            80
        );

    // Keep center area relatively clear.

    if (
        Math.abs(x) < 20 &&
        Math.abs(z) < 20
    ) {
        continue;
    }

    createTree(x, z);
}


// ========================================================
// BUILDINGS
// ========================================================

function createBuilding(x, z, width, depth) {

    const building =
        new THREE.Group();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                7,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color:
                    new THREE.Color().setHSL(
                        Math.random(),
                        0.2,
                        0.35
                    )
            })
        );

    body.position.y = 3.5;

    body.castShadow = true;
    body.receiveShadow = true;

    building.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width + 0.6,
                0.6,
                depth + 0.6
            ),
            new THREE.MeshStandardMaterial({
                color: 0x303030
            })
        );

    roof.position.y = 7.3;

    roof.castShadow = true;

    building.add(roof);

    building.position.set(x, 0, z);

    scene.add(building);
}


createBuilding(-35, -20, 12, 10);
createBuilding(-20, -30, 10, 14);

createBuilding(35, 20, 14, 10);
createBuilding(20, 30, 10, 14);

createBuilding(-40, 35, 14, 12);
createBuilding(42, -35, 12, 14);


// ========================================================
// PLAYER
// ========================================================

const player = {

    position:
        new THREE.Vector3(
            0,
            0,
            0
        ),

    velocity:
        new THREE.Vector3(),

    yaw: 0,

    health: 100,
    maxHealth: 100,

    shield: 50,
    maxShield: 50,

    speed: 8,

    sprintSpeed: 13,

    jumpPower: 9,

    grounded: true,

    radius: 1.1,

    ammo: 30,

    maxAmmo: 30,

    reserveAmmo: 120,

    damage: 25,

    fireRate: 9,

    lastShot: 0,

    reloading: false,

    reloadTime: 1.6,

    reloadStart: 0,

    kills: 0
};


// ========================================================
// PLAYER MODEL
// ========================================================

const playerGroup =
    new THREE.Group();

scene.add(playerGroup);


const playerBody =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            1.7,
            2,
            1
        ),
        new THREE.MeshStandardMaterial({
            color: 0x247cff
        })
    );

playerBody.position.y = 2;

playerBody.castShadow = true;

playerGroup.add(playerBody);


const playerHead =
    new THREE.Mesh(
        new THREE.SphereGeometry(
            0.55,
            16,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0xf0b78c
        })
    );

playerHead.position.y = 3.35;

playerHead.castShadow = true;

playerGroup.add(playerHead);


const gun =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            0.3,
            0.3,
            1.8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

gun.position.set(
    0.8,
    2.4,
    -1
);

gun.rotation.x = 0;

gun.castShadow = true;

playerGroup.add(gun);


// ========================================================
// BOTS
// ========================================================

const bots = [];

const BOT_COUNT = 10;


function createBot(index) {

    const bot = {

        alive: true,

        health: 100,

        maxHealth: 100,

        shield: 0,

        speed:
            THREE.MathUtils.randFloat(
                2.5,
                4.5
            ),

        shootTimer:
            THREE.MathUtils.randFloat(
                1,
                3
            ),

        directionTimer: 0,

        direction:
            new THREE.Vector3(),

        position:
            new THREE.Vector3(
                THREE.MathUtils.randFloat(
                    -70,
                    70
                ),
                0,
                THREE.MathUtils.randFloat(
                    -70,
                    70
                )
            )
    };


    // Don't spawn too close to player.

    if (
        bot.position.distanceTo(
            player.position
        ) < 30
    ) {
        bot.position.set(
            50,
            0,
            50
        );
    }


    const group =
        new THREE.Group();

    bot.group = group;


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.7,
                2,
                1
            ),
            new THREE.MeshStandardMaterial({
                color: 0xe33b3b
            })
        );

    body.position.y = 2;

    body.castShadow = true;

    group.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.55,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xd28d69
            })
        );

    head.position.y = 3.35;

    head.castShadow = true;

    group.add(head);


    group.position.copy(
        bot.position
    );

    scene.add(group);

    bots.push(bot);
}


for (
    let i = 0;
    i < BOT_COUNT;
    i++
) {
    createBot(i);
}


// ========================================================
// LOOT
// ========================================================

const loot = [];


function createAmmoLoot(x, z) {

    const group =
        new THREE.Group();

    const box =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1,
                0.7,
                1
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffcc22
            })
        );

    box.position.y = 0.45;

    box.castShadow = true;

    group.add(box);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    loot.push({
        group,
        type: "ammo"
    });
}


function createShieldLoot(x, z) {

    const group =
        new THREE.Group();

    const orb =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.65,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0x248cff,
                emissive: 0x073a80
            })
        );

    orb.position.y = 0.8;

    group.add(orb);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    loot.push({
        group,
        type: "shield"
    });
}


for (let i = 0; i < 12; i++) {

    const x =
        THREE.MathUtils.randFloat(
            -70,
            70
        );

    const z =
        THREE.MathUtils.randFloat(
            -70,
            70
        );

    createAmmoLoot(x, z);
}


for (let i = 0; i < 6; i++) {

    const x =
        THREE.MathUtils.randFloat(
            -70,
            70
        );

    const z =
        THREE.MathUtils.randFloat(
            -70,
            70
        );

    createShieldLoot(x, z);
}


// ========================================================
// STORM
// ========================================================

const storm = {

    center:
        new THREE.Vector3(0, 0, 0),

    radius: 80,

    minimumRadius: 12,

    shrinkSpeed: 0.65,

    damagePerSecond: 8
};


const stormRing =
    new THREE.Mesh(
        new THREE.RingGeometry(
            79,
            80,
            96
        ),
        new THREE.MeshBasicMaterial({
            color: 0xb000ff,
            side: THREE.DoubleSide
        })
    );

stormRing.rotation.x = -Math.PI / 2;

stormRing.position.y = 0.15;

scene.add(stormRing);


function updateStorm(delta) {

    if (
        storm.radius >
        storm.minimumRadius
    ) {

        storm.radius -=
            storm.shrinkSpeed *
            delta;

    }


    stormRing.scale.set(
        storm.radius / 80,
        storm.radius / 80,
        1
    );


    const playerDistance =
        new THREE.Vector2(
            player.position.x,
            player.position.z
        ).distanceTo(
            new THREE.Vector2(
                storm.center.x,
                storm.center.z
            )
        );


    if (
        playerDistance >
        storm.radius
    ) {

        damagePlayer(
            storm.damagePerSecond * delta
        );

        showMessage(
            "YOU ARE IN THE STORM!"
        );
    }
}


// ========================================================
// MOVEMENT
// ========================================================

function updatePlayer(delta) {

    if (!gameStarted || gameOver) {
        return;
    }

    // Camera-relative forward direction.
    // At yaw 0, W moves toward -Z.
    const forward = new THREE.Vector3(
        Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );

    // Camera-relative right direction.
    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        Math.sin(yaw)
    );

    const movement = new THREE.Vector3();

    if (keys["w"]) {
        movement.add(forward);
    }

    if (keys["s"]) {
        movement.sub(forward);
    }

    if (keys["d"]) {
        movement.add(right);
    }

    if (keys["a"]) {
        movement.sub(right);
    }

    // Move player.
    if (movement.lengthSq() > 0) {

        movement.normalize();

        const currentSpeed =
            keys["shift"]
                ? player.sprintSpeed
                : player.speed;

        player.position.addScaledVector(
            movement,
            currentSpeed * delta
        );

        // Make the player face the direction they are moving.
        player.yaw = Math.atan2(
            movement.x,
            -movement.z
        );
    }

    // Jump.
    if (
        keys[" "] &&
        player.grounded
    ) {

        player.velocity.y =
            player.jumpPower;

        player.grounded = false;
    }

    // Gravity.
    player.velocity.y -=
        25 * delta;

    player.position.y +=
        player.velocity.y * delta;

    // Ground collision.
    if (player.position.y <= 0) {

        player.position.y = 0;

        player.velocity.y = 0;

        player.grounded = true;
    }

    // World boundary.
    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -86,
            86
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -86,
            86
        );

    // Update player model.
    playerGroup.position.copy(
        player.position
    );

    playerGroup.rotation.y =
        player.yaw;
}


// ========================================================
// CAMERA
// ========================================================

function updateCamera(delta) {

    if (!gameStarted) {
        return;
    }

    const cameraDistance = 9;
    const cameraHeight = 4;

    // Put the camera BEHIND the player.
    const offset = new THREE.Vector3(
        -Math.sin(yaw) * cameraDistance,
        cameraHeight,
        Math.cos(yaw) * cameraDistance
    );

    // Camera follows the player.
    const target = player.position.clone();

    target.y += 2.3;

    const desiredPosition =
        target.clone().add(offset);

    // Smooth camera movement.
    const smoothness =
        1 - Math.pow(0.001, delta);

    camera.position.lerp(
        desiredPosition,
        smoothness
    );

    // Use pitch so the mouse can look up and down.
    const lookTarget =
        target.clone();

    lookTarget.y +=
        Math.tan(pitch) * 7;

    camera.lookAt(
        lookTarget
    );
}


// ========================================================
// SHOOTING
// ========================================================

function shoot() {

    if (
        !gameStarted ||
        gameOver ||
        player.reloading
    ) {
        return;
    }


    const now = performance.now();

    const shotDelay =
        1000 /
        player.fireRate;


    if (
        now -
        player.lastShot <
        shotDelay
    ) {
        return;
    }


    if (player.ammo <= 0) {

        reload();

        return;
    }


    player.lastShot = now;

    player.ammo--;


    const origin =
        camera.position.clone();


    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );


    const raycaster =
        new THREE.Raycaster(
            origin,
            direction,
            0,
            150
        );


    // Check bots.

    let closestBot = null;

    let closestDistance = Infinity;


    for (const bot of bots) {

        if (!bot.alive) {
            continue;
        }


        const botPosition =
            bot.group.position.clone();

        botPosition.y += 2;


        const toBot =
            botPosition.clone().sub(
                origin
            );


        const distance =
            toBot.length();


        toBot.normalize();


        const dot =
            direction.dot(
                toBot
            );


        if (
            dot > 0.985 &&
            distance < closestDistance
        ) {

            // Basic line-of-sight check.

            const testRay =
                new THREE.Raycaster(
                    origin,
                    toBot,
                    0,
                    distance
                );


            const hits =
                testRay.intersectObject(
                    bot.group,
                    true
                );


            if (hits.length > 0) {

                closestBot = bot;

                closestDistance =
                    distance;
            }
        }
    }


    if (closestBot) {

        damageBot(
            closestBot,
            player.damage
        );
    }


    updateAmmoUI();
}


// ========================================================
// BOT DAMAGE
// ========================================================

function damageBot(bot, damage) {

    if (!bot.alive) {
        return;
    }


    let remainingDamage = damage;


    if (bot.shield > 0) {

        const shieldDamage =
            Math.min(
                bot.shield,
                remainingDamage
            );

        bot.shield -= shieldDamage;

        remainingDamage -=
            shieldDamage;
    }


    bot.health -=
        remainingDamage;


    if (bot.health <= 0) {

        eliminateBot(bot);
    }
}


function eliminateBot(bot) {

    if (!bot.alive) {
        return;
    }


    bot.alive = false;

    scene.remove(
        bot.group
    );


    player.kills++;


    createAmmoLoot(
        bot.position.x,
        bot.position.z
    );


    updatePlayersUI();

    showMessage(
        "ELIMINATION!"
    );


    if (
        bots.filter(
            b => b.alive
        ).length === 0
    ) {

        endGame(true);
    }
}


// ========================================================
// BOT AI
// ========================================================

function updateBots(delta) {

    if (!gameStarted || gameOver) {
        return;
    }


    for (const bot of bots) {

        if (!bot.alive) {
            continue;
        }


        const distance =
            bot.position.distanceTo(
                player.position
            );


        bot.directionTimer -= delta;


        if (
            bot.directionTimer <= 0
        ) {

            bot.directionTimer =
                THREE.MathUtils.randFloat(
                    1,
                    3
                );


            const towardPlayer =
                player.position.clone()
                    .sub(bot.position);


            if (distance < 35) {

                towardPlayer.y = 0;

                if (
                    towardPlayer.lengthSq() > 0
                ) {
                    towardPlayer.normalize();
                }

                // Sometimes strafe.

                const strafe =
                    Math.random() > 0.5
                        ? 0.7
                        : -0.7;

                bot.direction.set(
                    towardPlayer.z * strafe +
                        towardPlayer.x,

                    0,

                    -towardPlayer.x * strafe +
                        towardPlayer.z
                );

            } else {

                bot.direction.set(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                );

            }

            bot.direction.normalize();
        }


        bot.position.addScaledVector(
            bot.direction,
            bot.speed * delta
        );


        // Stay on island.

        bot.position.x =
            THREE.MathUtils.clamp(
                bot.position.x,
                -84,
                84
            );

        bot.position.z =
            THREE.MathUtils.clamp(
                bot.position.z,
                -84,
                84
            );


        bot.group.position.copy(
            bot.position
        );


        // Face player.

        if (distance < 60) {

            const angle =
                Math.atan2(
                    player.position.x -
                        bot.position.x,

                    player.position.z -
                        bot.position.z
                );

            bot.group.rotation.y =
                angle;
        }


        // Shoot.

        bot.shootTimer -= delta;


        if (
            distance < 45 &&
            bot.shootTimer <= 0
        ) {

            bot.shootTimer =
                THREE.MathUtils.randFloat(
                    0.7,
                    1.7
                );


            // Accuracy isn't perfect.

            const accuracy =
                Math.random();


            if (
                accuracy > 0.35
            ) {

                damagePlayer(
                    THREE.MathUtils.randFloat(
                        5,
                        10
                    )
                );
            }
        }
    }
}


// ========================================================
// PLAYER DAMAGE
// ========================================================

function damagePlayer(damage) {

    if (gameOver) {
        return;
    }


    let remainingDamage = damage;


    if (player.shield > 0) {

        const shieldDamage =
            Math.min(
                player.shield,
                remainingDamage
            );

        player.shield -= shieldDamage;

        remainingDamage -=
            shieldDamage;
    }


    player.health -=
        remainingDamage;


    player.health =
        Math.max(
            0,
            player.health
        );


    updateHealthUI();


    if (player.health <= 0) {

        endGame(false);
    }
}


// ========================================================
// RELOADING
// ========================================================

function reload() {

    if (
        player.reloading ||
        player.ammo >= player.maxAmmo ||
        player.reserveAmmo <= 0
    ) {
        return;
    }


    player.reloading = true;

    player.reloadStart =
        performance.now();


    showMessage("RELOADING...");
}


function updateReload() {

    if (!player.reloading) {
        return;
    }


    const elapsed =
        performance.now() -
        player.reloadStart;


    if (
        elapsed >=
        player.reloadTime * 1000
    ) {

        const needed =
            player.maxAmmo -
            player.ammo;


        const amount =
            Math.min(
                needed,
                player.reserveAmmo
            );


        player.ammo += amount;

        player.reserveAmmo -= amount;

        player.reloading = false;

        updateAmmoUI();
    }
}


// ========================================================
// LOOT
// ========================================================

function updateLoot() {

    for (
        let i = loot.length - 1;
        i >= 0;
        i--
    ) {

        const item = loot[i];


        item.group.rotation.y +=
            0.02;


        const distance =
            player.position.distanceTo(
                item.group.position
            );


        if (distance < 3) {

            if (
                item.type === "ammo"
            ) {

                player.reserveAmmo += 30;

                showMessage(
                    "+30 AMMO"
                );
            }


            if (
                item.type === "shield"
            ) {

                player.shield =
                    Math.min(
                        player.maxShield,
                        player.shield + 25
                    );

                showMessage(
                    "+25 SHIELD"
                );
            }


            scene.remove(
                item.group
            );

            loot.splice(i, 1);

            updateAmmoUI();

            updateHealthUI();
        }
    }
}


// ========================================================
// UI
// ========================================================

function updateHealthUI() {

    const healthPercent =
        player.health /
        player.maxHealth *
        100;


    const shieldPercent =
        player.shield /
        player.maxShield *
        100;


   document.getElementById("healthBar").style.width =
    healthPercent + "%";

document.getElementById("shieldBar").style.width =
    shieldPercent + "%";

document.getElementById("healthText").textContent =
    Math.ceil(player.health) + " / " + player.maxHealth;

document.getElementById("shieldText").textContent =
    Math.ceil(player.shield) + " / " + player.maxShield;
}


function updateAmmoUI() {

    document.getElementById(
        "ammoCurrent"
    ).textContent =
        player.ammo;


    document.getElementById(
        "ammoReserve"
    ).textContent =
        player.reserveAmmo;
}


function updatePlayersUI() {

    const alive =
        bots.filter(
            b => b.alive
        ).length;


    document.getElementById(
        "playersLeft"
    ).textContent =
        alive + 1;


    document.getElementById(
        "kills"
    ).textContent =
        player.kills;
}


function showMessage(text) {

    const element =
        document.getElementById(
            "message"
        );


    element.textContent = text;

    element.style.opacity = "1";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(() => {

            element.style.opacity =
                "0";

        }, 1200);
}


// ========================================================
// END GAME
// ========================================================

function endGame(victory) {

    if (gameOver) {
        return;
    }


    gameOver = true;

    document.exitPointerLock?.();


    const screen =
        document.getElementById(
            "endScreen"
        );


    const title =
        document.getElementById(
            "endTitle"
        );


    const stats =
        document.getElementById(
            "endStats"
        );


    if (victory) {

        title.textContent =
            "VICTORY ROYALE!";

        stats.textContent =
    "You eliminated all opponents with " +
    player.kills +
    " eliminations.";

    } else {

        title.textContent =
            "ELIMINATED";

        stats.textContent =
    "You finished with " +
    player.kills +
    " eliminations.";
    }


    screen.style.display =
        "flex";
}


// ========================================================
// START / RESTART
// ========================================================

function startGame() {

    document.getElementById(
        "startScreen"
    ).style.display =
        "none";


    gameStarted = true;

    gameOver = false;


    canvas.requestPointerLock?.();
}


document.getElementById(
    "startButton"
).addEventListener(
    "click",
    startGame
);


document.getElementById(
    "restartButton"
).addEventListener(
    "click",
    () => {
        location.reload();
    }
);


// ========================================================
// KEYBOARD
// ========================================================

window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        keys[key] = true;


        if (
            key === "r"
        ) {
            reload();
        }


        if (
            key === " " ||
            key.startsWith("arrow")
        ) {
            event.preventDefault();
        }
    }
);


window.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();

        keys[key] = false;
    }
);


// ========================================================
// MOUSE
// ========================================================

canvas.addEventListener(
    "mousedown",
    event => {

        if (!gameStarted || gameOver) {
            return;
        }


        if (
            document.pointerLockElement !==
            canvas
        ) {

            canvas.requestPointerLock?.();

            return;
        }


        if (
            event.button === 0
        ) {

            mouseDown = true;

            shoot();
        }
    }
);


window.addEventListener(
    "mouseup",
    event => {

        if (
            event.button === 0
        ) {

            mouseDown = false;
        }
    }
);


document.addEventListener(
    "mousemove",
    event => {

        if (
            document.pointerLockElement !==
            canvas
        ) {
            return;
        }


        if (!gameStarted || gameOver) {
            return;
        }


        yaw -=
            event.movementX *
            0.0025;


        pitch -=
            event.movementY *
            0.002;


        pitch =
            THREE.MathUtils.clamp(
                pitch,
                -1.0,
                0.35
            );
    }
);


// ========================================================
// CONTINUOUS FIRE
// ========================================================

function updateShooting() {

    if (mouseDown) {
        shoot();
    }
}


// ========================================================
// RESIZE
// ========================================================

window.addEventListener(
    "resize",
    () => {

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;


        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );
    }
);


// ========================================================
// GAME LOOP
// ========================================================

function animate(now) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            (now - lastTime) / 1000,
            0.05
        );


    lastTime = now;


    if (gameStarted && !gameOver) {

        updatePlayer(delta);

        updateCamera(delta);

        updateBots(delta);

        updateStorm(delta);

        updateLoot();

        updateReload();

        updateShooting();

        updatePlayersUI();
    }


    renderer.render(
        scene,
        camera
    );
}


// ========================================================
// INITIAL CAMERA
// ========================================================

camera.position.set(
    0,
    4,
    9
);

camera.lookAt(
    0,
    2.3,
    0
);


updateHealthUI();
updateAmmoUI();
updatePlayersUI();

animate(
    performance.now()
);
