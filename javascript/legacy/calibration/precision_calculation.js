/*
 * This function calculates a measurement for how precise 
 * the eye tracker currently is which is displayed to the user
 */
function calculatePrecision(past50Array, pointName) {
  var windowHeight = $(window).height();
  var windowWidth = $(window).width();
  let maxDistance = Math.min(windowWidth, windowHeight) / 4;

  // Retrieve the last 50 gaze prediction points
  var x50 = past50Array[0];
  var y50 = past50Array[1];

  // Calculate the position of the point the user is staring at
  var staringPointX = null;
  var staringPointY = null;
  switch (pointName) {
    case 'middle':
      staringPointX = windowWidth / 2;
      staringPointY = windowHeight / 2;
      maxDistance = windowHeight / 2;
      break;
    case 'upperleft':
      staringPointX = windowWidth / 4;
      staringPointY = windowHeight / 4;
      break;
    case 'upperright':
      staringPointX = windowWidth * 3 / 4;
      staringPointY = windowHeight / 4;
      break;
    case 'lowerleft':
      staringPointX = windowWidth / 4;
      staringPointY = windowHeight * 3 / 4;
      break;
    case 'lowerright':
      staringPointX = windowWidth * 3 / 4;
      staringPointY = windowHeight * 3 / 4;
      break;
  }

  var precisionPercentages = new Array(50);
  calculatePrecisionPercentages(precisionPercentages, maxDistance, x50, y50, staringPointX, staringPointY);
  var precision = calculateAverage(precisionPercentages);

  // Return the precision measurement as a rounded percentage
  return Math.round(precision);
};

/*
 * Calculate percentage accuracy for each prediction based on distance of
 * the prediction point from the centre point (uses the window height as
 * lower threshold 0%)
 */
function calculatePrecisionPercentages(precisionPercentages, maxDistance, x50, y50, staringPointX, staringPointY) {
  for (x = 0; x < 50; x++) {
    // Calculate distance between each prediction and staring point
    var xDiff = staringPointX - x50[x];
    var yDiff = staringPointY - y50[x];
    var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));

    // Calculate precision percentage
    // var halfWindowHeight = windowHeight / 2;
    var precision = 0;
    if (distance <= maxDistance && distance > -1) {
      precision = 100 - (distance / maxDistance * 100);
    } else if (distance > maxDistance) {
      precision = 0;
    } else if (distance > -1) {
      precision = 100;
    }

    // Store the precision
    precisionPercentages[x] = precision;
  }
}

/*
 * Calculates the average of all precision percentages calculated
 */
function calculateAverage(precisionPercentages) {
  var precision = 0;
  for (x = 0; x < 50; x++) {
    precision += precisionPercentages[x];
  }
  precision = precision / 50;
  return precision;
}