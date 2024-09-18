

/********************************s
 * RESPONSIVE   
 */


// Should the resize functions run once as part of update()
let is_resize = false; 

// Is the game restarted? 
let is_game_restart = true; 

// Is the game on the viewport enough
let is_game_on_screen = true; 

// Is this the first time for update()
let is_first_update = false; 

// Has the start button been clicked
let has_game_started = false; 

// Holds width and height of last screen sizes
let screen_last_size = [window.innerWidth, window.innerHeight]; 

// Compensate on y axis to change perspective on 3d platforms
let platform_landscape_ball_compensate = -9;




/********************************s
 * GAME
 */


let game;
let gameOptions = {

    // ball gravity
    ballGravity: 1200,

    // bounce velocity when the ball hits a platform
    bounceVelocity: 800,

    // ball start x position, 0 = left; 1 = right
    ballStartXPosition: 0.2,

    // amount of platforms to be created and recycled
    platformAmount: 10,

    // platform speed, in pixels per second
    platformSpeed: 650,

    // min and max distance range between platforms
    platformDistanceRange: [250, 450],

    // min and max platform height, , 0 = top of the screen; 1 = bottom of the screen
    platformHeightRange: [0.5, 0.8],

    // min and max platform length
    platformLengthRange: [40, 160],

    // local storage name where to save best scores
    localStorageName: "bestballscore3d",

    // game scale between 2D and 3D
    gameScale: 0.1 
}


class playGame extends Phaser.Scene {

    constructor(){

        super({
            key: 'PlayGame'
        });

    }
    preload(){
        
        // Load SVG for simple shapes
        this.load.svg("ball", "ball.svg", {width: 50, height: 50});
        this.load.svg("ground", "ground.svg", {width: 64, height: 20});
        
    }
    create() {

        // method to create the 3D world
        this.create3DWorld();

        // method to add the 2D ball
        this.add2DBall();

        // method to add the 3D ball
        this.add3DBall();

        // method to add platforms
        this.addPlatforms();

        // method to add score
        this.addScore();

        // method to add game listeners
        this.addListeners();

    }

    // method to create the 3D world
    create3DWorld() {


        //* threejs real implementation
        // variables to store canvas width and height
        var width = this.sys.game.canvas.width;
        var height = this.sys.game.canvas.height;

        this.threeScene = new THREE.Scene();

        // create the renderer
        this.renderer3D = new THREE.WebGLRenderer({
            canvas: this.sys.game.canvas,
            context: this.sys.game.context,
            antialias: true
        });
        //  We don't want three.js to wipe our gl context!
        this.renderer3D.autoClear = false;

        // enable shadows
        this.renderer3D.shadowMap.enabled = true;
        this.renderer3D.shadowMap.type = THREE.PCFSoftShadowMap;

        // enable gamma correction, learn more at https://en.wikipedia.org/wiki/Gamma_correction
        this.renderer3D.gammaInput = true;
        this.renderer3D.gammaOutput = true;

        // add a soft, white ambient light
        const ambient_light = new THREE.AmbientLight(0xffffff, 1.5);
        this.threeScene.add(ambient_light);
 
        // add a bright, white spotlight, learn more at https://threejs.org/docs/#api/en/lights/SpotLight
        const spot_light = new THREE.SpotLight(
            0xffffff,  // color
            1, //intensity 
            0, // distance
            0.4, // angle
            0.05, //penumbra, 
            0.1 //decay
        );
        spot_light.position.set(0, 250, 80);

        // enable the spotlight to cast shadow
        spot_light.castShadow = true;
        spot_light.shadow.mapSize.width = width;
        spot_light.shadow.mapSize.height = height;
        spot_light.shadow.camera.near = 1;
        spot_light.shadow.camera.far = 1000;

        this.threeScene.add(spot_light);

        // add a camera
        this.camera3D  = new THREE.PerspectiveCamera(25, null, 0.1, 1000);
        this.camera3D.position.set(50 , 145, 80);
        this.camera3D.lookAt(20, 25, -10);

        // create an Extern Phaser game object
        const view = this.add.extern();
      
        // custom renderer
        // next line is needed to avoid TypeScript errors
        // @ts-expect-error
        view.render = () => {

            // this is needed
            this.renderer3D.state.reset();
            
            //console.log("running ");

            // Is this a game restart after loosing
            if(is_game_restart) {

                console.log("is_game_restart " + is_game_restart);
                // Trigger resize positing
                is_resize = true;

                // Finish game restart variable
                is_game_restart = false; 

            }

            this.renderer3D.render(this.threeScene, this.camera3D);
            //this.renderer3D.state.reset();
        
        };   

        return this.threeScene;


    }


