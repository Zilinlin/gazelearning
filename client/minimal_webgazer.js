var calibrated = false;

let predictionXArray = [];
let predictionYArray = [];
let standardX = null;
let standardY = null;

const pointSize = 10;
const timeForTest = 5000; // in ms
const debugPoint = 70; // generate DEBUGPOINT points randomly to check canvas correctness

window.onload = async function() {
    // GazeCloudAPI
    GazeCloudAPI.OnCalibrationComplete = function () {
        console.log('gaze Calibration Complete');
        startFlag = confirm("Test will last for 5s. Please stare at the middle red rectangle.");
        if (startFlag) {
            setupCanvas();
            var pos = findAbsolutePosition(document.getElementById('plotting_canvas'));
            hm_left = pos.left;
            hm_top = pos.top;
            calibrated = true;
            console.log(`hm_left ${hm_left}, hm_top ${hm_top}`);
            drawStandard(hm_left, hm_top);
        }
        setTimeout(function (){
            GazeCloudAPI.StopEyeTracking();
            merit = computePrecision();
            console.log(`Precision : ${merit}`);
        }, timeForTest);
    }
    GazeCloudAPI.OnCamDenied = function () { console.log('camera access denied') }
    GazeCloudAPI.OnError = function (msg) { console.log('err: ' + msg) }
    GazeCloudAPI.UseClickRecalibration = true;
    GazeCloudAPI.OnResult = recordPrediction;

    console.log('WebGazer Loaded');

    // WebGazer.js
    webgazer.params.showVideoPreview = true;
    //start the webgazer tracker
    await webgazer.setRegression('ridge') /* currently must set regression and tracker */
        //.setTracker('clmtrackr')
        .setGazeListener(function(data, clock) {
            console.log(data); /* data is an object containing an x and y key which are the x and y prediction coordinates (no bounds limiting) */
            console.log(clock); /* elapsed time in milliseconds since webgazer.begin() was called */
        });
    webgazer.showPredictionPoints(true); /* shows a square every 100 milliseconds where current prediction is */

    console.log('WebGazer Loaded');

    console.log(`WINDOW SIZE INFORMARION : window width ${window.innerWidth}, window height ${window.innerHeight}`);
};

function setupCanvas() {
    //Set up the main canvas. The main canvas is used to calibrate the webgazer.
    var canvas = document.getElementById("plotting_canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.hidden = false; // make canvas visible
}

function recordPrediction(GazeData) {
    var docx = GazeData.docX;
    var docy = GazeData.docY;

    if (calibrated) {
        predictionXArray.push(docx - hm_left); // x coordinate of the datapoint, a number
        predictionYArray.push(docy - hm_top); // y coordinate of the datapoint, a number

        console.log(`Point #${predictionXArray.length} Added.`);

        draw({x:docx - hm_left, y:docy - hm_top}, "prediction"); // Draw prediction
    }
}

function computePrecision() {
    // let standard = document.getElementById("standard");
    // let standardRect = standard.getBoundingClientRect();

    // let standardX = standardRect.left;
    // let standardY = standardRect.top;
    if ( !(standardX&&standardY) ) console.log("No standard point found.");

    let precision = [];

    for (let i = 0; i < predictionXArray.length; i++) {
        let diffX = standardX - predictionXArray[i];
        let diffY = standardY - predictionYArray[i];
        let distance = Math.sqrt(diffX*diffX + diffY*diffY);

        let halfWindowHeight = window.innerHeight / 2;

        if (distance > halfWindowHeight) {
            precision.push(0);
        } else {
            precision.push(100 - (distance/halfWindowHeight)*100);
        }
    }

    const sum = precision.reduce((a, b) => a + b, 0);
    const avg = (sum / precision.length) || 0;

    return avg;
}

function draw(coord, type){
    var canvas = document.getElementById('plotting_canvas');
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');

        if (type == "standard") {
            ctx.fillStyle = "rgba(200, 0, 0, 0.5)";
        } else {
            ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        }
        ctx.fillRect(coord.x - pointSize/2, coord.y - pointSize/2, pointSize, pointSize);       
    }
}

function drawStandard(hm_left, hm_top){
    // Draw standard point
    draw({
        x: (window.innerWidth-hm_left)/2,
        y: (window.innerHeight-hm_top)/2
    }, "standard");
    console.log("Standard point drawed.");

    standardX = (window.innerWidth-hm_left)/2;
    standardY = (window.innerHeight-hm_top)/2;
}

function testStart(model) {
    switch (model) {
        case "webgazer":
            webgazer.begin();
            console.log('WebGazer Starts');
            setTimeout(webgazer.end(), 5000);
            break;
        case "gazecloud":
            GazeCloudAPI.StartEyeTracking();
            console.log('GazeCloudAPI Starts');
            break;
        default:
            console.log("Illegal model type.");
            break;
    }
}

function findAbsolutePosition(htmlElement) {
    var x = htmlElement.offsetLeft;
    var y = htmlElement.offsetTop;
    for (var x = 0, y = 0, el = htmlElement;
        el != null;
        el = el.offsetParent) {
        x += el.offsetLeft;
        y += el.offsetTop;
    }
    return {
        "left": x,
        "top": y
    };
}

function debugCode() {
    // Setup canvas
    setupCanvas();

    // Calculate calibration for heatmap/canvas
    var pos = findAbsolutePosition(document.getElementById('plotting_canvas'));
    hm_left = pos.left;
    hm_top = pos.top;
    calibrated = true;
    console.log(`hm_left ${hm_left}, hm_top ${hm_top}`);

    // Draw standard point
    drawStandard(hm_left, hm_top);
    
    // Generate random points
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
    for (i = 0; i < debugPoint; i++) {
        recordPrediction({
            docX : getRandomArbitrary(0, window.innerWidth-hm_left),
            docY : getRandomArbitrary(0, window.innerHeight-hm_top),
        });
    }

    // Compute precision
    merit = computePrecision();
    console.log(`Precision : ${merit}`);
}