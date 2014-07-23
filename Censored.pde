import processing.video.*;

Capture video;
PImage img;
int cam_index = 12; // The camera to use 23
color color_to_track = color(182, 197, 49);

float xa;
float ya;
float easing = 0.3;
int reading_number = 0;
int reading_count = 0;
int colorX = 0; // X-coordinate of the closest in color video pixel
int colorY = 0; // Y-coordinate of the closest in color video pixel

void setup() {
  size(640, 480); // Change size to 320 x 240 if too slow at 640 x 480
  // Uses the default video input, see the reference if this causes an error
  String[] cameras = Capture.list();

  if (cameras.length == 0) {
    println("There are no cameras available for capture.");
    exit();
  }
  else {
    println("Available cameras:");
    for (int i = 0; i < cameras.length; i++) {
      print("[" + i + "]");
      println(cameras[i]);
    }


    video = new Capture(this, cameras[cam_index]);
    img = loadImage("censored.png");
    video.start();
    noStroke();
    smooth();
  }
}

void draw() {
  if (video.available()) {
    video.read();
    image(video, 0, 0, width, height); // Draw the webcam video onto the screen
    if (reading_count > reading_number) {

      float closestColor = 10000; //we set this to be abritrarily large, once program runs, the first pixel it scans will be set to this value
      // Search for the closest in color pixel: For each row of pixels in the video image and
      // for each pixel in the yth row, compute each pixel's index in the video
      video.loadPixels();
      int index = 0;
      for (int y = 0; y < video.height; y++) {
        for (int x = 0; x < video.width; x++) {
          // Get the color stored in the pixel
          color pixelValue = video.pixels[index];
          // Determine the color of the pixel
          float colorProximity = abs(red(pixelValue) - red(color_to_track)) + abs(green(pixelValue) - green(color_to_track)) + abs(blue(pixelValue) - blue(color_to_track));
          // If that value is closer in color value than any previous, then store the
          // color proximity of that pixel, as well as its (x,y) location
          if (colorProximity < closestColor) {
            closestColor = colorProximity;
            closestColor = closestColor - 10; //thoguht behind this is that it once it "locks" on to an object of color, it wont let go unless something a good bit better (closer in color) comes along
            colorY = y;
            colorX = x;
          }
          index++;
        }
      }
      reading_count = 0;
    }

    float targetX = colorX;
    float dx = targetX - xa;
    if (abs(dx) > 1) {
      xa += dx * easing;
    }

    float targetY = colorY;
    float dy = targetY - ya;
    if (abs(dy) > 1) {
      ya += dy * easing;
    }
    fill(255, 204, 0, 230);
    image(img, xa - img.width/4, ya - img.height/4, img.width/2, img.height/2);
  }
  reading_count++;
}