    // method to create the 2D ball
    add2DBall(){

        // this is just the good old Arcade physics body creation
        this.ball = this.physics.add.sprite(this.sys.game.canvas.width * gameOptions.ballStartXPosition, 0, "ball");

        // set ball gravity
        this.ball.body.gravity.y = gameOptions.ballGravity;

        // we are only checking for collisions on the bottom of the ball
        this.ball.body.checkCollision.down = true;
        this.ball.body.checkCollision.up = false;
        this.ball.body.checkCollision.left = false;
        this.ball.body.checkCollision.right = false;

        // modify a bit the collision shape to make the game more kind with players
        this.ball.setSize(30, 50, true);
    }

    // method to create the 3D ball
    add3DBall(){

        // Create sphere
        const geometry = new THREE.SphereBufferGeometry(
            this.ball.displayWidth / 2 * gameOptions.gameScale, // radius
            64, //widthSegments
            64, //heightSegments
        );

        // Create material
        let material = new THREE.MeshStandardMaterial({color: parseInt("0x98ffff", 16)}); 

        // Mesh
        let obj = new THREE.Mesh(geometry, material);
        obj.position.set(0, 0, 0);
        this.ball3D = obj;

        // Make sure ball renders on top
        this.ball3D.renderOrder = 200;
        
        // set the ball to cast a shadow
        this.ball3D.castShadow = true;
        
        // Add ball to scene
        this.threeScene.add(this.ball3D);


    }

    // method to add platforms
    addPlatforms(){

        // creation of a physics group containing all platforms
        this.platformGroup = this.physics.add.group();

        // let's proceed with the creation
        for(let i = 0; i < gameOptions.platformAmount; i++){

            this.add2DPlatform();
        }
    }

    // method to set a random platform X position
    setPlatformX(){
        return this.getRightmostPlatform() + Phaser.Math.Between(gameOptions.platformDistanceRange[0], gameOptions.platformDistanceRange[1]);
    }

    // method to set a random platform Y position
    setPlatformY(){
        var screen_height = this.sys.game.canvas.height; 
        return Phaser.Math.Between(screen_height * gameOptions.platformHeightRange[1], screen_height * gameOptions.platformHeightRange[0]);
    }

    add2DPlatform(){

        // st platform X position
        let platformX = (this.getRightmostPlatform() == 0) ? this.ball.x : this.setPlatformX();

        // create 2D platform
        let platform = this.platformGroup.create(platformX, this.setPlatformY(), "ground");

        // set platform registration point
        platform.setOrigin(0.5, 1);

        // platform won't move no matter how many hits it gets
        platform.setImmovable(true);

        // set a random platform width
        platform.displayWidth = Phaser.Math.Between(gameOptions.platformLengthRange[0], gameOptions.platformLengthRange[1]);

        // add 3D platform as a 2D platform property
        platform.platform3D = this.add3DPlatform(platform);

    }

    // method to add a 3D platform, the argument is the 2D platform
    add3DPlatform(platform2D) { 

        // create shape
        let geometry = new THREE.BoxBufferGeometry(1, 20, 20);
        let material = new THREE.MeshStandardMaterial(); 
        let platform3D = new THREE.Mesh(geometry, material);
        platform3D.position.set(0, 0, 0);

        // platform will receive shadows
        platform3D.receiveShadow = true;

        // scale the 3D platform to make it match 2D platform size
        platform3D.scale.x = platform2D.displayWidth * gameOptions.gameScale;

        this.threeScene.add(platform3D);

        return platform3D;

    }

