var visualizer;

$(document).ready(function () {
    visualizer = new AudioVisualizer();
    visualizer.initialize();
    visualizer.createBars();
    visualizer.setupAudioProcessing();
    visualizer.getAudio();
    visualizer.handleDrop();  
});


function AudioVisualizer() {
    this.numberOfBars = 30;

    //Rendering
    this.scene;
    this.camera;
    this.renderer;
    this.controls;

    //bars
    this.bars = new Array();
    this.flatBars = new Array();

    //audio
    this.javascriptNode;
    this.audioContext;
    this.sourceBuffer;
    this.analyzer;
}

// function loadFont() {
//     var loader = new THREE.FontLoader();
//     loader.load( 'fonts/' + fontName + '_' + fontWeight + '.typeface.json', function ( response ) {
//     font = response;
//     } );
// }

//initialize the visualizer elements
AudioVisualizer.prototype.initialize = function () {
    //generate a ThreeJS Scene
    this.scene = new THREE.Scene();

    //get the width and height
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    //get the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(WIDTH, HEIGHT);

    //append the renderer to the body
    document.body.appendChild(this.renderer.domElement);

    //create and add camera
    this.camera = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 0.1, 20000);
    this.camera.position.set(0, 20, 20);
    this.scene.add(this.camera);

    var that = this;

    //update renderer size, aspect ratio and projection matrix on resize
    window.addEventListener('resize', function () {

        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;

        that.renderer.setSize(WIDTH, HEIGHT);

        that.camera.aspect = WIDTH / HEIGHT;
        that.camera.updateProjectionMatrix();

    });

    //create a light and add it to the scene
    var light = new THREE.PointLight(0xffffff);
    light.position.set(-100, 200, 100);
    this.scene.add(light);

    //add controls to the scene (zoom, rotate...)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
};


//create the bars required to show the visualization
AudioVisualizer.prototype.createBars = function () {



    var loader = new THREE.FontLoader();

    loader.load( 'fonts/helvetiker_bold.typeface.js', function ( font ) {
        console.log('inside')
        var material = new THREE.MeshPhongMaterial({
            color: 'white'
        });
        var textGeom = new THREE.TextGeometry( 'Hello, World!', {
            font: font
        });

        this.flatBars[0] = new THREE.Mesh( textGeom, material );

        textGeom.computeBoundingBox();
        this.flatBars[0] = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
        
        textMesh.position.set( -0.5 * textWidth, 100, 0 );
        scene.add(this.flatBars[0]  );

    } )
     
    


    //iterate and create bars
    for (var i = 0; i < this.numberOfBars; i++) {

        //create a bar
        var curve = new THREE.SplineCurve3([
            new THREE.Vector3(0,0,-14),
            new THREE.Vector3( 0, .2, 0 ),
            new THREE.Vector3(0, 0, 10 ),
        ] );

        var geometry = new THREE.Geometry();
        geometry.vertices = curve.getPoints( 50 );

        //create a material
        var material = new THREE.LineBasicMaterial( { color : 'white' } );

        //create the geometry and set the initial position
        this.bars[i] = new THREE.Line( geometry, material );
        this.bars[i].position.set(i - this.numberOfBars/2, 0, 0);

        //add the created bar to the scene
        this.scene.add(this.bars[i]);
    }
};

AudioVisualizer.prototype.setupAudioProcessing = function () {
    //get the audio context
    this.audioContext = new AudioContext();
    //create the javascript node
    //the buffer size must be a certain value and 4096 was one of the options 
    this.javascriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.javascriptNode.connect(this.audioContext.destination);

    //create the source buffer
    this.sourceBuffer = this.audioContext.createBufferSource();

    //create the analyzer node
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.smoothingTimeConstant = 0.3;

    this.analyzer.fftSize = 512;

    //connect source to the analyzer node
    this.sourceBuffer.connect(this.analyzer);

    //analyzer to speakers
    this.analyzer.connect(this.javascriptNode);

    //connects to the destination of the sound
    this.sourceBuffer.connect(this.audioContext.destination);
    //the above lets us get info on the frequencies of the audio in real
    var that = this;

    //this is where we animates the bars
    this.javascriptNode.onaudioprocess = function () {

        //store this data in a byte array
        var array = new Uint8Array(that.analyzer.frequencyBinCount);
        that.analyzer.getByteFrequencyData(array);

        //render the scene and update controls
        visualizer.renderer.render(visualizer.scene, visualizer.camera);
        visualizer.controls.update();

        var step = Math.round(array.length / visualizer.numberOfBars);

        //Iterate through the bars and scale the z axis
        //left = treble, middle = middle sounds/bass 
        for (var i = 0; i < visualizer.numberOfBars; i++) {
            var value = array[i * step] / 4;
            value = value < 1 ? 1 : value;
            visualizer.bars[i].scale.y = value;
        }
    }

};

//get audio from the server
AudioVisualizer.prototype.getAudio = function () {
    var request = new XMLHttpRequest();
    request.open("GET", 'concatenated_file.mp3', true);
    request.responseType = "arraybuffer";
    request.send();
};

//start the audio processing
AudioVisualizer.prototype.start = function (buffer) {
    console.log('before', buffer)
    this.audioContext.decodeAudioData(buffer, decodeAudioDataSuccess, decodeAudioDataFailed);
    console.log('after')
    var that = this;

    function decodeAudioDataSuccess(decodedBuffer) {
        console.log('decodedBuffer')
        that.sourceBuffer.buffer = decodedBuffer
        that.sourceBuffer.start(0);
    }

    function decodeAudioDataFailed() {
        console.log('failed')
    }
};

// AudioVisualizer.prototype.stop = function () {
// }

AudioVisualizer.prototype.handleDrop = function () {
    //drag Enter
    document.body.addEventListener("dragenter", function () {
       
    }, false);

    //drag over
    document.body.addEventListener("dragover", function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, false);

    //drag leave
    document.body.addEventListener("dragleave", function () {
       
    }, false);

    //drop
    document.body.addEventListener("drop", function (e) {
        e.stopPropagation();

        e.preventDefault();

        //get the file
        var file = e.dataTransfer.files[0];
        var fileName = file.name;

        $("#guide").text("Playing " + fileName);

        var fileReader = new FileReader();
        console.log('in drag and drop')

        fileReader.onload = function (e) {
            var fileResult = e.target.result;
            visualizer.start(fileResult);
        };

        fileReader.onerror = function (e) {
          console.error(e)
        };
       
        fileReader.readAsArrayBuffer(file);
    }, false);


}