    // method to add the score, just a dynamic text
    addScore(){
        this.score = 0;
        this.topScore = localStorage.getItem(gameOptions.localStorageName) == null ? 0 : localStorage.getItem(gameOptions.localStorageName);
        this.scoreText = this.add.text(10, 10, "--");
        this.scoreText.setStyle({
            fontSize: '20px',
            fontFamily: 'chumley_ixiregular',
            color: '#211b16',
            lineHeight: '27px',
            align: 'left',
        });

    }

    // method to update the score
    updateScore(inc){
        this.score += inc;
        this.scoreText.text = "Puntos: " + this.score + "\nRecord: " + this.topScore;
    }

    // listeners to make platforms move and stop
    addListeners(){

        this.input.on("pointerdown", function(){
            if(has_game_started)
            this.platformGroup.setVelocityX(-gameOptions.platformSpeed);
        }, this);
        this.input.on("pointerup", function(){
            this.platformGroup.setVelocityX(0);
        }, this);

    }

    // method to get the rightmost platform
    getRightmostPlatform(){
        let rightmostPlatform = 0;
        this.platformGroup.getChildren().forEach(function(platform){
            rightmostPlatform = Math.max(rightmostPlatform, platform.x);
        });
        return rightmostPlatform;
    }

    // Used to run the update function just once
    manual_update() {
        this.update();
        //this.scene.pause();   
    }

    // method to be executed at each frame
    update(time, delta){

        var platform_new_y;
console.log("updated is_resize " + is_resize);
        
        // Only use collide if not resizing
        if(!is_resize) {
            
            // collision management ball Vs platforms
            this.physics.world.collide(this.platformGroup, this.ball, function(){
                // bounce back the ball
                this.ball.body.velocity.y = -gameOptions.bounceVelocity;
            }, null, this);

        }
        
        var first_plat_position = false;
        // loop through all platforms
        this.platformGroup.getChildren().forEach(function(platform){

            // if the platform leaves the screen to the left...
            if(platform.getBounds().right < -100){

                // increase the score
                this.updateScore(1);

                // recycle the platform moving it to a new position
                platform.x = this.setPlatformX();
                platform.y = this.setPlatformY();

                // set new platform width
                platform.displayWidth = Phaser.Math.Between(gameOptions.platformLengthRange[0], gameOptions.platformLengthRange[1]);

                // adjust 3D platform scale and y position
                platform.platform3D.scale.x = platform.displayWidth * gameOptions.gameScale;
                
                platform.platform3D.position.y = (this.sys.game.canvas.height - platform.y) * gameOptions.gameScale;


            } 

            // If the screen is resizing, update each plaform
            if(is_resize) {

                //this.sys.game.canvas.width = window.innerWidth; 
                //this.sys.game.canvas.height = window.innerHeight; 

                // Calculate percentage of positioning for ball, and platform
                // Reapply
                
                //console.log(game.config);
                //game.config.height = this.sys.game.canvas.height;

                // Redefine height of 2D platform
                //console.log(screen_last_size);

                var past_height = (platform.y / screen_last_size[1]) * 100;
                platform_new_y = (past_height/100) * this.sys.game.canvas.height;
                platform.y = platform_new_y;

                // Redefine y of 3D platform
                var past_height_3d = (platform.y - 40 / screen_last_size[1]) * 100; 
                platform.platform3D.position.y = (this.sys.game.canvas.height - platform.y) * gameOptions.gameScale;

            } 

            // adjust 3D platform x position
            platform.platform3D.position.x = platform.x * gameOptions.gameScale ;

        }, this);

        if(is_resize) {

            // Reset ball to top to avoid loosing the game
            this.ball.y = 0;
            this.scene.pause();

            screen_last_size = [window.innerWidth, window.innerHeight];

            // Resize camera
            this.camera3D.aspect = this.sys.game.canvas.width / this.sys.game.canvas.height;
            this.camera3D.updateProjectionMatrix();

            // Resize 3d viewport
            this.renderer3D.setViewport(0, 0, window.innerWidth,window.innerHeight);

        }


        // if 2D ball falls down the screen...
        if(this.ball.y > this.sys.game.canvas.height){

            // manage best score
            localStorage.setItem(gameOptions.localStorageName, Math.max(this.score, this.topScore));

            // restart the game
            is_game_restart = true;
            this.scene.start("PlayGame");

        }
        
        // Reposition ball 3D
        var ball3d_y = (this.sys.game.canvas.height - this.ball.y) * gameOptions.gameScale;
        this.ball3D.position.y = (ball3d_y - platform_landscape_ball_compensate) ;
        this.ball3D.position.x = this.ball.x * gameOptions.gameScale;

       
        // Al resizing functions done, reset resize
        
        // If this is a resize and the canvas is shown on screen
        if(is_resize && is_game_on_screen) {
            this.scene.resume("PlayGame");
        }

        // Cancel resize functions
        is_resize = false;

        // First update() run is donw
        if(!is_first_update) {
            is_first_update = true; 
        }


    }    

}



/********************************s
 * GSAP
 */

// use a script tag or an external JS file
document.addEventListener("DOMContentLoaded", (event) => {
   
    gsap.registerPlugin(ScrollTrigger)
    // gsap code here!

    let gameConfig = {
        type: Phaser.AUTO,
        //backgroundColor:0x87ceeb,
        transparent: true,
        antialias: true,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
        },
        physics: {
            default: "arcade",
            arcade: {
                customUpdate: true
            }
        },
        scene: playGame
    }
    game = new Phaser.Game(gameConfig);
    window.focus();


    /**
     * Resize function for Phaser
     * @param  {[type]} gameSize        [description]
     * @param  {[type]} baseSize        [description]
     * @param  {[type]} displaySize     [description]
     * @param  {[type]} previousWidth   [description]
     * @param  {[type]} previousHeight) {                       
     * @return {[type]}                 [description]
     */
    game.scale.on('resize', function(gameSize, baseSize, displaySize, previousWidth, previousHeight) {
    
        // is_first_update doesnt work because it runs earlier than view.render
        //console.log("gameSize " + gameSize + " baseSize: " + baseSize + " displaySize: " + displaySize + " previousWidth: " + previousWidth + " previousHeight: " + previousHeight);
        
        if(game && game.scene.isPaused("PlayGame")) {
            
            // Resize while the game was paused
            is_resize = true;       
            game.scene.scenes[0].manual_update();

        } else {
            // Store screen previous width and height
            //console.log(previousWidth);
            //screen_last_size = [previousWidth, previousHeight];
            is_resize = true;       
        }
        
    }); 


    //game.scene.pause("PlayGame");

    //this.scene.start("PlayGame");

    //*
    gsap.to("#intro", {
        opacity: 1,
        duration: 1
    });

    var btn_start = document.getElementById("btn_start"), 
        intro = document.getElementById("intro");
        
    btn_start.addEventListener("click", function(e) {
        intro.style.display = "none";
        game.scene.resume("PlayGame");
        has_game_started = true;
    });
    //*/

    gsap.to(".panel:not(:last-child)", {
      yPercent: -100, 
      ease: "none",
      stagger: 0.5,
      scrollTrigger: {
        trigger: "#container",
        start: "top top",
        end: "+=100%",
        scrub: true,
        pin: true, 
        //markers: true,
        onUpdate: (self) => {

            //*
            var progress = self.progress.toFixed(3),
                direction = self.direction; 

            //console.log(progress >= 0.5);
            //console.log(direction);

            if(progress >= 0.25 && direction == 1 && ! game.scene.isPaused("PlayGame")) {
                console.log("Pause game");
                is_game_on_screen = false;
                //console.log(game);
                game.scene.pause("PlayGame");
            } else if(progress <= 0.2 && direction == -1 && game.scene.isPaused("PlayGame")) {
                console.log("Play game");
                is_game_on_screen = true;
                game.scene.resume("PlayGame");
            }
            //*/
            
        }
      }
    });


    //gsap.matchMedia()

    gsap.set(".panel", {zIndex: (i, target, targets) => targets.length - i});




});



